// SessionPage – Vollbild-Erfassungsscreen
//
// Aufbau (nie scrollbar):
//   Header      – fix oben: Partie-Info + Trophy + Hamburger-Menü
//   Filztisch   – füllt den Rest: Spieler absolut positioniert
//   EyesBar     – fix unten: Augeneingabe + Auswerten-Button
//
// Tisch-Layout: 4 aktive Spieler in den Ecken, bis zu 3 Aussetzer an den Kanten.
// Jeder Spieler-Cluster hat eine unveränderliche Position – nichts springt.

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { calcSeatStatus, getTablePosition } from '@/lib/seatUtils'
import { calculateGameResult, deriveGameType } from '@/lib/scoreCalculation'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import PlayerSheet from '@/components/session/PlayerSheet'
import EyesBar from '@/components/session/EyesBar'
import EvaluationView from '@/components/session/EvaluationView'
import { Trophy, Menu, X } from 'lucide-react'

// ─── Konstanten ────────────────────────────────────────────────────────────────

// Feste Reihenfolge der Ansage-Badges auf dem Tisch (unabhängig von Eingabe-Reihenfolge)
const ANNOUNCEMENT_ORDER  = ['re', 'kontra', 'keine_90', 'keine_60', 'keine_30', 'schwarz']
const ANNOUNCEMENT_LABELS = { re: 'Re', kontra: 'Ko', keine_90: 'K9', keine_60: 'K6', keine_30: 'K3', schwarz: 'Sw' }

const SOLO_SHORT = {
  fleischlos: 'Fleisch', buben_solo: 'Buben', damen_solo: 'Damen',
  farb_solo: 'Farb', stilles_solo: 'Still',
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

function getRoleLabel(specialRole, soloType) {
  if (!specialRole) return ''
  if (specialRole === 'solist') return SOLO_SHORT[soloType] ?? 'Solo'
  return { hochzeit: 'HZ', eingeheiratet: 'EH', arm: 'arm', reich: 'reich' }[specialRole] ?? ''
}

function initGameState(participants) {
  const parties = {}
  const announcements = {}
  for (const p of participants) {
    parties[p.player_id] = p.isSitting ? 'ausgesetzt' : null
    announcements[p.player_id] = []
  }
  return { parties, announcements, specialRoles: {}, soloType: null, soloColor: null, specialPoints: [], eyesInput: '', eyesFor: null }
}

function isGameValid(gameState, participants) {
  const active    = participants.filter(p => !p.isSitting)
  const reCount   = active.filter(p => gameState.parties[p.player_id] === 're').length
  const koCount   = active.filter(p => gameState.parties[p.player_id] === 'kontra').length
  const hasSolo   = Object.values(gameState.specialRoles).some(r => r === 'solist')
  const teamsOk   = hasSolo ? reCount === 1 && koCount === 3 : reCount === 2 && koCount === 2
  const eyesOk    = gameState.eyesInput !== '' && !isNaN(parseInt(gameState.eyesInput)) && gameState.eyesFor !== null
  return teamsOk && eyesOk
}

function buildCalculationInput(gameState, participants) {
  const eyesNum = parseInt(gameState.eyesInput)
  const reEyes  = gameState.eyesFor === 're' ? eyesNum : 240 - eyesNum
  const announcements = []
  for (const [playerId, types] of Object.entries(gameState.announcements)) {
    const party = gameState.parties[playerId]
    if (!party || party === 'ausgesetzt') continue
    for (const type of types) announcements.push({ party, type })
  }
  const specialPoints = gameState.specialPoints.map(sp => ({ ...sp, earnerParty: gameState.parties[sp.earnerId] }))
  const playerResults = participants.map(p => ({
    playerId: p.player_id,
    party: gameState.parties[p.player_id] ?? 'ausgesetzt',
    specialRole: gameState.specialRoles[p.player_id] ?? null,
  }))
  return { reEyes, gameType: deriveGameType(gameState.specialRoles, gameState.soloType), announcements, specialPoints, playerResults }
}

// ─── Tisch-Unterkomponenten ────────────────────────────────────────────────────

// Kleines Ansage-Badge (quadratisch) für den Tisch
function AnnBadge({ type }) {
  const label = ANNOUNCEMENT_LABELS[type]
  const colorCls = type === 're'
    ? 'bg-green-600 text-white'
    : type === 'kontra'
    ? 'bg-amber-500 text-white'
    : 'bg-white/70 text-gray-800'
  return (
    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-sm text-[9px] font-bold leading-none ${colorCls}`}>
      {label}
    </span>
  )
}

// Kleines Sonderpunkt-Badge für den Tisch (Platzhalter – wird durch SVG-Icons ersetzt)
function SpBadge({ label, color }) {
  const colorCls = color === 'green' ? 'bg-green-500/80 text-white'
    : color === 'red'   ? 'bg-red-500/80 text-white'
    : 'bg-white/70 text-gray-800'
  return (
    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-sm text-[9px] font-bold leading-none ${colorCls}`}>
      {label}
    </span>
  )
}

// Sonderpunkte-Spalte neben dem Avatar (4 feste Zeilen, max. 2 Icons pro Zeile)
// Reihenfolge: Karlchen (letzter Stich) / Fuchs / Doko 1+2 / Doko 3+4
// Wird ABSOLUT neben dem Cluster positioniert → beeinflusst nie die Cluster-Breite
function SonderpunkteCol({ gameState, playerId, isLeft }) {
  const sp = gameState.specialPoints
  const karlGemacht  = sp.filter(s => s.type === 'karlchen_gemacht'  && s.earnerId === playerId)
  const karlGefangen = sp.filter(s => s.type === 'karlchen_gefangen' && s.earnerId === playerId)
  const karlVerloren = sp.filter(s => s.type === 'karlchen_gefangen' && s.loserId  === playerId)
  const earnedFuchs  = sp.filter(s => s.type === 'fuchs_gefangen'    && s.earnerId === playerId)
  const lostFuchs    = sp.filter(s => s.type === 'fuchs_gefangen'    && s.loserId  === playerId)
  const dokoPoints   = sp.filter(s => s.type === 'doppelkopf'        && s.earnerId === playerId)
  const rowDir = isLeft ? 'flex-row' : 'flex-row-reverse'
  const ROW = `flex ${rowDir} gap-0.5 min-h-[14px] items-center`

  return (
    <div className="flex flex-col gap-0.5">
      {/* Zeile 1: Karlchen (füllt sich erst im letzten Stich) */}
      <div className={ROW}>
        {karlVerloren.length > 0
          ? karlVerloren.map(s => <SpBadge key={s.id} label="Kv" color="red" />)
          : <>
              {karlGemacht.map(s  => <SpBadge key={s.id} label="K"  color="green" />)}
              {karlGefangen.map(s => <SpBadge key={s.id} label="Kg" color="green" />)}
            </>
        }
      </div>
      {/* Zeile 2: Fuchs */}
      <div className={ROW}>
        {earnedFuchs.map(s => <SpBadge key={s.id} label="F"  color="green" />)}
        {lostFuchs.map(s   => <SpBadge key={s.id} label="Fv" color="red"   />)}
      </div>
      {/* Zeile 3: Doko 1+2 */}
      <div className={ROW}>
        {dokoPoints.slice(0, 2).map(s => <SpBadge key={s.id} label="D" color="neutral" />)}
      </div>
      {/* Zeile 4: Doko 3+4 */}
      <div className={ROW}>
        {dokoPoints.slice(2, 4).map(s => <SpBadge key={s.id} label="D" color="neutral" />)}
      </div>
    </div>
  )
}

// Vertikaler Re/N/Ko-Toggle für den Tisch
function VerticalToggle({ playerId, party, onPartyChange }) {
  return (
    <div className="flex flex-col rounded-lg border border-white/30 overflow-hidden shrink-0">
      {[
        { value: 're',     label: 'Re' },
        { value: null,     label: '·'  },
        { value: 'kontra', label: 'Ko' },
      ].map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => onPartyChange(playerId, opt.value)}
          className={`w-7 h-7 text-[10px] font-bold transition-colors ${
            party === opt.value
              ? opt.value === 're'     ? 'bg-green-600 text-white'
              : opt.value === 'kontra' ? 'bg-amber-500 text-white'
              : 'bg-white/30 text-white'
              : 'bg-black/20 text-white/60'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// Geber-Chip: kleiner gelber Kreis an der inneren Avatar-Ecke
function GebChip({ side, vertical }) {
  const pos = {
    'left-bottom':  'top-0 right-0 -translate-y-1/3 translate-x-1/3',
    'left-top':     'bottom-0 right-0 translate-y-1/3 translate-x-1/3',
    'right-bottom': 'top-0 left-0 -translate-y-1/3 -translate-x-1/3',
    'right-top':    'bottom-0 left-0 translate-y-1/3 -translate-x-1/3',
    // Aussetzer-Kanten
    'left-middle':  'top-1/2 right-0 -translate-y-1/2 translate-x-1/2',
    'top-top':      'bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2',
    'right-middle': 'top-1/2 left-0 -translate-y-1/2 -translate-x-1/2',
  }[`${side}-${vertical}`] ?? 'top-0 right-0'

  return (
    <span className={`absolute ${pos} w-[14px] h-[14px] rounded-full bg-yellow-400 text-yellow-900 text-[8px] font-black flex items-center justify-center z-10`}>
      G
    </span>
  )
}

// Vollständiger aktiver Spieler-Cluster (Ecke)
// Sonderpunkte werden ABSOLUT neben dem Cluster positioniert – wachsen nie in den Bildrand
function CornerPlayer({ participant, layout, gameState, onTap, onPartyChange }) {
  const { side, vertical } = layout
  const isLeft   = side === 'left'
  const isBottom = vertical === 'bottom'
  const playerId = participant.player_id
  const party    = gameState.parties[playerId] ?? null
  const anns     = gameState.announcements[playerId] ?? []
  const role     = gameState.specialRoles[playerId]
  const roleLabel = getRoleLabel(role, gameState.soloType)
  const activeAnns = ANNOUNCEMENT_ORDER.filter(t => anns.includes(t))
  const rowDir = isLeft ? 'flex-row' : 'flex-row-reverse'

  // Ansagen-Zeile mit fester Mindesthöhe (immer Platz reserviert, auch wenn leer)
  const AnnouncementRow = () => (
    <div className={`flex ${rowDir} gap-0.5 min-h-[16px] items-center`}>
      {activeAnns.map(t => <AnnBadge key={t} type={t} />)}
    </div>
  )

  // Name + Rolle mit fester Mindesthöhe (Rolle reserviert Platz auch wenn leer)
  const NameBlock = () => (
    <div className="flex flex-col items-center">
      <span className="text-white text-[11px] font-semibold leading-tight text-center max-w-[72px] truncate">
        {participant.players.name}
      </span>
      <span className="text-white/70 text-[9px] leading-tight min-h-[11px]">
        {roleLabel}
      </span>
    </div>
  )

  return (
    <div
      className="absolute"
      style={{ left: `${layout.x}%`, top: `${layout.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {/* Relativer Wrapper: Bezugspunkt für die absolut positionierten Sonderpunkte */}
      <div className="relative">

        {/* Sonderpunkte: absolut, auf der Innenseite des Clusters, vertikal zentriert */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={isLeft
            ? { left: '100%', marginLeft: '5px' }
            : { right: '100%', marginRight: '5px' }
          }
        >
          <SonderpunkteCol gameState={gameState} playerId={playerId} isLeft={isLeft} />
        </div>

        {/* Haupt-Cluster mit hellem Backdrop */}
        <div className="bg-white/15 rounded-2xl p-1.5 flex flex-col gap-0.5">

          {/* Oben: Ansagen (Unten-Spieler, innen) ODER Name+Rolle (Oben-Spieler, außen) */}
          {isBottom ? <AnnouncementRow /> : <NameBlock />}

          {/* Mitte: Toggle + Avatar */}
          <div className={`flex items-center gap-1.5 ${rowDir}`}>

            <VerticalToggle playerId={playerId} party={party} onPartyChange={onPartyChange} />

            <div className="relative shrink-0">
              <button
                onClick={() => onTap(playerId)}
                className="rounded-full active:opacity-70 block"
              >
                <PlayerAvatar player={participant.players} size="md" />
                {party && (
                  <span className={`absolute inset-0 rounded-full ring-2 pointer-events-none ${
                    party === 're' ? 'ring-green-400' : 'ring-amber-400'
                  }`} />
                )}
              </button>
              {participant.isDealer && <GebChip side={side} vertical={vertical} />}
            </div>
          </div>

          {/* Unten: Name+Rolle (Unten-Spieler, außen) ODER Ansagen (Oben-Spieler, innen) */}
          {isBottom ? <NameBlock /> : <AnnouncementRow />}
        </div>
      </div>
    </div>
  )
}

// Kompakter Spieler (Aussetzer-Slots an den Kanten, oder sitzender Eck-Spieler)
function CompactPlayer({ participant, layout, onTap }) {
  const { side, vertical } = layout
  const isSitting  = participant.isSitting
  const isTopEdge  = side === 'top'  // oben-mitte Aussetzer
  const nameAbove  = isTopEdge || vertical === 'top'

  return (
    <div
      className="absolute flex flex-col items-center gap-0.5"
      style={{
        left: `${layout.x}%`,
        top:  `${layout.y}%`,
        transform: 'translate(-50%, -50%)',
        opacity: isSitting ? 0.45 : 0.8,
      }}
    >
      {nameAbove && (
        <span className="text-white text-[10px] font-medium text-center leading-tight max-w-[56px] truncate">
          {participant.players.name}
        </span>
      )}
      <div className="relative">
        <button
          onClick={() => !isSitting && onTap(participant.player_id)}
          className={isSitting ? 'cursor-default' : 'active:opacity-70'}
        >
          <PlayerAvatar player={participant.players} size="sm" />
        </button>
        {participant.isDealer && <GebChip side={side} vertical={vertical} />}
      </div>
      {!nameAbove && (
        <span className="text-white text-[10px] font-medium text-center leading-tight max-w-[56px] truncate">
          {participant.players.name}
        </span>
      )}
    </div>
  )
}

// ─── Hamburger-Menü ────────────────────────────────────────────────────────────

function SessionMenu({ onClose, onGoHome, onEndSession }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-16 right-4 z-50 bg-card rounded-2xl shadow-xl overflow-hidden min-w-[200px]">
        <button
          onClick={onGoHome}
          className="w-full px-4 py-3 text-sm text-left text-foreground hover:bg-muted border-b border-border"
        >
          Ins Hauptmenü
        </button>
        <button
          onClick={onEndSession}
          className="w-full px-4 py-3 text-sm text-left text-destructive hover:bg-muted"
        >
          Abend beenden
        </button>
      </div>
    </>
  )
}

// ─── Hauptkomponente ───────────────────────────────────────────────────────────

export default function SessionPage() {
  const { id: sessionId } = useParams()
  const navigate = useNavigate()

  const [sessionData,   setSessionData]   = useState(null)
  const [roundData,     setRoundData]     = useState(null)
  const [participants,  setParticipants]  = useState([])
  const [gameNumber,    setGameNumber]    = useState(1)
  const [loading,       setLoading]       = useState(true)
  const [gameState,     setGameState]     = useState(null)
  const [openSheetId,   setOpenSheetId]   = useState(null)
  const [view,          setView]          = useState('table')
  const [evalResult,    setEvalResult]    = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)

  // Daten laden
  useEffect(() => {
    async function load() {
      const { data: session } = await supabase
        .from('sessions').select('*, venues(name)').eq('id', sessionId).single()
      const { data: round } = await supabase
        .from('rounds').select('*').eq('session_id', sessionId).eq('status', 'laufend')
        .order('number', { ascending: false }).limit(1).single()
      const { data: parts } = await supabase
        .from('round_participations').select('*, players(id, name, avatar_url)')
        .eq('round_id', round.id).order('seat_position')
      const { count } = await supabase
        .from('games').select('id', { count: 'exact', head: true }).eq('round_id', round.id)

      const nextGameNum = (count ?? 0) + 1
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

  const refreshSeatStatus = useCallback((num, rawParts) => {
    const updated = calcSeatStatus(rawParts, num)
    setParticipants(updated)
    setGameState(initGameState(updated))
  }, [])

  // ─── State-Mutationen ──────────────────────────────────────────────────────

  const handlePartyChange = useCallback((playerId, party) => {
    setGameState(prev => {
      const newAnns = { ...prev.announcements }
      if (party === 'kontra' && newAnns[playerId]?.includes('re'))
        newAnns[playerId] = newAnns[playerId].filter(t => t !== 're')
      if (party === 're' && newAnns[playerId]?.includes('kontra'))
        newAnns[playerId] = newAnns[playerId].filter(t => t !== 'kontra')
      return { ...prev, parties: { ...prev.parties, [playerId]: party }, announcements: newAnns }
    })
  }, [])

  // Re und Kontra schließen sich als Ansage gegenseitig aus
  const handleAnnouncementToggle = useCallback((playerId, type) => {
    setGameState(prev => {
      const current = prev.announcements[playerId] ?? []
      let updated
      if (current.includes(type)) {
        updated = current.filter(t => t !== type)
      } else {
        updated = type === 're'     ? [...current.filter(t => t !== 'kontra'), 're']
                : type === 'kontra' ? [...current.filter(t => t !== 're'), 'kontra']
                : [...current, type]
      }
      return { ...prev, announcements: { ...prev.announcements, [playerId]: updated } }
    })
  }, [])

  const handleSpecialRoleSet = useCallback((playerId, role, extraData) => {
    setGameState(prev => {
      const newRoles   = { ...prev.specialRoles, [playerId]: role }
      const newParties = { ...prev.parties }
      if (role === 'solist') {
        for (const p of participants) {
          if (p.isSitting) continue
          newParties[p.player_id] = p.player_id === playerId ? 're' : 'kontra'
        }
      }
      return {
        ...prev,
        specialRoles: newRoles,
        parties:      newParties,
        soloType:     extraData?.soloType  ?? prev.soloType,
        soloColor:    extraData?.soloColor ?? prev.soloColor,
      }
    })
  }, [participants])

  const handleSpecialRoleClear = useCallback((playerId) => {
    setGameState(prev => {
      const clearedRole = prev.specialRoles[playerId]
      const newRoles    = { ...prev.specialRoles }
      delete newRoles[playerId]
      if (clearedRole === 'hochzeit') {
        for (const [pid, r] of Object.entries(newRoles)) if (r === 'eingeheiratet') delete newRoles[pid]
      }
      if (clearedRole === 'arm') {
        for (const [pid, r] of Object.entries(newRoles)) if (r === 'reich') delete newRoles[pid]
      }
      return { ...prev, specialRoles: newRoles, soloType: null, soloColor: null }
    })
  }, [])

  const handleSpecialPointAdd = useCallback((earnerId, type, loserId) => {
    setGameState(prev => ({
      ...prev,
      specialPoints: [...prev.specialPoints, { id: crypto.randomUUID(), type, earnerId, loserId: loserId ?? null }],
    }))
  }, [])

  const handleSpecialPointRemove = useCallback((pointId) => {
    setGameState(prev => ({ ...prev, specialPoints: prev.specialPoints.filter(sp => sp.id !== pointId) }))
  }, [])

  // ─── Auswertung ────────────────────────────────────────────────────────────

  function handleEvaluate() {
    const result = calculateGameResult(buildCalculationInput(gameState, participants))
    setEvalResult(result)
    setView('evaluate')
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      const input   = buildCalculationInput(gameState, participants)
      const { data: game } = await supabase.from('games').insert({
        round_id:  roundData.id,
        number:    gameNumber,
        game_type: input.gameType,
        farbe:     gameState.soloColor ?? null,
        augen_re:  input.reEyes,
      }).select().single()

      await supabase.from('game_results').insert(
        participants.map(p => ({
          game_id:     game.id,
          player_id:   p.player_id,
          partei:      gameState.parties[p.player_id] ?? 'ausgesetzt',
          sonderrolle: gameState.specialRoles[p.player_id] ?? null,
          zaehlopunkte: evalResult.perPlayer[p.player_id] ?? 0,
        }))
      )

      const announcementsInsert = []
      for (const [playerId, types] of Object.entries(gameState.announcements))
        for (const type of types)
          announcementsInsert.push({ game_id: game.id, player_id: playerId, typ: type })
      if (announcementsInsert.length > 0) await supabase.from('announcements').insert(announcementsInsert)

      const specialPointsInsert = gameState.specialPoints.map(sp => ({
        game_id: game.id, player_id: sp.earnerId, typ: sp.type, loser_id: sp.loserId ?? null,
      }))
      if (specialPointsInsert.length > 0) await supabase.from('special_points').insert(specialPointsInsert)

      const nextNum = gameNumber + 1
      const rawParts = participants.map(p => ({
        player_id: p.player_id, players: p.players, seat_position: p.seat_position,
        round_id: p.round_id, id: p.id,
      }))
      setGameNumber(nextNum)
      refreshSeatStatus(nextNum, rawParts)
      setEvalResult(null)
      setView('table')
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading || !gameState) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">Lade…</div>
    )
  }

  const activePlayers    = participants.filter(p => !p.isSitting)
  const valid            = isGameValid(gameState, participants)
  const openSheetPlayer  = openSheetId ? participants.find(p => p.player_id === openSheetId) : null
  const venueName        = sessionData?.venues?.name ?? ''
  const dateStr          = formatDate(sessionData?.date)

  // Eck-Spieler (Sitze 1–4) bekommen das volle Layout, alle anderen den kompakten Compact-Player
  const isCornerSeat = (seatPos) => seatPos <= 4

  return (
    <div className="overflow-hidden flex flex-col select-none" style={{ height: '100dvh' }}>

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 pt-12 pb-3 bg-background border-b border-border z-10">

        {/* Links: leer (kein Zurück-Button mehr) */}
        <div className="w-16" />

        {/* Mitte: Partie-Info */}
        <div className="text-center flex-1">
          <p className="text-[11px] text-muted-foreground leading-tight">
            {[dateStr, venueName].filter(Boolean).join(' · ')}
          </p>
          <p className="text-sm font-semibold leading-tight">
            Spiel {gameNumber} · Runde {roundData.number}
          </p>
        </div>

        {/* Rechts: Trophy + Hamburger */}
        <div className="flex items-center gap-1 w-16 justify-end">
          <button className="p-1.5 text-muted-foreground" title="Spielstand kommt später">
            <Trophy size={18} />
          </button>
          <button className="p-1.5 text-muted-foreground" onClick={() => setShowMenu(true)}>
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* ─── Filztisch ───────────────────────────────────────────────────── */}
      <main
        className="flex-1 relative overflow-hidden"
        style={{ backgroundColor: '#2d5a27' }}
      >
        {participants.map(p => {
          const layout = getTablePosition(p.seat_position, participants.length)

          if (isCornerSeat(p.seat_position) && !p.isSitting) {
            // Vollständiger aktiver Eck-Spieler
            return (
              <CornerPlayer
                key={p.player_id}
                participant={p}
                layout={layout}
                gameState={gameState}
                onTap={setOpenSheetId}
                onPartyChange={handlePartyChange}
              />
            )
          }

          // Kompakter Spieler: sitzender Eck-Spieler ODER Aussetzer-Slot-Spieler
          return (
            <CompactPlayer
              key={p.player_id}
              participant={p}
              layout={layout}
              onTap={setOpenSheetId}
            />
          )
        })}
      </main>

      {/* ─── EyesBar ─────────────────────────────────────────────────────── */}
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

      {/* ─── Hamburger-Menü ──────────────────────────────────────────────── */}
      {showMenu && (
        <SessionMenu
          onClose={() => setShowMenu(false)}
          onGoHome={() => navigate('/')}
          onEndSession={() => {
            // TODO: Bestätigungs-Dialog + Session abschließen
            navigate('/')
          }}
        />
      )}

      {/* ─── Player Sheet ────────────────────────────────────────────────── */}
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

      {/* ─── Auswertungs-Screen ──────────────────────────────────────────── */}
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
