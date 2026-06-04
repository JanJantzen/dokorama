// TableView – Tisch-Ansicht für die Spielerfassung
//
// Zeigt den grünen Filztisch mit 4 aktiven Spielern in den Ecken (Uhrzeigersinn)
// und Aussetzern an den Kanten. Alle Infos werden direkt am Avatar angepinnt.
// Liest Spielzustand aus GameContext, Partie-Daten aus SessionContext.

import { useState } from 'react'
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

// ─── Tisch-Unterkomponenten ────────────────────────────────────────────────────

function AnnBadge({ type }) {
  const label    = ANNOUNCEMENT_LABELS[type]
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

// Sonderpunkt-Badge (Platzhalter – wird durch SVG-Icons ersetzt wenn Jan die liefert)
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

// 4 feste Zeilen neben dem Avatar: Karlchen / Fuchs / Doko 1+2 / Doko 3+4
function SonderpunkteCol({ gameState, playerId, isLeft }) {
  const sp           = gameState.specialPoints
  const karlGemacht  = sp.filter(s => s.type === 'karlchen_gemacht'  && s.earnerId === playerId)
  const karlGefangen = sp.filter(s => s.type === 'karlchen_gefangen' && s.earnerId === playerId)
  const karlVerloren = sp.filter(s => s.type === 'karlchen_gefangen' && s.loserId  === playerId)
  const earnedFuchs  = sp.filter(s => s.type === 'fuchs_gefangen'    && s.earnerId === playerId)
  const lostFuchs    = sp.filter(s => s.type === 'fuchs_gefangen'    && s.loserId  === playerId)
  const dokoPoints   = sp.filter(s => s.type === 'doppelkopf'        && s.earnerId === playerId)
  const rowDir = isLeft ? 'flex-row' : 'flex-row-reverse'
  const ROW    = `flex ${rowDir} gap-0.5 items-center`

  return (
    <div className="flex flex-col gap-1 shrink-0" style={{ width: 'var(--tisch-sp-col)' }}>
      <div className={ROW} style={{ height: 'var(--tisch-sp-bdg)' }}>
        {karlVerloren.length > 0
          ? karlVerloren.map(s => <SpBadge key={s.id} label="Kv" color="red" />)
          : <>
              {karlGemacht.map(s  => <SpBadge key={s.id} label="K"  color="green" />)}
              {karlGefangen.map(s => <SpBadge key={s.id} label="Kg" color="green" />)}
            </>
        }
      </div>
      <div className={ROW} style={{ height: 'var(--tisch-sp-bdg)' }}>
        {earnedFuchs.map(s => <SpBadge key={s.id} label="F"  color="green" />)}
        {lostFuchs.map(s   => <SpBadge key={s.id} label="Fv" color="red"   />)}
      </div>
      <div className={ROW} style={{ height: 'var(--tisch-sp-bdg)' }}>
        {dokoPoints.slice(0, 2).map(s => <SpBadge key={s.id} label="D" color="neutral" />)}
      </div>
      <div className={ROW} style={{ height: 'var(--tisch-sp-bdg)' }}>
        {dokoPoints.slice(2, 4).map(s => <SpBadge key={s.id} label="D" color="neutral" />)}
      </div>
    </div>
  )
}

// Vertikaler Re/N/Ko-Toggle – fluid über CSS-Variablen
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

// Geber-Chip auf der inneren Ecke des Backdrops (zeigt zur Tischmitte)
function GebChip({ side, vertical }) {
  const pos = {
    'left-bottom':  'top-0 right-0 -translate-y-1/2 translate-x-1/2',
    'left-top':     'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
    'right-bottom': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
    'right-top':    'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
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

// Voller Spieler-Cluster in einer Ecke (aktiv, nicht aussetzend)
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
  const rowDir     = isLeft ? 'flex-row' : 'flex-row-reverse'

  const AnnouncementRow = () => (
    <div className={`flex ${rowDir} gap-0.5 min-h-[16px] items-center`}>
      {activeAnns.map(t => <AnnBadge key={t} type={t} />)}
    </div>
  )

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
    // Corner-Anchoring: Cluster klebt in der Ecke, null grüner Filz zum Rand.
    // overflow-hidden auf dem Tisch clippt die Außenecken des rounded-2xl automatisch.
    <div
      className="absolute"
      style={{
        [isLeft ? 'left' : 'right']: 0,
        [isBottom ? 'bottom' : 'top']: 0,
      }}
    >
      <div
        className="relative bg-white/15 rounded-2xl p-1.5 flex flex-col gap-0.5"
        style={{
          minWidth:     'clamp(150px, 40vw, 200px)',
          paddingLeft:  isLeft ? 'calc(var(--tisch-tog) + 10px)' : undefined,
          paddingRight: isLeft ? undefined : 'calc(var(--tisch-tog) + 10px)',
        }}
      >
        {participant.isDealer && <GebChip side={side} vertical={vertical} />}

        <div className={`absolute ${isBottom ? 'bottom-1.5' : 'top-1.5'} ${isLeft ? 'left-1.5' : 'right-1.5'}`}
             style={{ zIndex: 2 }}>
          <VerticalToggle playerId={playerId} party={party} onPartyChange={onPartyChange} />
        </div>

        {isBottom ? <AnnouncementRow /> : <NameBlock />}

        <div className={`flex items-center gap-1.5 ${rowDir}`}>
          <button onClick={() => onTap(playerId)} className="rounded-full active:opacity-70 shrink-0 block">
            <PlayerAvatar
              player={participant.players}
              size="md"
              style={{ width: 'var(--tisch-av)', height: 'var(--tisch-av)' }}
            />
          </button>
          <SonderpunkteCol gameState={gameState} playerId={playerId} isLeft={isLeft} />
        </div>

        {isBottom ? <NameBlock /> : <AnnouncementRow />}
      </div>
    </div>
  )
}

// Kompakter Spieler für Aussetzer-Slots oder sitzende Eck-Spieler
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

  // openSheetId ist View-lokaler Zustand – gehört nicht in einen Context
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
      {/* Filztisch – alle Pixel-Größen sind fluid über clamp()-CSS-Variablen.
          Referenz: iPhone 15 = 390px. Nur der Tisch ist fluid, Rest nicht. */}
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
