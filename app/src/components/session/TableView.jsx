// TableView – Tisch-Ansicht für die Spielerfassung
//
// Zeigt den grünen Filztisch mit 4 aktiven Spielern in den Ecken (Uhrzeigersinn)
// und Aussetzern an den Kanten. Alle Infos werden direkt am Avatar angepinnt.
// Liest Spielzustand aus GameContext, Partie-Daten aus SessionContext.

import { useState, useRef, useEffect } from 'react'
import { useGame, isGameValid, buildCalculationInput } from '@/contexts/GameContext'
import { useSession } from '@/contexts/SessionContext'
import { calculateGameResult } from '@/lib/scoreCalculation'
import { getTablePosition } from '@/lib/seatUtils'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import PlayerSheet from '@/components/session/PlayerSheet'
import EyesBar from '@/components/session/EyesBar'

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

// Ansagen-Badge (Text in abgerundetem Quadrat, Farbe per Typ)
function AnnBadge({ type }) {
  const label    = ANNOUNCEMENT_LABELS[type]
  const colorCls = type === 're'
    ? 'bg-green-600 text-white'
    : type === 'kontra'
    ? 'bg-amber-500 text-white'
    : 'bg-white/70 text-gray-800'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm font-bold leading-none shrink-0 ${colorCls}`}
      style={{ width: 'var(--tisch-badge)', height: 'var(--tisch-badge)', fontSize: 'var(--tisch-text-role)' }}
    >
      {label}
    </span>
  )
}

// Sonderpunkt-Badge (Platzhalter bis Jan die SVG-Icons liefert)
function SpBadge({ label, color }) {
  const colorCls = color === 'green' ? 'bg-green-500/90 text-white'
    : color === 'red'               ? 'bg-red-500/90 text-white'
    :                                 'bg-white/80 text-gray-800'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm font-bold leading-none shrink-0 ${colorCls}`}
      style={{ width: 'var(--tisch-badge)', height: 'var(--tisch-badge)', fontSize: 'var(--tisch-text-role)' }}
    >
      {label}
    </span>
  )
}

// Name-Text mit Auto-Shrink: schrumpft von 10px auf min. 8px bevor truncate greift.
// Liest den Startwert aus der CSS-Variable – damit skaliert es automatisch mit vw.
function ShrinkText({ text }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.fontSize = ''                                     // CSS-Variable wirken lassen
    const maxPx = parseFloat(getComputedStyle(el).fontSize)   // Browser-aufgelöster vw-Wert
    const minPx = maxPx * 0.8                                  // 8/10 = 80%-Verhältnis
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
      className="block whitespace-nowrap overflow-hidden text-white font-semibold leading-tight"
      style={{ fontSize: 'var(--tisch-text-name)' }}
    >
      {text}
    </span>
  )
}

// Re/·/Ko-Toggle – Breite = Badge-Größe, Höhe streckt sich auf PlayerInfo-Höhe
function PartyToggle({ playerId, party, onPartyChange }) {
  return (
    <div
      className="flex flex-col rounded-md border border-white/30 overflow-hidden shrink-0 self-stretch"
      style={{ width: 'var(--tisch-badge)' }}
    >
      {[
        { value: 're',     label: 'Re' },
        { value: null,     label: '·'  },
        { value: 'kontra', label: 'Ko' },
      ].map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => onPartyChange(playerId, opt.value)}
          style={{ fontSize: 'var(--tisch-text-role)' }}
          className={`flex-1 font-bold transition-colors ${
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

// Geber-Chip – schwebt diagonal 2px außerhalb der inneren (abgerundeten) Ecke
function GebChip({ side, vertical }) {
  const posStyle = {
    'left-bottom':  { top: 0, right: 0, transform: 'translate(calc(50% + 2px), calc(-50% - 2px))' },
    'right-bottom': { top: 0, left: 0,  transform: 'translate(calc(-50% - 2px), calc(-50% - 2px))' },
    'right-top':    { bottom: 0, left: 0, transform: 'translate(calc(-50% - 2px), calc(50% + 2px))' },
    'left-top':     { bottom: 0, right: 0, transform: 'translate(calc(50% + 2px), calc(50% + 2px))' },
  }[`${side}-${vertical}`]

  return (
    <span
      className="absolute rounded-full bg-yellow-400 text-yellow-900 font-black flex items-center justify-center z-10 shadow-sm"
      style={{ ...posStyle, width: 'var(--tisch-geb)', height: 'var(--tisch-geb)', fontSize: 'var(--tisch-text-role)' }}
    >
      G
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

  // Padding: zur Tischmitte 5px, seitlich 2px, Bildschirmränder 0
  const paddingStyle = {
    paddingTop:    isBottom ? 'var(--tisch-pad-top)' : 0,
    paddingBottom: isBottom ? 0 : 'var(--tisch-pad-top)',
    paddingLeft:   isLeft   ? 0 : 'var(--tisch-gap)',
    paddingRight:  isLeft   ? 'var(--tisch-gap)' : 0,
  }

  // ── Unterkomponenten (lokal, haben Zugriff auf playerId, sp, etc.) ────────────

  const AnnouncementRow = () => (
    <div
      className={`flex ${isLeft ? 'justify-start' : 'justify-end'} items-center flex-wrap`}
      style={{ gap: 'var(--tisch-gap)' }}
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
          ? karlVerloren.map(s => <SpBadge key={s.id} label="Kv" color="red" />)
          : <>
              {karlGemacht.map(s  => <SpBadge key={s.id} label="K"  color="green" />)}
              {karlGefangen.map(s => <SpBadge key={s.id} label="Kg" color="green" />)}
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
        {earned.map(s => <SpBadge key={s.id} label="F"  color="green" />)}
        {lost.map(s   => <SpBadge key={s.id} label="Fv" color="red"   />)}
      </div>
    )
  }

  const DokoRow = ({ from, to }) => {
    const badges = sp
      .filter(s => s.type === 'doppelkopf' && s.earnerId === playerId)
      .slice(from, to)
    return (
      <div className="flex items-center" style={{ gap: 'var(--tisch-gap)', height: 'var(--tisch-badge)' }}>
        {badges.map(s => <SpBadge key={s.id} label="D" color="neutral" />)}
      </div>
    )
  }

  // ExtraPointCol: Karlchen oben (Skill-Kennzahl), dann Fuchs, dann 2× Doko
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

  // PlayerInfo: Reihenfolge Avatar/Name/Rolle je nach Tischseite gespiegelt
  const PlayerInfo = () => (
    <div className="flex flex-col" style={{ gap: 'var(--tisch-gap)', width: 'var(--tisch-av)' }}>
      {isBottom ? (
        <>
          <button onClick={() => onTap(playerId)} className="rounded-full active:opacity-70 shrink-0 self-center block">
            <PlayerAvatar player={participant.players} size="md"
              style={{ width: 'var(--tisch-av)', height: 'var(--tisch-av)' }} />
          </button>
          <ShrinkText text={participant.players.name} />
          <span className="block whitespace-nowrap overflow-hidden text-white/70 leading-tight"
                style={{ fontSize: 'var(--tisch-text-role)' }}>
            {roleLabel}
          </span>
        </>
      ) : (
        <>
          <span className="block whitespace-nowrap overflow-hidden text-white/70 leading-tight"
                style={{ fontSize: 'var(--tisch-text-role)' }}>
            {roleLabel}
          </span>
          <ShrinkText text={participant.players.name} />
          <button onClick={() => onTap(playerId)} className="rounded-full active:opacity-70 shrink-0 self-center block">
            <PlayerAvatar player={participant.players} size="md"
              style={{ width: 'var(--tisch-av)', height: 'var(--tisch-av)' }} />
          </button>
        </>
      )}
    </div>
  )

  // MainRow: Toggle links/rechts je nach Tischseite
  const MainRow = () => (
    <div className="flex items-stretch" style={{ gap: 'var(--tisch-gap)' }}>
      {isLeft ? (
        <>
          <PartyToggle playerId={playerId} party={party} onPartyChange={onPartyChange} />
          <PlayerInfo />
          <ExtraPointCol />
        </>
      ) : (
        <>
          <ExtraPointCol />
          <PlayerInfo />
          <PartyToggle playerId={playerId} party={party} onPartyChange={onPartyChange} />
        </>
      )}
    </div>
  )

  return (
    // Cluster klebt in der Bildschirm-Ecke; overflow-hidden auf main clippt die Außenkanten
    <div
      className="absolute"
      style={{
        [isLeft ? 'left' : 'right']: 0,
        [isBottom ? 'bottom' : 'top']: 0,
      }}
    >
      <div
        className="relative bg-white/15 flex flex-col"
        style={{
          ...paddingStyle,
          gap: 'var(--tisch-gap)',
          [innerCornerProp]: 'var(--tisch-radius)',
        }}
      >
        {participant.isDealer && <GebChip side={side} vertical={vertical} />}

        {isBottom ? (
          <>
            <AnnouncementRow />
            <MainRow />
          </>
        ) : (
          <>
            <MainRow />
            <AnnouncementRow />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Kompakter Spieler (Aussetzer-Slots an den Kanten) ────────────────────────

function CompactPlayer({ participant, layout, onTap }) {
  const { side, vertical } = layout
  const isSitting = participant.isSitting
  const nameAbove = side === 'top' || vertical === 'top'

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
        <span className="text-white font-medium text-center leading-tight max-w-[56px] truncate"
              style={{ fontSize: 'var(--tisch-text-role)' }}>
          {participant.players.name}
        </span>
      )}
      <div className="relative">
        <button
          onClick={() => !isSitting && onTap(participant.player_id)}
          className={isSitting ? 'cursor-default' : 'active:opacity-70'}
        >
          <PlayerAvatar player={participant.players} size="sm"
            style={{ width: 'var(--tisch-av-sm)', height: 'var(--tisch-av-sm)' }} />
        </button>
        {participant.isDealer && <GebChip side={side} vertical={vertical} />}
      </div>
      {!nameAbove && (
        <span className="text-white font-medium text-center leading-tight max-w-[56px] truncate"
              style={{ fontSize: 'var(--tisch-text-role)' }}>
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
      {/* Filztisch – alle Größen und Abstände sind fluid über clamp()-CSS-Variablen.
          Referenzgröße: iPhone SE = 375px Breite, Backdrop = 40vw = 150px. */}
      <main
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundColor: '#2d5a27',
          // Größen
          '--tisch-av':        'clamp(58px, 15.47vw, 77px)',
          '--tisch-av-sm':     'clamp(32px, 8.53vw,  43px)',
          '--tisch-badge':     'clamp(28px, 7.47vw,  37px)',
          '--tisch-geb':       'clamp(35px, 9.33vw,  47px)',
          // Abstände
          '--tisch-gap':       'clamp(2px,  0.53vw,  3px)',
          '--tisch-pad-top':   'clamp(5px,  1.33vw,  7px)',
          // Radius (nur innere Ecke)
          '--tisch-radius':    'clamp(8px,  2.13vw,  11px)',
          // Schriften
          '--tisch-text-name': 'clamp(10px, 2.67vw,  13px)',
          '--tisch-text-role': 'clamp(8px,  2.13vw,  11px)',
        }}
      >
        {participants.map(p => {
          const layout = getTablePosition(p.seat_position, participants.length)
          if (p.seat_position <= 4 && !p.isSitting) {
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
        })}
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
