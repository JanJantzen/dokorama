// TableView – Tisch-Ansicht für die Spielerfassung
//
// Zeigt den grünen Filztisch mit 4 aktiven Spielern in den Ecken (Uhrzeigersinn)
// und Aussetzern an den Kanten. Alle Infos werden direkt am Avatar angepinnt.
// Liest Spielzustand aus GameContext, Partie-Daten aus SessionContext.

import { useState, useRef, useEffect } from 'react'
import { useGame, isGameValid, buildCalculationInput } from '@/contexts/GameContext'
import { useSession } from '@/contexts/SessionContext'
import { calculateGameResult } from '@/lib/scoreCalculation'
import { getDisplayPositions } from '@/lib/seatUtils'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import PlayerSheet from '@/components/session/PlayerSheet'
import EyesBar from '@/components/session/EyesBar'

import iconFuchsGemacht    from '@/assets/icons/icon-fuchs-gemacht.png'
import iconFuchsVerloren   from '@/assets/icons/icon-fuchs-verloren.png'
import iconDoppelkopf      from '@/assets/icons/icon-doppelkopf.png'
import iconKarlchenGemacht  from '@/assets/icons/icon-karlchen-gemacht.png'
import iconKarlchenGefangen from '@/assets/icons/icon-karlchen-gefangen.png'
import iconKarlchenVerloren from '@/assets/icons/icon-karlchen-verloren.png'
import iconDealer           from '@/assets/icons/icon-dealer.png'

// ─── Konstanten ────────────────────────────────────────────────────────────────

const ANNOUNCEMENT_ORDER  = ['re', 'kontra', 'keine_90', 'keine_60', 'keine_30', 'schwarz']
const ANNOUNCEMENT_LABELS = {
  re: 'Re', kontra: 'Ko', keine_90: 'K9', keine_60: 'K6', keine_30: 'K3', schwarz: 'Sw',
}
const FARB_EMOJI = { karo: '♦', herz: '♥', pik: '♠', kreuz: '♣' }

function getRoleLabel(specialRole, soloType, soloColor) {
  if (!specialRole) return ''
  if (specialRole === 'solist') {
    return {
      fleischlos:   'Fleischlos',
      buben_solo:   'Buben-Solo',
      damen_solo:   'Damen-Solo',
      farb_solo:    soloColor ? `Farb-Solo ${FARB_EMOJI[soloColor] ?? ''}` : 'Farb-Solo',
      stilles_solo: 'Stilles Solo',
    }[soloType] ?? 'Solo'
  }
  return {
    hochzeit:      'Hochzeit',
    eingeheiratet: 'Eingeheiratet',
    arm:           'Armut (arm)',
    reich:         'Armut (reich)',
  }[specialRole] ?? ''
}

// ─── Geteilte UI-Bausteine ─────────────────────────────────────────────────────

function AnnBadge({ type }) {
  const label    = ANNOUNCEMENT_LABELS[type]
  // Pill-Form mit Farbverlauf und leichtem Schatten für visuelle Augenhöhe mit den SP-Icons
  const colorCls = type === 're'
    ? 'bg-gradient-to-b from-green-500 to-green-700 text-white shadow-sm ring-1 ring-green-900/30'
    : type === 'kontra'
    ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-white shadow-sm ring-1 ring-amber-900/30'
    : 'bg-gradient-to-b from-white/85 to-white/60 text-gray-800 shadow-sm ring-1 ring-black/10'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold leading-none shrink-0 ${colorCls}`}
      style={{ width: 'var(--tisch-badge)', height: 'var(--tisch-badge)', fontSize: 'var(--tisch-text-role)' }}
    >
      {label}
    </span>
  )
}

function SpBadge({ icon }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm shrink-0 overflow-hidden"
      style={{ width: 'var(--tisch-badge)', height: 'var(--tisch-badge)' }}
    >
      <img src={icon} alt="" className="w-full h-full object-cover" />
    </span>
  )
}

// Name-Text mit Auto-Shrink: schrumpft von 10px auf min. 8px bevor truncate greift
function ShrinkText({ text }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.fontSize = ''
    const maxPx = parseFloat(getComputedStyle(el).fontSize)
    const minPx = maxPx * 0.8
    let size = maxPx
    el.style.fontSize = `${size}px`
    while (el.scrollWidth > el.clientWidth && size > minPx) {
      size -= 0.5
      el.style.fontSize = `${size}px`
    }
  }, [text])
  return (
    <span
      ref={ref}
      className="block whitespace-nowrap overflow-hidden text-white font-semibold leading-tight text-center"
      style={{ fontSize: 'var(--tisch-text-name)' }}
    >
      {text}
    </span>
  )
}

// Re/·/Ko-Toggle – horizontal über die volle Backdrop-Breite, flex 2/1/2
function HorizontalPartyToggle({ playerId, party, onPartyChange }) {
  return (
    <div
      className="flex border border-white/30 overflow-hidden shrink-0"
      style={{
        height: 'var(--tisch-badge)',
        margin: '0 calc(-1 * var(--tisch-gap))',
        width: 'calc(100% + var(--tisch-gap))',
      }}
    >
      {[
        { value: 're',     label: 'Re', grow: 2 },
        { value: null,     label: '·',  grow: 1 },
        { value: 'kontra', label: 'Ko', grow: 2 },
      ].map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => onPartyChange(playerId, opt.value)}
          style={{ flex: opt.grow, fontSize: 'var(--tisch-text-role)' }}
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

// Geber-Chip für aktive Eckspieler – transparent, flush an der inneren Ecke des Backdrops
function CornerGebChip({ side, vertical }) {
  // translate(70%, -70%) = Chip überlappt die Backdrop-Ecke leicht, sitzt visuell direkt daran
  const posStyle = {
    'left-bottom':  { top: 0, right: 0,    transform: 'translate(70%, -70%)' },
    'right-bottom': { top: 0, left: 0,     transform: 'translate(-70%, -70%)' },
    'right-top':    { bottom: 0, left: 0,  transform: 'translate(-70%, 70%)' },
    'left-top':     { bottom: 0, right: 0, transform: 'translate(70%, 70%)' },
  }[`${side}-${vertical}`]

  return (
    <span
      className="absolute z-10"
      style={{ ...posStyle, width: 'var(--tisch-geb)', height: 'var(--tisch-geb)' }}
    >
      <img src={iconDealer} alt="Geber" className="w-full h-full object-contain" />
    </span>
  )
}

// Geber-Chip für Aussetzer – transparent, neben dem Avatar Richtung Tischmitte
function CompactGebChip({ side }) {
  const posStyle = {
    left:  { left: '100%',  top: '50%',  transform: 'translate(2px, -50%)' },
    top:   { top: '100%',   left: '50%', transform: 'translate(-50%, 2px)' },
    right: { right: '100%', top: '50%',  transform: 'translate(-2px, -50%)' },
  }[side]

  return (
    <span
      className="absolute z-10"
      style={{ ...posStyle, width: 'var(--tisch-geb)', height: 'var(--tisch-geb)' }}
    >
      <img src={iconDealer} alt="Geber" className="w-full h-full object-contain" />
    </span>
  )
}

// ─── Spieler-Cluster (aktive Ecke) ────────────────────────────────────────────

function CornerPlayer({ participant, layout, gameState, onTap, onPartyChange }) {
  const { side, vertical } = layout
  const isLeft    = side === 'left'
  const isBottom  = vertical === 'bottom'
  const playerId  = participant.player_id
  const party     = gameState.parties[playerId] ?? null
  const anns      = gameState.announcements[playerId] ?? []
  const role      = gameState.specialRoles[playerId]
  const roleLabel = getRoleLabel(role, gameState.soloType, gameState.soloColor)
  const activeAnns = ANNOUNCEMENT_ORDER.filter(t => anns.includes(t))
  const sp = gameState.specialPoints

  // Nur die innere Ecke (Richtung Tischmitte) bekommt den Radius
  const innerCornerProp = {
    'left-bottom':  'borderTopRightRadius',
    'right-bottom': 'borderTopLeftRadius',
    'right-top':    'borderBottomLeftRadius',
    'left-top':     'borderBottomRightRadius',
  }[`${side}-${vertical}`]

  // Padding: zur Tischmitte 5px, seitlich 2px (= Restrand), Bildschirmränder 0
  const paddingStyle = {
    paddingTop:    isBottom ? 'var(--tisch-pad-top)' : 0,
    paddingBottom: isBottom ? 0 : 'var(--tisch-pad-top)',
    paddingLeft:   isLeft   ? 0 : 'var(--tisch-gap)',
    paddingRight:  isLeft   ? 'var(--tisch-gap)' : 0,
  }

  // ── Unterkomponenten ──────────────────────────────────────────────────────────

  // Immer min-height reservieren damit der Backdrop nicht springt beim ersten Badge
  const AnnouncementRow = () => (
    <div
      className={`flex ${isLeft ? 'justify-start' : 'justify-end'} items-center flex-wrap`}
      style={{ gap: 'var(--tisch-gap)', minHeight: 'var(--tisch-badge)' }}
    >
      {activeAnns.map(t => <AnnBadge key={t} type={t} />)}
    </div>
  )

  const KarlchenRow = () => {
    const karlGemacht  = sp.filter(s => s.type === 'karlchen_gemacht'  && s.earnerId === playerId)
    const karlGefangen = sp.filter(s => s.type === 'karlchen_gefangen' && s.earnerId === playerId)
    const karlVerloren = sp.filter(s => s.type === 'karlchen_gefangen' && s.loserId  === playerId)
    return (
      <div className="flex items-center" style={{ gap: 'var(--tisch-gap)', height: 'var(--tisch-badge)' }}>
        {karlVerloren.length > 0
          ? karlVerloren.map(s => <SpBadge key={s.id} icon={iconKarlchenVerloren} color="red" />)
          : <>
              {karlGemacht.map(s  => <SpBadge key={s.id} icon={iconKarlchenGemacht}  />)}
              {karlGefangen.map(s => <SpBadge key={s.id} icon={iconKarlchenGefangen} />)}
            </>
        }
      </div>
    )
  }

  const FuchsRow = () => {
    const earned = sp.filter(s => s.type === 'fuchs_gefangen' && s.earnerId === playerId)
    const lost   = sp.filter(s => s.type === 'fuchs_gefangen' && s.loserId  === playerId)
    return (
      <div className="flex items-center" style={{ gap: 'var(--tisch-gap)', height: 'var(--tisch-badge)' }}>
        {earned.map(s => <SpBadge key={s.id} icon={iconFuchsGemacht}  />)}
        {lost.map(s   => <SpBadge key={s.id} icon={iconFuchsVerloren} />)}
      </div>
    )
  }

  const DokoRow = ({ from, to }) => {
    const badges = sp
      .filter(s => s.type === 'doppelkopf' && s.earnerId === playerId)
      .slice(from, to)
    return (
      <div className="flex items-center" style={{ gap: 'var(--tisch-gap)', height: 'var(--tisch-badge)' }}>
        {badges.map(s => <SpBadge key={s.id} icon={iconDoppelkopf} />)}
      </div>
    )
  }

  const ExtraPointCol = () => (
    <div
      className="flex flex-col shrink-0"
      style={{ gap: 'var(--tisch-gap)', width: 'calc(2 * var(--tisch-badge) + var(--tisch-gap))' }}
    >
      <KarlchenRow />
      <FuchsRow />
      <DokoRow from={0} to={2} />
      <DokoRow from={2} to={4} />
    </div>
  )

  // RoleLabel reserviert immer Platz (minHeight) damit Avatar+Name nicht springen
  const PlayerInfo = () => (
    <div className="flex flex-col items-center min-w-0" style={{ gap: 'var(--tisch-gap)', flex: 1 }}>
      {isBottom ? (
        <>
          <button onClick={() => onTap(playerId)} className="rounded-full active:opacity-70 shrink-0">
            <PlayerAvatar player={participant.players} size="md"
              style={{ width: 'var(--tisch-av)', height: 'var(--tisch-av)' }} />
          </button>
          <ShrinkText text={participant.players.name} />
          <span
            className="block w-full whitespace-nowrap overflow-hidden text-white/70 leading-tight text-center"
            style={{ fontSize: 'var(--tisch-text-role)', minHeight: 'var(--tisch-text-role)' }}
          >
            {roleLabel}
          </span>
        </>
      ) : (
        <>
          <span
            className="block w-full whitespace-nowrap overflow-hidden text-white/70 leading-tight text-center"
            style={{ fontSize: 'var(--tisch-text-role)', minHeight: 'var(--tisch-text-role)' }}
          >
            {roleLabel}
          </span>
          <ShrinkText text={participant.players.name} />
          <button onClick={() => onTap(playerId)} className="rounded-full active:opacity-70 shrink-0">
            <PlayerAvatar player={participant.players} size="md"
              style={{ width: 'var(--tisch-av)', height: 'var(--tisch-av)' }} />
          </button>
        </>
      )}
    </div>
  )

  const MainRow = () => (
    <div className="flex items-start" style={{ gap: 'var(--tisch-gap)' }}>
      {isLeft ? (
        <>
          <PlayerInfo />
          <ExtraPointCol />
        </>
      ) : (
        <>
          <ExtraPointCol />
          <PlayerInfo />
        </>
      )}
    </div>
  )

  return (
    <div
      className="absolute"
      style={{
        [isLeft ? 'left' : 'right']: 0,
        [isBottom ? 'bottom' : 'top']: 0,
        width: '40vw',
      }}
    >
      <div
        className="relative bg-white/15 flex flex-col w-full"
        style={{
          ...paddingStyle,
          gap: 'var(--tisch-gap-outer)',
          [innerCornerProp]: 'var(--tisch-radius)',
        }}
      >
        {participant.isDealer && <CornerGebChip side={side} vertical={vertical} />}

        {isBottom ? (
          <>
            <AnnouncementRow />
            <MainRow />
            <HorizontalPartyToggle playerId={playerId} party={party} onPartyChange={onPartyChange} />
          </>
        ) : (
          <>
            <HorizontalPartyToggle playerId={playerId} party={party} onPartyChange={onPartyChange} />
            <MainRow />
            <AnnouncementRow />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Kompakter Spieler (Aussetzer-Slots) ──────────────────────────────────────

function CompactPlayer({ participant, layout, onTap }) {
  const { side, posStyle } = layout
  const nameAbove = side === 'top'

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ ...posStyle, gap: 'var(--tisch-gap)', opacity: 0.55 }}
    >
      {nameAbove && (
        <span className="text-white font-medium text-center leading-tight truncate"
              style={{ fontSize: 'var(--tisch-text-role)', maxWidth: 'var(--tisch-av-sm)' }}>
          {participant.players.name}
        </span>
      )}
      <div className="relative">
        <PlayerAvatar player={participant.players} size="sm"
          style={{ width: 'var(--tisch-av-sm)', height: 'var(--tisch-av-sm)' }} />
        {participant.isDealer && <CompactGebChip side={side} />}
      </div>
      {!nameAbove && (
        <span className="text-white font-medium text-center leading-tight truncate"
              style={{ fontSize: 'var(--tisch-text-role)', maxWidth: 'var(--tisch-av-sm)' }}>
          {participant.players.name}
        </span>
      )}
    </div>
  )
}

// ─── Hauptkomponente ───────────────────────────────────────────────────────────

export default function TableView() {
  const {
    gameState,
    handlePartyChange, handleAnnouncementToggle,
    handleSpecialRoleSet, handleSpecialRoleClear,
    handleSpecialPointAdd, handleSpecialPointRemove,
    updateEyes, updateEyesFor,
  } = useGame()
  const { participants, showEvaluation } = useSession()

  const [openSheetId, setOpenSheetId] = useState(null)

  const activePlayers   = participants.filter(p => !p.isSitting)
  const openSheetPlayer = openSheetId ? participants.find(p => p.player_id === openSheetId) : null
  const valid           = isGameValid(gameState, participants)

  function handleEvaluateClick() {
    const result = calculateGameResult(buildCalculationInput(gameState, participants))
    showEvaluation(result)
  }

  return (
    <>
      {/* Filztisch – alle Größen fluid über clamp()-CSS-Variablen.
          Referenz: iPhone SE = 375px, Backdrop = 40vw = 150px. */}
      <main
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundColor: '#2d5a27',
          // Element-Größen
          '--tisch-av':         'clamp(75px, 20vw,   100px)',
          '--tisch-av-sm':      'clamp(60px, 16vw,    80px)',
          '--tisch-badge':      'clamp(28px, 7.47vw,  37px)',
          '--tisch-geb':        'clamp(48px, 12.8vw,  64px)',
          // Abstände
          '--tisch-gap':        'clamp(2px,  0.53vw,   3px)',  // interne Gaps
          '--tisch-gap-outer':  'clamp(4px,  1.07vw,   6px)',  // Gaps zwischen AnnRow/MainRow/Toggle
          '--tisch-pad-top':    'clamp(5px,  1.33vw,   7px)',  // Backdrop-Padding zur Tischmitte
          // Radius (nur innere Ecke)
          '--tisch-radius':     'clamp(12px, 3.2vw,   16px)',
          // Schriften
          '--tisch-text-name':  'clamp(10px, 2.67vw,  13px)',
          '--tisch-text-role':  'clamp(8px,  2.13vw,  11px)',
        }}
      >
        {(() => {
          const displayPositions = getDisplayPositions(participants)
          return participants.map(p => {
            const layout = displayPositions.get(p.player_id)
            if (layout.isCorner) {
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
            return (
              <CompactPlayer
                key={p.player_id}
                participant={p}
                layout={layout}
                onTap={setOpenSheetId}
              />
            )
          })
        })()}
      </main>

      <EyesBar
        eyesInput={gameState.eyesInput}
        eyesFor={gameState.eyesFor}
        onEyesChange={updateEyes}
        onEyesForChange={updateEyesFor}
        onEvaluate={handleEvaluateClick}
        isValid={valid}
      />

      {openSheetPlayer && (
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
    </>
  )
}
