// TableView – Tisch-Ansicht für die Spielerfassung
//
// Zeigt den grünen Filztisch mit 4 aktiven Spielern in den Ecken (Uhrzeigersinn)
// und Aussetzern an den Kanten. Alle Infos werden direkt am Avatar angepinnt.
// Liest Spielzustand aus GameContext, Partie-Daten aus SessionContext.

import { useState, useRef, useEffect } from 'react'
import { useGame, isGameValid, buildCalculationInput } from '@/contexts/GameContext'
import { useSession } from '@/contexts/SessionContext'
import { calculateGameResult } from '@/lib/scoreCalculation'
import { isComplete } from '@/lib/consistency'
import { getDisplayPositions } from '@/lib/seatUtils'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import PlayerSheet from '@/components/session/PlayerSheet'
import EyesBar from '@/components/session/EyesBar'

import iconAnnRe  from '@/assets/icons/icon-ann-re.png'
import iconAnnKo  from '@/assets/icons/icon-ann-ko.png'
import iconAnnK9  from '@/assets/icons/icon-ann-k9.png'
import iconAnnK6  from '@/assets/icons/icon-ann-k6.png'
import iconAnnK3  from '@/assets/icons/icon-ann-k3.png'
import iconAnnSw  from '@/assets/icons/icon-ann-sw.png'
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
      fleischlos:                'Fleischlos',
      buben_solo:                'Buben-Solo',
      damen_solo:                'Damen-Solo',
      farb_solo:                 soloColor ? `Farb-Solo ${FARB_EMOJI[soloColor] ?? ''}` : 'Farb-Solo',
      stilles_solo:              'Stilles Solo',
      haengengelassene_hochzeit: 'Hängengelassene Hochzeit',
    }[soloType] ?? 'Solo'
  }
  return {
    hochzeit:      'Hochzeit',
    eingeheiratet: 'Eingeheiratet',
    arm:           'Armut (arm)',
    reich:         'Armut (reich)',
  }[specialRole] ?? ''
}

// Abgeleitetes Gegner-Label (B.4.6, P6): Spieler ohne eigene Sonderrolle sind,
// während ein Sonderspiel läuft, dessen Gegner. Knappe Tisch-Form OHNE Namen
// (die ausführliche Form mit Namen lebt im Sheet). Rein aus dem Zustand abgeleitet
// – verschwindet automatisch, sobald das Sonderspiel annulliert ist.
function getGegnerLabel(gameState) {
  const roles = Object.values(gameState.specialRoles)
  if (roles.includes('solist'))   return `gegen ${getRoleLabel('solist', gameState.soloType, gameState.soloColor)}`
  if (roles.includes('hochzeit')) return 'gegen Hochzeit'
  if (roles.includes('arm'))      return 'gegen Armut'
  return ''
}

// ─── Geteilte UI-Bausteine ─────────────────────────────────────────────────────

const ANN_ICONS = { re: iconAnnRe, kontra: iconAnnKo, keine_90: iconAnnK9, keine_60: iconAnnK6, keine_30: iconAnnK3, schwarz: iconAnnSw }

function AnnBadge({ type }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm shrink-0 overflow-hidden"
      style={{ width: 'var(--tisch-badge)', height: 'var(--tisch-badge)' }}
    >
      <img src={ANN_ICONS[type]} alt={ANNOUNCEMENT_LABELS[type]} className="w-full h-full object-cover" />
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

// Partei-Beschriftung – zeigt "Re" (grün) oder "Kontra" (rot), leer bei unbekannt.
// Ausrichtung folgt der Spieler-Seite: links = linksbündig, rechts = rechtsbündig.
// Immer gerendert (minHeight), damit der Backdrop nicht springt wenn Partei gesetzt wird.
function PartyLabel({ party, isLeft, isBottom }) {
  const isRe = party === 're'
  // Abstand zur MainRow auf --tisch-gap reduzieren (statt --tisch-gap-outer vom Eltern-flex)
  const marginSide = isBottom ? 'marginTop' : 'marginBottom'
  return (
    <div
      className={`flex w-full ${isLeft ? 'justify-start pl-2' : 'justify-end pr-2'}`}
      style={{ minHeight: 'var(--tisch-text-name)', [marginSide]: 'calc(var(--tisch-gap) - var(--tisch-gap-outer))' }}
    >
      {party && (
        <span
          className={`font-bold ${isRe ? 'text-green-100/60' : 'text-red-300/80'}`}
          style={{ fontSize: 'var(--tisch-text-name)' }}
        >
          {isRe ? 'Re' : 'Kontra'}
        </span>
      )}
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

function CornerPlayer({ participant, layout, gameState, onGestureStart, drag }) {
  const { side, vertical } = layout
  const isLeft    = side === 'left'
  const isBottom  = vertical === 'bottom'
  const playerId  = participant.player_id
  // Wisch-Geste (Teil 5): Hervorhebung, wenn dieser Backdrop gültiges Ziel ist bzw.
  // gerade überfahren wird. drag.fromId = Start-Spieler; jeder andere Aktive ist Ziel.
  const isDragTarget = !!drag && drag.fromId !== playerId
  const isDragOver   = drag?.overId === playerId
  const party     = gameState.parties[playerId] ?? null
  const anns      = gameState.announcements[playerId] ?? []
  const role      = gameState.specialRoles[playerId]
  // Eigene Rolle, sonst – falls Kontra während eines Sonderspiels – das abgeleitete
  // Gegner-Label (B.4.6). Source/Partner haben eine Rolle und fallen nicht hierher.
  const roleLabel = getRoleLabel(role, gameState.soloType, gameState.soloColor)
                 || (party === 'kontra' ? getGegnerLabel(gameState) : '')
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
          <div data-avatar className="rounded-full shrink-0">
            <PlayerAvatar player={participant.players} size="md"
              style={{ width: 'var(--tisch-av)', height: 'var(--tisch-av)' }} />
          </div>
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
          <div data-avatar className="rounded-full shrink-0">
            <PlayerAvatar player={participant.players} size="md"
              style={{ width: 'var(--tisch-av)', height: 'var(--tisch-av)' }} />
          </div>
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
        width: '40cqw',
      }}
    >
      <div
        data-player-id={playerId}
        onPointerDown={(e) => onGestureStart(e, playerId)}
        onDragStart={(e) => e.preventDefault()}
        className={`relative bg-white/15 flex flex-col w-full transition-[filter] ${
          isDragOver        ? 'ring-4 ring-white brightness-110' :
          isDragTarget      ? 'ring-2 ring-white/50' :
          party === 're'     ? 'ring-2 ring-green-300/50' :
          party === 'kontra' ? 'ring-2 ring-red-300/50'   :
                               'ring-2 ring-white/20'
        }`}
        style={{
          ...paddingStyle,
          gap: 'var(--tisch-gap-outer)',
          [innerCornerProp]: 'var(--tisch-radius)',
          // Gesten-Fläche: iOS-Bildmenü, Textauswahl und Scroll/Pinch unterdrücken (C.5.10)
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        {participant.isDealer && <CornerGebChip side={side} vertical={vertical} />}

        {isBottom ? (
          <>
            <AnnouncementRow />
            <MainRow />
            <PartyLabel party={party} isLeft={isLeft} isBottom={isBottom} />
          </>
        ) : (
          <>
            <PartyLabel party={party} isLeft={isLeft} isBottom={isBottom} />
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
    changeParty, previewParty,
    makeAnnouncement, previewAnnouncement,
    setSolo, setHochzeit, setArmut,
    previewSolo, previewHochzeit, previewArmut,
    handleSpecialRoleClear,
    handleSpecialPointAdd, handleSpecialPointRemove, previewSpecialPoint,
    pendingLoserSelection, clearPendingLoserSelection,
    updateEyes, updateEyesFor,
    requestSwipe,
  } = useGame()
  const { participants, showEvaluation } = useSession()

  const [openSheetId, setOpenSheetId] = useState(null)

  // ── Wisch-Geste (Teil 5, B.5.10/C.5.10) ────────────────────────────────────
  // drag = laufende Geste { fromId, fromX/Y (Avatar-Anker), x/y (Finger), overId }.
  const [drag, setDrag] = useState(null)
  const gestureRef = useRef(null)
  const mainRef = useRef(null)   // für main-relative Gesten-Koordinaten (Overlay liegt IN main)

  // Welcher aktive Spieler liegt unter diesem Punkt? (nur Eck-Backdrops tragen
  // data-player-id → Aussetzer/Leere ergeben null). Das Overlay ist pointer-events:none.
  function playerAtPoint(x, y) {
    const el = document.elementFromPoint(x, y)
    return el?.closest('[data-player-id]')?.getAttribute('data-player-id') ?? null
  }

  // Start auf einem Eck-Backdrop. Tap (kurz, <20px, <0,4s) → Sheet; Wisch ab ~0,4s
  // Halten ODER >20px Bewegung → Team verbinden (requestSwipe). Pointer-Events decken
  // Touch UND Maus ab; Touch hat implizites Pointer-Capture → window-Listener genügen.
  function startGesture(e, playerId) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Desktop: natives Bild-Drag/Textauswahl unterdrücken und den Pointer einfangen,
    // damit pointermove zuverlässig fließt (Touch hat implizites Capture, Maus nicht).
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* nicht kritisch */ }
    const startX = e.clientX, startY = e.clientY
    // Alle Overlay-Koordinaten relativ zu <main> (dort liegt das Overlay). Sonst
    // läge die fixe Linie auf dem Desktop um den Zentrier-Offset der Phone-Spalte
    // daneben (deren container-type ist der Bezugsrahmen für position:fixed).
    const mrect = mainRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const avatar = e.currentTarget.querySelector('[data-avatar]') ?? e.currentTarget
    const r = avatar.getBoundingClientRect()
    const fromX = r.left + r.width / 2 - mrect.left, fromY = r.top + r.height / 2 - mrect.top
    const g = { fromId: playerId, armed: false, lastX: startX, lastY: startY, timer: null }
    gestureRef.current = g

    const arm = () => {
      if (gestureRef.current !== g || g.armed) return
      g.armed = true
      setDrag({ fromId: playerId, fromX, fromY, x: g.lastX - mrect.left, y: g.lastY - mrect.top, overId: null })
    }
    g.timer = setTimeout(arm, 400)  // Long-press-Pfad

    const onMove = (ev) => {
      g.lastX = ev.clientX; g.lastY = ev.clientY
      if (!g.armed) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 20) { clearTimeout(g.timer); arm() }
        else return
      }
      const over = playerAtPoint(ev.clientX, ev.clientY)   // elementFromPoint bleibt viewport-basiert
      setDrag({ fromId: playerId, fromX, fromY, x: ev.clientX - mrect.left, y: ev.clientY - mrect.top, overId: over !== playerId ? over : null })
    }
    const onUp = (ev) => {
      clearTimeout(g.timer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      const armed = g.armed
      gestureRef.current = null
      setDrag(null)
      if (!armed) { setOpenSheetId(playerId); return }   // Tap → Sheet öffnen
      const target = playerAtPoint(ev.clientX, ev.clientY)
      if (target && target !== playerId) requestSwipe(playerId, target)  // gültiges Ziel → verbinden
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

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
          Maßeinheit cqw = % der CONTAINER-Breite (nicht der Fensterbreite):
          <main> ist via containerType der Container, seine Breite ist die auf
          500px gedeckelte Phone-Spalte. Dadurch skaliert der Tisch sauber bis
          500px und wächst auf breiten Desktop-Fenstern nicht weiter.
          Referenz: iPhone SE = 375px (dort gilt 1cqw == 1vw, Kalibrierung bleibt). */}
      <main
        ref={mainRef}
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundColor: '#2d5a27',
          containerType: 'inline-size',   // macht cqw relativ zur Spaltenbreite
          // Element-Größen
          '--tisch-av':         'clamp(75px, 20cqw,   100px)',
          '--tisch-av-sm':      'clamp(60px, 16cqw,    80px)',
          '--tisch-badge':      'clamp(28px, 7.47cqw,  37px)',
          '--tisch-geb':        'clamp(48px, 12.8cqw,  64px)',
          // Abstände
          '--tisch-gap':        'clamp(2px,  0.53cqw,   3px)',  // interne Gaps
          '--tisch-gap-outer':  'clamp(4px,  1.07cqw,   6px)',  // Gaps zwischen AnnRow/MainRow/Toggle
          '--tisch-pad-top':    'clamp(5px,  1.33cqw,   7px)',  // Backdrop-Padding zur Tischmitte
          // Radius (nur innere Ecke)
          '--tisch-radius':     'clamp(12px, 3.2cqw,   16px)',
          // Schriften
          '--tisch-text-name':  'clamp(10px, 2.67cqw,  13px)',
          '--tisch-text-role':  'clamp(8px,  2.13cqw,  11px)',
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
                  onGestureStart={startGesture}
                  drag={drag}
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

        {/* Wisch-Geste: Verbindungslinie vom Avatar des Start-Spielers zum Finger.
            Liegt IN <main> (absolut, main-relative Koordinaten) – sonst läge sie auf
            dem Desktop neben dem Tisch. Gedrehtes <div> statt SVG (Chrome-robust),
            pointer-events:none, damit elementFromPoint den Backdrop darunter trifft. */}
        {drag && (() => {
          const dx = drag.x - drag.fromX, dy = drag.y - drag.fromY
          const len = Math.hypot(dx, dy)
          const ang = Math.atan2(dy, dx) * 180 / Math.PI
          return (
            <>
              <div
                className="absolute pointer-events-none"
                style={{
                  zIndex: 30, left: drag.fromX, top: drag.fromY - 2, width: len, height: 4,
                  background: 'rgba(255,255,255,0.85)', borderRadius: 2,
                  transformOrigin: '0 50%', transform: `rotate(${ang}deg)`,
                }}
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  zIndex: 30, left: drag.x - 7, top: drag.y - 7, width: 14, height: 14,
                  background: 'rgba(255,255,255,0.85)', borderRadius: '50%',
                }}
              />
            </>
          )
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
          teamsComplete={isComplete(gameState, participants)}
          onChangeParty={changeParty}
          previewParty={previewParty}
          onAnnouncement={makeAnnouncement}
          previewAnnouncement={previewAnnouncement}
          onSetSolo={setSolo}
          onSetHochzeit={setHochzeit}
          onSetArmut={setArmut}
          previewSolo={previewSolo}
          previewHochzeit={previewHochzeit}
          previewArmut={previewArmut}
          onSpecialRoleClear={handleSpecialRoleClear}
          onSpecialPointAdd={handleSpecialPointAdd}
          onSpecialPointRemove={handleSpecialPointRemove}
          previewSpecialPoint={previewSpecialPoint}
          pendingLoserSelection={pendingLoserSelection}
          clearPendingLoserSelection={clearPendingLoserSelection}
          onClose={() => setOpenSheetId(null)}
        />
      )}
    </>
  )
}
