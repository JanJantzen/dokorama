// games.js – ein gespeichertes Spiel zum Bearbeiten laden und zurückschreiben
//
// loadGameForEdit rekonstruiert aus der DB den Erfassungs-Zustand (gameState) +
// die Teilnehmer:innen (mit Geber/Aussetzer), sodass die normale Erfassungs-UI
// das Spiel vorbefüllt anzeigen kann. updateGame schreibt den bearbeiteten Stand
// zurück (statt ein neues Spiel anzulegen).
//
// Phase A: nur app-erfasste Spiele (exakte Augen). Historische Importe mit
// Augen-Range bleiben read-only.

import { supabase } from './supabase'
import { calcSeatStatus } from './seatUtils'
import { isSolo, deriveGameType } from './scoreCalculation'
import { ANNOUNCED_SOLO_TYPES, loadRoundProgress } from './rounds'
import { generateId } from './utils'

// Lädt ein Spiel und baut { gameState, participants, roundNumber, gameNumber, sessionId }
export async function loadGameForEdit(gameId) {
  const { data: g, error } = await supabase
    .from('games')
    .select(`
      id, number, game_type, farbe, augen_re, augen_re_min, round_id,
      game_results(player_id, partei, sonderrolle),
      announcements(player_id, typ),
      special_points(player_id, typ, loser_id),
      rounds(number, session_id, games(number, game_type), round_participations(id, player_id, seat_position, players(id, name, avatar_url)))
    `)
    .eq('id', gameId)
    .single()

  if (error) throw error

  const round = g.rounds
  const rawParts = [...(round.round_participations ?? [])]
    .sort((a, b) => a.seat_position - b.seat_position)
    .map(rp => ({ id: rp.id, round_id: g.round_id, player_id: rp.player_id, players: rp.players, seat_position: rp.seat_position }))

  // Geber/Aussetzer für genau dieses Spiel (angesagte Solos davor halten den Geber an)
  const solosBefore = (round.games ?? [])
    .filter(x => x.number < g.number && ANNOUNCED_SOLO_TYPES.includes(x.game_type)).length
  const participants = calcSeatStatus(rawParts, g.number, solosBefore)

  // Erfassungs-Zustand rekonstruieren
  const parties = {}, announcements = {}, specialRoles = {}
  for (const p of participants) {
    parties[p.player_id] = p.isSitting ? 'ausgesetzt' : null
    announcements[p.player_id] = []
  }
  for (const gr of (g.game_results ?? [])) {
    if (gr.partei) parties[gr.player_id] = gr.partei
    if (gr.sonderrolle) specialRoles[gr.player_id] = gr.sonderrolle
  }
  for (const a of (g.announcements ?? [])) {
    (announcements[a.player_id] ??= []).push(a.typ)
  }
  const specialPoints = (g.special_points ?? []).map(sp => ({
    id: generateId(), type: sp.typ, earnerId: sp.player_id, loserId: sp.loser_id ?? null,
  }))

  const gameState = {
    parties, announcements, specialRoles,
    soloType:   isSolo(g.game_type) ? g.game_type : null,
    soloColor:  g.farbe ?? null,
    specialPoints,
    eyesInput:  g.augen_re != null ? String(g.augen_re) : '',
    eyesFor:    g.augen_re != null ? 're' : null,
  }

  return {
    gameState,
    participants,
    roundId:     g.round_id,
    roundNumber: round.number,
    gameNumber:  g.number,
    sessionId:   round.session_id,
    isHistorical: g.augen_re == null && g.augen_re_min != null, // Range-Import → nicht editierbar
  }
}

// Schreibt den bearbeiteten Stand zurück. perPlayer = berechnete Zählpunkte (aus der
// Auswertung). game_results wird pro Person in-place aktualisiert (keine Delete-Policy
// nötig); Ansagen/Sonderpunkte werden ersetzt.
export async function updateGame(gameId, { gameState, participants, perPlayer }) {
  const eyesNum  = parseInt(gameState.eyesInput)
  const reEyes   = gameState.eyesFor === 're' ? eyesNum : 240 - eyesNum
  const gameType = deriveGameType(gameState.specialRoles, gameState.soloType)

  const { error: e1 } = await supabase.from('games').update({
    game_type: gameType,
    farbe:     gameState.soloColor ?? null,
    augen_re:  reEyes,
  }).eq('id', gameId)
  if (e1) throw e1

  // Ergebnisse pro Person aktualisieren (jede Teilnahme hat bereits eine Zeile)
  for (const p of participants) {
    const { error } = await supabase.from('game_results').update({
      partei:       gameState.parties[p.player_id] ?? 'ausgesetzt',
      sonderrolle:  gameState.specialRoles[p.player_id] ?? null,
      zaehlpunkte:  perPlayer[p.player_id] ?? 0,
    }).eq('game_id', gameId).eq('player_id', p.player_id)
    if (error) throw error
  }

  // Ansagen ersetzen
  await supabase.from('announcements').delete().eq('game_id', gameId)
  const annIns = []
  for (const [pid, types] of Object.entries(gameState.announcements))
    for (const t of types) annIns.push({ game_id: gameId, player_id: pid, typ: t })
  if (annIns.length) {
    const { error } = await supabase.from('announcements').insert(annIns)
    if (error) throw error
  }

  // Sonderpunkte ersetzen
  await supabase.from('special_points').delete().eq('game_id', gameId)
  const spIns = gameState.specialPoints.map(sp => ({
    game_id: gameId, player_id: sp.earnerId, typ: sp.type, loser_id: sp.loserId ?? null,
  }))
  if (spIns.length) {
    const { error } = await supabase.from('special_points').insert(spIns)
    if (error) throw error
  }
}

// Prüft, ob eine Runde noch zu ihrer Soll-Spielzahl passt.
//
// Warum das nach einer Bearbeitung nötig ist: Die Soll-Länge einer Runde ist
// Teilnehmerzahl + angesagte Solos. Wird beim Bearbeiten ein angesagter Solo
// NACHGETRAGEN oder ZURÜCKGENOMMEN (z.B. aus einem Normalspiel wird ein Buben-Solo),
// verschiebt sich dieses Soll um ein Spiel – die Runde ist dann plötzlich zu kurz
// oder zu lang. Automatisch reparieren wäre gefährlich: es müsste ein Spiel aus dem
// Nichts entstehen oder ein erfasstes Spiel verschwinden. Deshalb nur melden; was
// passieren soll, entscheidet der/die Nutzer:in.
//
// Rückgabe: { status, played, target, mismatch } – mismatch < 0 = zu wenige Spiele,
// mismatch > 0 = zu viele, 0 = alles stimmt.
export async function checkRoundLength(roundId) {
  const { data: round, error } = await supabase
    .from('rounds').select('number, status, round_participations(id)').eq('id', roundId).single()
  if (error) throw error

  const teilnehmerzahl = (round.round_participations ?? []).length
  const { played, target } = await loadRoundProgress(roundId, teilnehmerzahl)

  return {
    roundNumber: round.number,
    status:      round.status,
    played, target,
    mismatch:    played - target,
  }
}
