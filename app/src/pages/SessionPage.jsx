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
import { Trophy, Menu, ArrowLeft } from 'lucide-react'

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

const FARB_EMOJI = { karo: '♦', herz: '♥', pik: '♠', kreuz: '♣' }

function getRoleLabel(specialRole, soloType, soloColor) {
  if (!specialRole) return ''
  if (specialRole === 'solist') {
    const labels = {
      fleischlos:   'Fleischlos',
      buben_solo:   'Buben-Solo',
      damen_solo:   'Damen-Solo',
      farb_solo:    soloColor ? `Farb-Solo ${FARB_EMOJI[soloColor] ?? ''}` : 'Farb-Solo',
      stilles_solo: 'Stilles Solo',
    }
    return labels[soloType] ?? 'Solo'
  }
  return {
    hochzeit:      'Hochzeit',
    eingeheiratet: 'Eingeheiratet',
    arm:           'Armut (arm)',
    reich:         'Armut (reich)',
  }[specialRole] ?? ''
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

// Kleines Ansage-Badge (quadratisch) für den Tisch – Größe über CSS-Variablen fluid
function AnnBadge({ type }) {
  const label = ANNOUNCEMENT_LABELS[type]
  const colorCls = type === 're'
    ? 'bg-green-600 text-white'
    : type === 'kontra'
    ? 'bg-amber-500 text-white'
    : 'bg-white/70 text-gray-800'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm font-bold leading-none ${colorCls}`}
      style={{ width: 'var(--tisch-ann)', height: 'var(--tisch-ann)', fontSize: 'var(--tisch-text-xs)' }}
    >
      {label}
    </span>
  )
}

// Kleines Sonderpunkt-Badge für den Tisch (Platzhalter – wird durch SVG-Icons ersetzt)
// Größe über CSS-Variablen fluid: 2 Stück + Gap ergeben die Spaltenbreite (--tisch-sp-col)
function SpBadge({ label, color }) {
  const colorCls = color === 'green' ? 'bg-green-500/90 text-white'
    : color === 'red'   ? 'bg-red-500/90 text-white'
    : 'bg-white/80 text-gray-800'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm font-bold leading-none shrink-0 ${colorCls}`}
      style={{ width: 'var(--tisch-sp-bdg)', height: 'var(--tisch-sp-bdg)', fontSize: 'var(--tisch-text-xs)' }}
    >
      {label}
    </span>
  )
}

// Sonderpunkte-Spalte neben dem Avatar (4 feste Zeilen, max. 2 Icons pro Zeile)
// Reihenfolge: Karlchen / Fuchs / Doko 1+2 / Doko 3+4
// Breite und Zeilenhöhe über CSS-Variablen fluid → Cluster wächst nie mit dem Inhalt
function SonderpunkteCol({ gameState, playerId, isLeft }) {
  const sp = gameState.specialPoints
  const karlGemacht  = sp.filter(s => s.type === 'karlchen_gemacht'  && s.earnerId === playerId)
  const karlGefangen = sp.filter(s => s.type === 'karlchen_gefangen' && s.earnerId === playerId)
  const karlVerloren = sp.filter(s => s.type === 'karlchen_gefangen' && s.loserId  === playerId)
  const earnedFuchs  = sp.filter(s => s.type === 'fuchs_gefangen'    && s.earnerId === playerId)
  const lostFuchs    = sp.filter(s => s.type === 'fuchs_gefangen'    && s.loserId  === playerId)
  const dokoPoints   = sp.filter(s => s.type === 'doppelkopf'        && s.earnerId === playerId)
  const rowDir = isLeft ? 'flex-row' : 'flex-row-reverse'
  const ROW = `flex ${rowDir} gap-0.5 items-center`
  const rowStyle = { height: 'var(--tisch-sp-bdg)' }

  return (
    <div className="flex flex-col gap-1 shrink-0" style={{ width: 'var(--tisch-sp-col)' }}>
      {/* Zeile 1: Karlchen (füllt sich erst im letzten Stich) */}
      <div className={ROW} style={rowStyle}>
        {karlVerloren.length > 0
          ? karlVerloren.map(s => <SpBadge key={s.id} label="Kv" color="red" />)
          : <>
              {karlGemacht.map(s  => <SpBadge key={s.id} label="K"  color="green" />)}
              {karlGefangen.map(s => <SpBadge key={s.id} label="Kg" color="green" />)}
            </>
        }
      </div>
      {/* Zeile 2: Fuchs */}
      <div className={ROW} style={rowStyle}>
        {earnedFuchs.map(s => <SpBadge key={s.id} label="F"  color="green" />)}
        {lostFuchs.map(s   => <SpBadge key={s.id} label="Fv" color="red"   />)}
      </div>
      {/* Zeile 3: Doko 1+2 */}
      <div className={ROW} style={rowStyle}>
        {dokoPoints.slice(0, 2).map(s => <SpBadge key={s.id} label="D" color="neutral" />)}
      </div>
      {/* Zeile 4: Doko 3+4 */}
      <div className={ROW} style={rowStyle}>
        {dokoPoints.slice(2, 4).map(s => <SpBadge key={s.id} label="D" color="neutral" />)}
      </div>
    </div>
  )
}

// Vertikaler Re/N/Ko-Toggle für den Tisch – Größe über CSS-Variablen fluid
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
          style={{ width: 'var(--tisch-tog)', height: 'var(--tisch-tog)', fontSize: 'var(--tisch-text-tog)' }}
          className={`font-bold transition-colors ${
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

// Geber-Chip: gelber Kreis auf der inneren Ecke des Backdrops (zur Tischmitte)
// Größe über CSS-Variablen fluid
function GebChip({ side, vertical }) {
  // Welche Ecke des Backdrops zeigt zur Tischmitte?
  const pos = {
    'left-bottom':  'top-0 right-0 -translate-y-1/2 translate-x-1/2',
    'left-top':     'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
    'right-bottom': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
    'right-top':    'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
    // Aussetzer-Kanten
    'left-middle':  'top-1/2 right-0 -translate-y-1/2 translate-x-1/2',
    'top-top':      'bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2',
    'right-middle': 'top-1/2 left-0 -translate-y-1/2 -translate-x-1/2',
  }[`${side}-${vertical}`] ?? 'top-0 right-0'

  return (
    <span
      className={`absolute ${pos} rounded-full bg-yellow-400 text-yellow-900 font-black flex items-center justify-center z-10 shadow-sm`}
      style={{ width: 'var(--tisch-geb)', height: 'var(--tisch-geb)', fontSize: 'var(--tisch-text-sm)' }}
    >
      G
    </span>
  )
}

// Vollständiger aktiver Spieler-Cluster (Ecke)
// Toggle liegt absolut in der äußeren Ecke des Backdrops (unten-außen / oben-außen).
// Der Backdrop hat auf der Außenseite extra Padding = toggle-Breite + 10px, damit
// Avatar und Badges nicht mit dem Toggle überlappen.
function CornerPlayer({ participant, layout, gameState, onTap, onPartyChange }) {
  const { side, vertical } = layout
  const isLeft   = side === 'left'
  const isBottom = vertical === 'bottom'
  const playerId = participant.player_id
  const party    = gameState.parties[playerId] ?? null
  const anns     = gameState.announcements[playerId] ?? []
  const role      = gameState.specialRoles[playerId]
  const roleLabel = getRoleLabel(role, gameState.soloType, gameState.soloColor)
  const activeAnns = ANNOUNCEMENT_ORDER.filter(t => anns.includes(t))
  const rowDir = isLeft ? 'flex-row' : 'flex-row-reverse'

  // Ansagen-Zeile mit Mindesthöhe (Platz bleibt reserviert wenn leer)
  const AnnouncementRow = () => (
    <div className={`flex ${rowDir} gap-0.5 min-h-[16px] items-center`}>
      {activeAnns.map(t => <AnnBadge key={t} type={t} />)}
    </div>
  )

  // Name + optionale Rolle, Reihenfolge je nach Position
  const NameBlock = () => (
    <div className="flex flex-col items-center">
      {!isBottom && (
        <span className="text-white/70 leading-tight min-h-[11px] text-center"
              style={{ fontSize: 'var(--tisch-text-sm)' }}>
          {roleLabel}
        </span>
      )}
      <span className="text-white font-semibold leading-tight text-center max-w-[72px] truncate"
            style={{ fontSize: 'var(--tisch-text-md)' }}>
        {participant.players.name}
      </span>
      {isBottom && (
        <span className="text-white/70 leading-tight min-h-[11px] text-center"
              style={{ fontSize: 'var(--tisch-text-sm)' }}>
          {roleLabel}
        </span>
      )}
    </div>
  )

  return (
    <div
      className="absolute"
      style={{ left: `${layout.x}%`, top: `${layout.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {/* Backdrop – extra Padding auf der Außenseite schafft Platz für den absoluten Toggle */}
      <div
        className="relative bg-white/15 rounded-2xl p-1.5 flex flex-col gap-0.5"
        style={{
          paddingLeft:  isLeft ? 'calc(var(--tisch-tog) + 10px)' : undefined,
          paddingRight: isLeft ? undefined : 'calc(var(--tisch-tog) + 10px)',
        }}
      >
        {/* Geber-Chip auf der inneren Backdrop-Ecke (zur Tischmitte) */}
        {participant.isDealer && <GebChip side={side} vertical={vertical} />}

        {/* Toggle absolut in der äußeren Ecke: unten-außen (Unten-Spieler) / oben-außen (Oben-Spieler) */}
        <div
          className={`absolute ${isBottom ? 'bottom-1.5' : 'top-1.5'} ${isLeft ? 'left-1.5' : 'right-1.5'}`}
          style={{ zIndex: 2 }}
        >
          <VerticalToggle playerId={playerId} party={party} onPartyChange={onPartyChange} />
        </div>

        {/* Oben: Ansagen (Unten-Spieler) ODER Name+Rolle (Oben-Spieler) */}
        {isBottom ? <AnnouncementRow /> : <NameBlock />}

        {/* Mitte: Avatar + Sonderpunkte (Toggle jetzt in äußerer Ecke, nicht mehr hier) */}
        <div className={`flex items-center gap-1.5 ${rowDir}`}>
          <button
            onClick={() => onTap(playerId)}
            className="rounded-full active:opacity-70 shrink-0 block"
          >
            <PlayerAvatar
              player={participant.players}
              size="md"
              style={{ width: 'var(--tisch-av)', height: 'var(--tisch-av)' }}
            />
          </button>
          <SonderpunkteCol gameState={gameState} playerId={playerId} isLeft={isLeft} />
        </div>

        {/* Unten: Name+Rolle (Unten-Spieler) ODER Ansagen (Oben-Spieler) */}
        {isBottom ? <NameBlock /> : <AnnouncementRow />}
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
          <PlayerAvatar
            player={participant.players}
            size="sm"
            style={{ width: 'var(--tisch-av-sm)', height: 'var(--tisch-av-sm)' }}
          />
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

function SessionMenu({ onClose, onEndSession }) {
  const greyItems = ['Hauptmenü', 'Tischordnung', 'Statistiken']
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-16 right-4 z-50 bg-card rounded-2xl shadow-xl overflow-hidden min-w-[200px]">
        {greyItems.map((label, i) => (
          <div
            key={label}
            className={`px-4 py-3 text-sm text-muted-foreground/40 ${i < greyItems.length - 1 ? 'border-b border-border' : ''}`}
          >
            {label}
          </div>
        ))}
        <div className="border-t border-border" />
        <button
          onClick={onEndSession}
          className="w-full px-4 py-3 text-sm text-left text-destructive active:bg-muted"
        >
          Partie beenden
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
    <div className="flex flex-col select-none" style={{ position: 'fixed', inset: 0 }}>

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 pt-12 pb-3 bg-background border-b border-border z-10">

        {/* Links: Zurück-Pfeil */}
        <button onClick={() => navigate(-1)} className="p-1.5 text-muted-foreground w-16">
          <ArrowLeft size={20} />
        </button>

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
      {/* CSS-Variablen steuern alle fixen Pixel-Größen im Tisch per clamp().
          Formel: clamp(min_375px, referenzwert_vw, max_ab_~550px)
          Referenz: iPhone 15 = 390px. Nur der Tisch ist fluid – Sheet/Header/EyesBar nicht. */}
      <main
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundColor: '#2d5a27',
          '--tisch-av':       'clamp(44px, 14.4vw, 80px)',
          '--tisch-av-sm':    'clamp(32px, 10.3vw, 58px)',
          '--tisch-tog':      'clamp(22px, 7.2vw, 40px)',
          '--tisch-sp-col':   'clamp(24px, 7.7vw, 44px)',
          '--tisch-sp-bdg':   'clamp(11px, 3.6vw, 20px)',
          '--tisch-ann':      'clamp(13px, 4.1vw, 23px)',
          '--tisch-geb':      'clamp(18px, 6.2vw, 36px)',
          '--tisch-text-xs':  'clamp(6px, 2.1vw, 12px)',
          '--tisch-text-sm':  'clamp(7px, 2.3vw, 13px)',
          '--tisch-text-md':  'clamp(9px, 2.8vw, 16px)',
          '--tisch-text-tog': 'clamp(8px, 2.6vw, 15px)',
        }}
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
