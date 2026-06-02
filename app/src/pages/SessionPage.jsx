// SessionPage – Vollbild-Erfassungsscreen für eine aktive Partie
// Lädt Session + aktuelle Runde + Teilnehmer aus Supabase.
// Verwaltet den gesamten Spielzustand lokal bis zur Bestätigung.
// Keine Tab-Bar – maximale Fläche für die Spielerfassung.

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { calcSeatStatus, getTablePosition } from '@/lib/seatUtils'
import { calculateGameResult, deriveGameType } from '@/lib/scoreCalculation'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import PlayerSheet from '@/components/session/PlayerSheet'
import EyesBar from '@/components/session/EyesBar'
import EvaluationView from '@/components/session/EvaluationView'
import { Trophy, ArrowLeft } from 'lucide-react'

// ============================================================
// Hilfsfunktionen für den Spielzustand
// ============================================================

// Erstellt einen leeren Spielzustand für ein neues Spiel
function initGameState(participants) {
  const parties = {}
  const announcements = {}
  for (const p of participants) {
    parties[p.player_id] = p.isSitting ? 'ausgesetzt' : null
    announcements[p.player_id] = []
  }
  return {
    parties,
    announcements, // { playerId: ['re'|'kontra'|'keine_90'|...] }
    specialRoles: {},  // { playerId: 'solist'|'hochzeiter'|'eingeheiratet'|'armut'|'retter' }
    soloType: null,    // 'fleischlos'|'buben_solo'|'damen_solo'|'farb_solo'|'stilles_solo'
    soloColor: null,
    specialPoints: [], // [{ id, type, earnerId, loserId }]
    eyesInput: '',
    eyesFor: null,     // 're' | 'kontra'
  }
}

// Prüft ob der Spielzustand vollständig und konsistent ist (Auswerten-Button aktiv?)
function isGameValid(gameState, participants) {
  const active = participants.filter(p => !p.isSitting)
  const reCount     = active.filter(p => gameState.parties[p.player_id] === 're').length
  const kontraCount = active.filter(p => gameState.parties[p.player_id] === 'kontra').length
  const hasSolo     = Object.values(gameState.specialRoles).some(r => r === 'solist')
  const eyesOk      = gameState.eyesInput !== '' && !isNaN(parseInt(gameState.eyesInput)) && gameState.eyesFor !== null

  // Bei Solo: 1 Re (Solist) + 3 Kontra; sonst: 2 Re + 2 Kontra
  const teamsOk = hasSolo ? reCount === 1 && kontraCount === 3 : reCount === 2 && kontraCount === 2
  return teamsOk && eyesOk
}

// Konvertiert den lokalen Spielzustand in die Parameter für calculateGameResult
function buildCalculationInput(gameState, participants) {
  const eyesNum = parseInt(gameState.eyesInput)
  const reEyes  = gameState.eyesFor === 're' ? eyesNum : 240 - eyesNum

  // Ansagen flach als Array [{party, type}]
  const announcements = []
  for (const [playerId, types] of Object.entries(gameState.announcements)) {
    const party = gameState.parties[playerId]
    if (!party || party === 'ausgesetzt') continue
    for (const type of types) {
      announcements.push({ party, type })
    }
  }

  // Sonderpunkte mit earnerParty
  const specialPoints = gameState.specialPoints.map(sp => ({
    ...sp,
    earnerParty: gameState.parties[sp.earnerId],
  }))

  // Spielergebnisse
  const playerResults = participants.map(p => ({
    playerId: p.player_id,
    party: gameState.parties[p.player_id] ?? 'ausgesetzt',
    specialRole: gameState.specialRoles[p.player_id] ?? null,
  }))

  const gameType = deriveGameType(gameState.specialRoles, gameState.soloType)

  return { reEyes, gameType, announcements, specialPoints, playerResults }
}

// ============================================================
// Hauptkomponente
// ============================================================

export default function SessionPage() {
  const { id: sessionId } = useParams()
  const navigate = useNavigate()

  // --- Daten aus Supabase ---
  const [sessionData, setSessionData]     = useState(null)
  const [roundData, setRoundData]         = useState(null)
  const [participants, setParticipants]   = useState([]) // mit seat_position, isDealer, isSitting
  const [gameNumber, setGameNumber]       = useState(1)
  const [loading, setLoading]             = useState(true)

  // --- UI-Zustand ---
  const [gameState, setGameState]         = useState(null)
  const [openSheetId, setOpenSheetId]     = useState(null) // player_id des offenen Sheets
  const [view, setView]                   = useState('table') // 'table' | 'evaluate'
  const [evalResult, setEvalResult]       = useState(null)
  const [saving, setSaving]               = useState(false)

  // --- Daten laden ---
  useEffect(() => {
    async function load() {
      // Session laden
      const { data: session } = await supabase
        .from('sessions')
        .select('*, venues(name)')
        .eq('id', sessionId)
        .single()

      // Laufende Runde der Session laden
      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'laufend')
        .order('number', { ascending: false })
        .limit(1)
        .single()

      // Teilnehmer der Runde mit Spielerdaten laden
      const { data: parts } = await supabase
        .from('round_participations')
        .select('*, players(id, name, avatar_url)')
        .eq('round_id', round.id)
        .order('seat_position')

      // Wieviele Spiele gibt es schon in dieser Runde? → nächste Spielnummer
      const { count } = await supabase
        .from('games')
        .select('id', { count: 'exact', head: true })
        .eq('round_id', round.id)

      const nextGameNum = (count ?? 0) + 1

      // Sitz-Status (wer gibt, wer setzt aus) für das erste Spiel berechnen
      const partsWithStatus = calcSeatStatus(parts, nextGameNum)

      setSessionData(session)
      setRoundData(round)
      setParticipants(partsWithStatus)
      setGameNumber(nextGameNum)
      setGameState(initGameState(partsWithStatus))
      setLoading(false)
    }
    load()
  }, [sessionId])

  // Teilnehmer-Status bei Spielnummer-Wechsel aktualisieren
  const refreshSeatStatus = useCallback((num, rawParts) => {
    const updated = calcSeatStatus(rawParts, num)
    setParticipants(updated)
    setGameState(initGameState(updated))
  }, [])

  // ============================================================
  // Spielzustand-Mutationen (alle als Callbacks an Kind-Komponenten)
  // ============================================================

  // Partei eines Spielers setzen (Re/Kontra/null)
  // Entfernt gleichzeitig kollidierende Ansagen
  const handlePartyChange = useCallback((playerId, party) => {
    setGameState(prev => {
      const newAnnouncements = { ...prev.announcements }

      // Kollidierender Zustand: Re-Ansage bei Kontra-Partei → Re-Ansage entfernen
      if (party === 'kontra' && newAnnouncements[playerId]?.includes('re')) {
        newAnnouncements[playerId] = newAnnouncements[playerId].filter(t => t !== 're')
      }
      if (party === 're' && newAnnouncements[playerId]?.includes('kontra')) {
        newAnnouncements[playerId] = newAnnouncements[playerId].filter(t => t !== 'kontra')
      }

      return {
        ...prev,
        parties: { ...prev.parties, [playerId]: party },
        announcements: newAnnouncements,
      }
    })
  }, [])

  // Ansage ein/ausschalten
  const handleAnnouncementToggle = useCallback((playerId, type) => {
    setGameState(prev => {
      const current = prev.announcements[playerId] ?? []
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type]

      // Re-Ansage setzt automatisch Re-Partei (falls noch nicht gesetzt)
      const newParties = { ...prev.parties }
      if (type === 're' && !current.includes('re') && newParties[playerId] !== 're') {
        newParties[playerId] = 're'
      }
      if (type === 'kontra' && !current.includes('kontra') && newParties[playerId] !== 'kontra') {
        newParties[playerId] = 'kontra'
      }

      return {
        ...prev,
        parties: newParties,
        announcements: { ...prev.announcements, [playerId]: updated },
      }
    })
  }, [])

  // Sonderrolle setzen (Solo, Hochzeit, Armut etc.)
  // Bei Solo: alle anderen aktiven Spieler werden automatisch Kontra
  const handleSpecialRoleSet = useCallback((playerId, role, extraData) => {
    setGameState(prev => {
      const newRoles = { ...prev.specialRoles, [playerId]: role }
      const newParties = { ...prev.parties }

      if (role === 'solist') {
        // Solist = Re, alle anderen aktiven Spieler = Kontra
        for (const p of participants) {
          if (p.isSitting) continue
          newParties[p.player_id] = p.player_id === playerId ? 're' : 'kontra'
        }
      }

      return {
        ...prev,
        specialRoles: newRoles,
        parties: newParties,
        soloType:  extraData?.soloType  ?? prev.soloType,
        soloColor: extraData?.soloColor ?? prev.soloColor,
      }
    })
  }, [participants])

  // Sonderrolle entfernen
  const handleSpecialRoleClear = useCallback((playerId) => {
    setGameState(prev => {
      // Wenn Solist entfernt wird, auch alle Kontra-Zuordnungen zurücksetzen
      const clearedRole = prev.specialRoles[playerId]
      const newRoles = { ...prev.specialRoles }
      delete newRoles[playerId]

      // Bei Hochzeit/Armut auch den Partner entfernen
      if (clearedRole === 'hochzeiter') {
        for (const [pid, role] of Object.entries(newRoles)) {
          if (role === 'eingeheiratet') delete newRoles[pid]
        }
      }
      if (clearedRole === 'armut') {
        for (const [pid, role] of Object.entries(newRoles)) {
          if (role === 'retter') delete newRoles[pid]
        }
      }

      return { ...prev, specialRoles: newRoles, soloType: null, soloColor: null }
    })
  }, [])

  // Sonderpunkt hinzufügen
  const handleSpecialPointAdd = useCallback((earnerId, type, loserId) => {
    setGameState(prev => ({
      ...prev,
      specialPoints: [
        ...prev.specialPoints,
        { id: crypto.randomUUID(), type, earnerId, loserId: loserId ?? null },
      ],
    }))
  }, [])

  // Sonderpunkt entfernen
  const handleSpecialPointRemove = useCallback((pointId) => {
    setGameState(prev => ({
      ...prev,
      specialPoints: prev.specialPoints.filter(sp => sp.id !== pointId),
    }))
  }, [])

  // ============================================================
  // Auswertung
  // ============================================================

  function handleEvaluate() {
    const input = buildCalculationInput(gameState, participants)
    const result = calculateGameResult(input)
    setEvalResult(result)
    setView('evaluate')
  }

  // Spiel bestätigen und in Supabase speichern
  async function handleConfirm() {
    setSaving(true)
    try {
      const input   = buildCalculationInput(gameState, participants)
      const reEyes  = input.reEyes
      const gameType = input.gameType

      // --- Spiel anlegen ---
      const { data: game } = await supabase
        .from('games')
        .insert({
          round_id:  roundData.id,
          number:    gameNumber,
          game_type: gameType,
          farbe:     gameState.soloColor ?? null,
          augen_re:  reEyes,
        })
        .select()
        .single()

      // --- Spielergebnisse (zaehlopunkte aus Berechnung) ---
      const gameResultsInsert = participants.map(p => ({
        game_id:    game.id,
        player_id:  p.player_id,
        partei:     gameState.parties[p.player_id] ?? 'ausgesetzt',
        sonderrolle: gameState.specialRoles[p.player_id] ?? null,
        zaehlopunkte: evalResult.perPlayer[p.player_id] ?? 0,
      }))
      await supabase.from('game_results').insert(gameResultsInsert)

      // --- Ansagen ---
      const announcementsInsert = []
      for (const [playerId, types] of Object.entries(gameState.announcements)) {
        for (const type of types) {
          announcementsInsert.push({ game_id: game.id, player_id: playerId, typ: type })
        }
      }
      if (announcementsInsert.length > 0) {
        await supabase.from('announcements').insert(announcementsInsert)
      }

      // --- Sonderpunkte ---
      const specialPointsInsert = gameState.specialPoints.map(sp => ({
        game_id:   game.id,
        player_id: sp.earnerId,
        typ:       sp.type,
        loser_id:  sp.loserId ?? null,
      }))
      if (specialPointsInsert.length > 0) {
        await supabase.from('special_points').insert(specialPointsInsert)
      }

      // --- Nächstes Spiel vorbereiten ---
      const nextNum = gameNumber + 1

      // Rohes participants-Array ohne Status (für Neuberechnung)
      const rawParts = participants.map(p => ({
        player_id:     p.player_id,
        players:       p.players,
        seat_position: p.seat_position,
        round_id:      p.round_id,
        id:            p.id,
      }))

      setGameNumber(nextNum)
      refreshSeatStatus(nextNum, rawParts)
      setEvalResult(null)
      setView('table')
    } catch (err) {
      console.error('Fehler beim Speichern des Spiels:', err)
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // Render
  // ============================================================

  if (loading || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Lade…
      </div>
    )
  }

  // Aktive (nicht aussetzende) Spieler
  const activePlayers = participants.filter(p => !p.isSitting)
  const valid = isGameValid(gameState, participants)

  // Spieler dessen Sheet gerade offen ist
  const openSheetPlayer = openSheetId
    ? participants.find(p => p.player_id === openSheetId)
    : null

  return (
    <div className="min-h-screen bg-background flex flex-col select-none">

      {/* Schmale Kopfzeile */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-3 bg-background border-b border-border">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Beenden</span>
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold">Runde {roundData.number} · Spiel {gameNumber}</p>
          <p className="text-xs text-muted-foreground">{sessionData?.venues?.name ?? sessionData?.date}</p>
        </div>

        {/* Ranglisten-Button (Funktion kommt in späterer Iteration) */}
        <button className="text-muted-foreground p-1">
          <Trophy size={18} />
        </button>
      </header>

      {/* Tischbereich – füllt den Platz zwischen Header und EyesBar */}
      <main
        className="flex-1 relative"
        style={{ paddingTop: '80px', paddingBottom: '72px' }}
      >
        <div className="relative w-full h-full" style={{ minHeight: 'calc(100vh - 152px)' }}>

          {/* Alle Spieler absolut positioniert */}
          {participants.map(p => {
            const pos = getTablePosition(p.seat_position, participants.length)
            const isSitting = p.isSitting
            const party = gameState.parties[p.player_id]
            const announcements = gameState.announcements[p.player_id] ?? []
            const specialRole = gameState.specialRoles[p.player_id]

            return (
              <div
                key={p.player_id}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="flex flex-col items-center gap-1"
              >
                {/* Geber-Chip */}
                {p.isDealer && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-1.5 py-0.5 rounded-full">
                    G
                  </span>
                )}

                {/* Avatar (Tap öffnet Sheet, außer bei Aussetzern) */}
                <button
                  onClick={() => !isSitting && setOpenSheetId(p.player_id)}
                  className={`relative rounded-full transition-opacity ${
                    isSitting ? 'opacity-35 cursor-default' : 'active:opacity-70'
                  }`}
                >
                  <PlayerAvatar
                    player={p.players}
                    size={isSitting ? 'sm' : 'md'}
                  />

                  {/* Parteifarbiger Ring */}
                  {party === 're' && !isSitting && (
                    <span className="absolute inset-0 rounded-full ring-2 ring-green-600" />
                  )}
                  {party === 'kontra' && !isSitting && (
                    <span className="absolute inset-0 rounded-full ring-2 ring-amber-500" />
                  )}
                </button>

                {/* Spielername */}
                <span className={`text-xs font-medium ${isSitting ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {p.players.name}
                </span>

                {/* Drei-Zustands-Partei-Toggle (nur aktive Spieler) */}
                {!isSitting && (
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {[
                      { value: 're',     label: 'Re' },
                      { value: null,     label: '·' },
                      { value: 'kontra', label: 'Ko' },
                    ].map(opt => (
                      <button
                        key={String(opt.value)}
                        onClick={() => handlePartyChange(p.player_id, opt.value)}
                        className={`w-8 h-6 text-xs font-semibold transition-colors ${
                          party === opt.value
                            ? opt.value === 're'
                              ? 'bg-green-700 text-white'
                              : opt.value === 'kontra'
                              ? 'bg-amber-500 text-white'
                              : 'bg-muted-foreground/30 text-foreground'
                            : 'bg-background text-muted-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Angepinnte Badges (Ansagen + Sonderrolle) */}
                {!isSitting && (announcements.length > 0 || specialRole) && (
                  <div className="flex flex-wrap justify-center gap-1 max-w-[90px]">
                    {specialRole && (
                      <span className="text-xs bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full">
                        {specialRole === 'solist' ? 'Solo' :
                         specialRole === 'hochzeiter' ? 'Hochzeit' :
                         specialRole === 'eingeheiratet' ? 'EH' :
                         specialRole === 'armut' ? 'Armut' :
                         specialRole === 'retter' ? 'Rett.' : specialRole}
                      </span>
                    )}
                    {announcements.map(type => (
                      <span
                        key={type}
                        className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full"
                      >
                        {type === 'keine_90' ? 'K90' :
                         type === 'keine_60' ? 'K60' :
                         type === 'keine_30' ? 'K30' :
                         type === 'schwarz'  ? 'Sz'  :
                         type === 're'       ? 'Re'  :
                         type === 'kontra'   ? 'Ko'  : type}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sonderpunkte-Badges */}
                {!isSitting && gameState.specialPoints.filter(sp => sp.earnerId === p.player_id).length > 0 && (
                  <div className="flex flex-wrap justify-center gap-0.5 max-w-[90px]">
                    {gameState.specialPoints
                      .filter(sp => sp.earnerId === p.player_id)
                      .map(sp => (
                        <span key={sp.id} className="text-xs">
                          {sp.type === 'fuchs_gefangen'    ? '🦊' :
                           sp.type === 'karlchen_gemacht'  ? '♞✓' :
                           sp.type === 'karlchen_gefangen' ? '♞×' :
                           sp.type === 'doppelkopf'        ? '💰' : '?'}
                        </span>
                      ))
                    }
                  </div>
                )}

                {/* "Verloren"-Hinweis: Fuchs/Karlchen verloren (abgeleitet) */}
                {!isSitting && (() => {
                  const lost = gameState.specialPoints.filter(sp => sp.loserId === p.player_id)
                  if (lost.length === 0) return null
                  return (
                    <div className="flex flex-wrap justify-center gap-0.5">
                      {lost.map(sp => (
                        <span key={sp.id} className="text-xs text-muted-foreground">
                          {sp.type === 'fuchs_gefangen'    ? '🦊↑' :
                           sp.type === 'karlchen_gefangen' ? '♞↑'  : '?'}
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </main>

      {/* Untere Augeneingabe-Leiste */}
      {view === 'table' && (
        <EyesBar
          eyesInput={gameState.eyesInput}
          eyesFor={gameState.eyesFor}
          onEyesChange={val => setGameState(prev => ({ ...prev, eyesInput: val }))}
          onEyesForChange={party => setGameState(prev => ({ ...prev, eyesFor: party }))}
          onEvaluate={handleEvaluate}
          isValid={valid}
        />
      )}

      {/* Bottom Sheet für Spieler (wenn offen) */}
      {view === 'table' && openSheetPlayer && (
        <PlayerSheet
          player={openSheetPlayer}
          gameState={gameState}
          activePlayers={activePlayers}
          onPartyChange={handlePartyChange}
          onAnnouncementToggle={handleAnnouncementToggle}
          onSpecialRoleSet={handleSpecialRoleSet}
          onSpecialRoleClear={handleSpecialRoleClear}
          onSpecialPointAdd={handleSpecialPointAdd}
          onSpecialPointRemove={handleSpecialPointRemove}
          onClose={() => setOpenSheetId(null)}
        />
      )}

      {/* Auswertungs-Screen (Vollbild-Overlay) */}
      {view === 'evaluate' && (
        <EvaluationView
          result={evalResult}
          activePlayers={activePlayers}
          gameState={gameState}
          gameNumber={gameNumber}
          roundNumber={roundData.number}
          onConfirm={handleConfirm}
          onBack={() => setView('table')}
          saving={saving}
        />
      )}
    </div>
  )
}
