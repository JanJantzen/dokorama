// sessions.js – Partien für den Homescreen laden, löschen, Datum formatieren
//
// loadSessions holt alle Partien mit Ort, Spieler:innen (eindeutig über alle Runden)
// und – bei laufenden Partien – dem aktuellen Runden-/Spielfortschritt. Sortiert nach
// Startzeitpunkt (created_at), neueste zuerst.

import { supabase } from './supabase'

// "16. Juni 2026"
export function formatSessionDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function loadSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, date, status, created_at, venues(name), rounds(number, status, games(id, game_results(player_id, zaehlopunkte)), round_participations(seat_position, players(id, name)))')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(s => {
    const rounds = [...(s.rounds ?? [])].sort((a, b) => a.number - b.number)

    // Spieler:innen eindeutig über alle Runden (in Sitzreihenfolge der ersten Runde)
    const byId = new Map()
    for (const r of rounds)
      for (const rp of [...(r.round_participations ?? [])].sort((a, b) => a.seat_position - b.seat_position))
        if (rp.players && !byId.has(rp.players.id)) byId.set(rp.players.id, rp.players.name)
    const playerNames = [...byId.values()]

    // Runden-/Spielzahl
    const roundsCount = rounds.length
    const gamesCount  = rounds.reduce((a, r) => a + (r.games?.length ?? 0), 0)

    // Endstand: Zählpunkte pro Spieler:in über alle Spiele summieren, absteigend sortiert
    const totals = new Map()
    for (const r of rounds)
      for (const g of (r.games ?? []))
        for (const gr of (g.game_results ?? []))
          totals.set(gr.player_id, (totals.get(gr.player_id) ?? 0) + (gr.zaehlopunkte ?? 0))
    const standings = [...totals.entries()]
      .map(([pid, total]) => ({ name: byId.get(pid) ?? '?', total }))
      .sort((a, b) => b.total - a.total)

    // Fortschritt der laufenden Runde (nur bei laufenden Partien)
    let progress = null
    if (s.status === 'laufend') {
      const live = rounds.find(r => r.status === 'laufend') ?? rounds[rounds.length - 1]
      if (live) progress = { round: live.number, game: (live.games?.length ?? 0) + 1 }
    }

    return {
      id:        s.id,
      date:      s.date,
      status:    s.status,
      createdAt: s.created_at,
      venueName: s.venues?.name ?? null,
      playerNames,
      roundsCount,
      gamesCount,
      standings,
      progress,
    }
  })
}

// Lädt alle Spiele einer Partie für die Details-Block-Ansicht: nach Runde gruppiert,
// je Spiel die aktiven Spieler:innen pro Team mit Punkten, Ansagen und Sonderpunkten
// (eigene = erzielt, fremde = wo man Bestohlene:r war).
export async function loadSessionGames(sessionId) {
  const { data, error } = await supabase
    .from('rounds')
    .select('number, games(number, game_type, farbe, game_results(player_id, partei, zaehlopunkte, sonderrolle, players(name, avatar_url)), announcements(player_id, typ), special_points(player_id, typ, loser_id))')
    .eq('session_id', sessionId)
    .order('number')

  if (error) throw error

  return data
    .map(r => ({
      number: r.number,
      games: [...(r.games ?? [])]
        .sort((a, b) => a.number - b.number)
        .map(g => {
          const anns = g.announcements ?? []
          const sps  = g.special_points ?? []

          const buildPlayer = (gr) => ({
            playerId:  gr.player_id,
            name:      gr.players?.name ?? '?',
            avatarUrl: gr.players?.avatar_url ?? null,
            party:     gr.partei,
            points:    gr.zaehlopunkte ?? 0,
            role:      gr.sonderrolle ?? null,
            anns:      anns.filter(a => a.player_id === gr.player_id).map(a => a.typ),
            earnedSp:  sps.filter(s => s.player_id === gr.player_id),
            lostSp:    sps.filter(s => s.loser_id === gr.player_id),
          })

          const active = (g.game_results ?? []).filter(gr => gr.partei !== 'ausgesetzt')
          return {
            number:   g.number,
            gameType: g.game_type,
            farbe:    g.farbe,
            re:       active.filter(gr => gr.partei === 're').map(buildPlayer),
            kontra:   active.filter(gr => gr.partei === 'kontra').map(buildPlayer),
          }
        }),
    }))
    .filter(r => r.games.length > 0)
}

// Löscht eine Partie. Runden, Spiele, Ergebnisse etc. gehen per ON DELETE CASCADE mit.
export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}
