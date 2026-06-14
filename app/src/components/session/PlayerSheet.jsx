// PlayerSheet – Bottom Sheet für einen einzelnen Spieler im Erfassungsscreen
//
// Aufbau:
//   Header:        Avatar + Name + Re/N/Ko-Toggle
//   Abschnitt 1:   An- und Absagen (2 Zeilen: Re/Ko oben, Absagen unten)
//   Abschnitt 2:   Sonderspiel (Solo / Hochzeit / Armut)
//   Abschnitt 3:   Sonderpunkte (Viererreihe + Liste der ausgewählten)
//
// Sub-Flows erscheinen als zweites kleineres Bottom Sheet darüber gestapelt.
// Rollen werden erst committet wenn Auswahl vollständig ist.
// Partner-Rollen (eingeheiratet / reich) sind read-only.

import { useState, useRef } from 'react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { X } from 'lucide-react'

import iconFuchsGemacht    from '@/assets/icons/icon-fuchs-gemacht.png'
import iconDoppelkopf      from '@/assets/icons/icon-doppelkopf.png'
import iconKarlchenGemacht  from '@/assets/icons/icon-karlchen-gemacht.png'
import iconKarlchenGefangen from '@/assets/icons/icon-karlchen-gefangen.png'

const SOLO_TYPEN = [
  { type: 'fleischlos',   label: 'Fleischlos'   },
  { type: 'buben_solo',   label: 'Buben-Solo'   },
  { type: 'damen_solo',   label: 'Damen-Solo'   },
  { type: 'farb_solo',    label: 'Farb-Solo'    },
  { type: 'stilles_solo', label: 'Stilles Solo' },
]

// Farb-Solo: nur Emojis, Reihenfolge ♣♠ / ♥♦ (oben links → rechts, unten links → rechts)
const FARBEN = [
  { type: 'kreuz', emoji: '♣' },
  { type: 'pik',   emoji: '♠' },
  { type: 'herz',  emoji: '♥' },
  { type: 'karo',  emoji: '♦' },
]

// Viererreihe: Fuchs / Doko / Karl / gefangen. Die Obergrenzen (I11) sind tischweit
// und werden zentral geprüft (previewSpecialPoint / C.3.2) – hier kein max mehr.
const SONDERPUNKT_TYPEN = [
  { type: 'fuchs_gefangen',    label: 'Fuchs',    icon: iconFuchsGemacht,    needsLoser: true  },
  { type: 'doppelkopf',        label: 'Doko',     icon: iconDoppelkopf,      needsLoser: false },
  { type: 'karlchen_gemacht',  label: 'Karl',     icon: iconKarlchenGemacht, needsLoser: false },
  { type: 'karlchen_gefangen', label: 'gefangen', icon: iconKarlchenGefangen, needsLoser: true },
]

// size='full' → füllt den Eltern-Button (Viererreihe), size='sm' → kleines Icon in der Liste
function SpIcon({ icon, disabled = false, size = 'full' }) {
  const cls = size === 'sm'
    ? 'w-8 h-8 rounded-lg overflow-hidden shrink-0 object-cover'
    : 'w-full aspect-square object-cover'
  return (
    <img src={icon} alt="" className={`${cls} ${disabled ? 'opacity-30' : ''}`} />
  )
}

export default function PlayerSheet({
  player,
  gameState,
  activePlayers,
  teamsComplete,
  onChangeParty,
  previewParty,
  onAnnouncement,
  previewAnnouncement,
  onSetSolo,
  onSetHochzeit,
  onSetArmut,
  previewSolo,
  previewHochzeit,
  previewArmut,
  onSpecialRoleClear,
  onSpecialPointAdd,
  onSpecialPointRemove,
  previewSpecialPoint,
  pendingLoserSelection,
  clearPendingLoserSelection,
  onClose,
}) {
  const playerId   = player.player_id
  const playerData = player.players

  const [subFlow, setSubFlow] = useState(null)

  // „von wem"-Nachfassen (Teil 4): Hat eine C.3.2-Auflösung diesen Spieler als neue
  // Fängerin gesetzt (pendingLoserSelection), gehört der passende Bestohlenen-Picker
  // geöffnet. ABGELEITET statt per Effekt in den lokalen State kopiert: das effektive
  // Sub-Sheet ist entweder lokal gesetzt (Solo-Typ, Partner, „von wem" bei freiem
  // Kontingent) oder der zentrale „von wem"-Auftrag.
  const pendingFlow = pendingLoserSelection?.earnerId === playerId
    ? (pendingLoserSelection.type === 'fuchs_gefangen' ? 'fuchsVonWem' : 'karlchenVonWem')
    : null
  const activeSubFlow = subFlow ?? pendingFlow

  // Drag-to-close für das Player Sheet
  const [dragY,      setDragY]      = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef(0)

  function onDragStart(e) {
    startYRef.current = e.touches[0].clientY
    setIsDragging(true)
  }
  function onDragMove(e) {
    const delta = e.touches[0].clientY - startYRef.current
    if (delta > 0) setDragY(delta)
  }
  function onDragEnd() {
    setIsDragging(false)
    if (dragY > 80) onClose()
    else setDragY(0)
  }

  // Drag-to-close für das Sub-Flow Sheet
  const [subDragY,      setSubDragY]      = useState(0)
  const [isSubDragging, setIsSubDragging] = useState(false)
  const subStartYRef = useRef(0)

  function onSubDragStart(e) {
    subStartYRef.current = e.touches[0].clientY
    setIsSubDragging(true)
  }
  function onSubDragMove(e) {
    const delta = e.touches[0].clientY - subStartYRef.current
    if (delta > 0) setSubDragY(delta)
  }
  function onSubDragEnd() {
    setIsSubDragging(false)
    if (subDragY > 80) closeSubFlow()
    else setSubDragY(0)
  }

  const currentParty         = gameState.parties[playerId] ?? null
  const currentAnnouncements = gameState.announcements[playerId] ?? []
  const currentSpecialRole   = gameState.specialRoles[playerId] ?? null
  const ownSpecialPoints     = gameState.specialPoints.filter(sp => sp.earnerId === playerId)

  // Wer kann die Sonderrolle selbst löschen (Initiator oder Solist)
  const canClearRole = ['solist', 'hochzeit', 'arm'].includes(currentSpecialRole)
  // Partner-Rollen sind read-only
  const isPartner    = ['eingeheiratet', 'reich'].includes(currentSpecialRole)

  function activeSonderspiel() {
    if (!currentSpecialRole) return null
    if (currentSpecialRole === 'solist') return 'solo'
    if (['hochzeit', 'eingeheiratet'].includes(currentSpecialRole)) return 'hochzeit'
    if (['arm', 'reich'].includes(currentSpecialRole)) return 'armut'
    return null
  }

  function sonderspielLabel() {
    if (currentSpecialRole === 'solist') {
      const typLabel  = SOLO_TYPEN.find(t => t.type === gameState.soloType)?.label ?? 'Solo'
      const farbEmoji = FARBEN.find(f => f.type === gameState.soloColor)?.emoji
      return farbEmoji ? `${typLabel} ${farbEmoji}` : typLabel
    }
    if (currentSpecialRole === 'hochzeit') {
      const partner = activePlayers.find(p => gameState.specialRoles[p.player_id] === 'eingeheiratet')
      return partner ? `Hochzeit (mit ${partner.players.name})` : 'Hochzeit'
    }
    if (currentSpecialRole === 'eingeheiratet') {
      const initiator = activePlayers.find(p => gameState.specialRoles[p.player_id] === 'hochzeit')
      return initiator ? `Eingeheiratet (bei ${initiator.players.name})` : 'Eingeheiratet'
    }
    if (currentSpecialRole === 'arm') {
      const partner = activePlayers.find(p => gameState.specialRoles[p.player_id] === 'reich')
      return partner ? `Armut (arm) – ${partner.players.name} ist reich` : 'Armut (arm)'
    }
    if (currentSpecialRole === 'reich') {
      const initiator = activePlayers.find(p => gameState.specialRoles[p.player_id] === 'arm')
      return initiator ? `Armut (reich) – Armut bei ${initiator.players.name}` : 'Armut (reich)'
    }
    return null
  }

  // Läuft auf dem Tisch überhaupt ein Sonderspiel (an irgendeiner auslösenden Person)?
  const someSpecialGameActive = activePlayers.some(p =>
    ['solist', 'hochzeit', 'arm'].includes(gameState.specialRoles[p.player_id]))

  // Abgeleitetes Gegner-Label fürs Sheet (B.4.6, P6) – ausführliche Form MIT Namen
  // der auslösenden Person (Wegweiser zur Auflösung). Für Spieler ohne eigene Rolle,
  // während ein Sonderspiel läuft.
  function gegnerLabel() {
    const src = role => activePlayers.find(p => gameState.specialRoles[p.player_id] === role)
    const solist = src('solist')
    if (solist) {
      const typLabel  = SOLO_TYPEN.find(t => t.type === gameState.soloType)?.label ?? 'Solo'
      const farbEmoji = FARBEN.find(f => f.type === gameState.soloColor)?.emoji
      const typ = farbEmoji ? `${typLabel} ${farbEmoji}` : typLabel
      return `gegen ${typ} (${solist.players.name})`
    }
    const hochzeit = src('hochzeit')
    if (hochzeit) return `gegen Hochzeit (${hochzeit.players.name})`
    const arm = src('arm')
    if (arm) return `gegen Armut (${arm.players.name})`
    return null
  }

  // An-/Absage-Klick: läuft jetzt durch die Konsistenz-Engine (Teil 1). Die
  // Partei-Folge bei Re/Kontra und die Doppelungs-Prüfung stecken dort.
  function handleAnnouncement(type) {
    onAnnouncement(playerId, type)
  }

  // Sonderspiel-Setzen läuft jetzt über die geprüften, zusammengesetzten Aktionen
  // (Teil 2b): Rollen + Parteien in einem Zug durch die Konsistenz-Engine. Ein
  // Konflikt (z.B. die benannte Person hat Kontra gesagt) öffnet den Auflösungs-
  // Dialog; bei Abbruch passiert nichts. Das Sub-Sheet schließen wir trotzdem,
  // damit der Dialog frei liegt.
  function handleSoloTyp(type) {
    if (type === 'farb_solo') {
      setSubFlow('farbSolo')
    } else {
      onSetSolo(playerId, type, null)
      setSubFlow(null)
    }
  }

  function handleFarbSolo(color) {
    onSetSolo(playerId, 'farb_solo', color)
    setSubFlow(null)
  }

  function handleHochzeitPartner(partnerId) {
    onSetHochzeit(playerId, partnerId)
    setSubFlow(null)
  }

  function handleArmutReich(partnerId) {
    onSetArmut(playerId, partnerId)
    setSubFlow(null)
  }

  function handleSonderspielClear() {
    onSpecialRoleClear(playerId)
    setSubFlow(null)
  }

  // Schließt das Sub-Sheet aus BEIDEN Quellen: lokal gesetztes subFlow UND einen
  // evtl. offenen zentralen „von wem"-Auftrag (sonst bliebe der Picker hergeleitet offen).
  function closeSubFlow() {
    setSubFlow(null)
    clearPendingLoserSelection?.()
  }

  // Sonderpunkt-Klick (Teil 4): läuft jetzt durch die Konsistenz-Engine.
  //  • Kein Bestohlener (Doko / Karlchen gemacht): direkt – Engine committet oder
  //    öffnet bei vollem Kontingent C.3.2.
  //  • Gefangener Punkt (Fuchs / Karlchen gefangen): ist im Kontingent noch Platz,
  //    erst den „von wem?"-Picker öffnen (dort wird der Bestohlene gewählt, dann
  //    committet). Ist das Kontingent voll, gleich durch die Engine → C.3.2; das
  //    „von wem" kommt dann nach der Auflösung über pendingLoserSelection.
  function handleSonderpunktAdd(type, needsLoser) {
    if (needsLoser && !previewSpecialPoint(playerId, type, null)) {
      setSubFlow(type === 'fuchs_gefangen' ? 'fuchsVonWem' : 'karlchenVonWem')
    } else {
      onSpecialPointAdd(playerId, type, null)
    }
  }

  function handleLoserSelect(loserId, type) {
    // Würde diese/r Bestohlene einen Konflikt auslösen (gleiches Team, I12)? Dann
    // öffnet onSpecialPointAdd den Hinweis-Dialog C.3.4 – den Picker offen lassen,
    // damit nach „Abbrechen" eine andere Person gewählt werden kann (B.3.4). Sonst
    // (sauber) committen und den Picker schließen.
    const conflict = previewSpecialPoint(playerId, type, loserId)
    onSpecialPointAdd(playerId, type, loserId)
    if (!conflict) closeSubFlow()
  }

  // Personen-Auswahl: runde Avatare + Name, keine Kacheln.
  // conflictFor (optional): liefert true, wenn dieser Pick einen Konflikt auslösen
  // würde → Avatar optisch ausgegraut, aber klickbar (P5); der Klick öffnet dann
  // den Auflösungs-Dialog.
  function PlayerPicker({ title, onPick, conflictFor }) {
    return (
      <>
        <p className="text-sm font-semibold text-foreground mb-4">{title}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {activePlayers
            .filter(p => p.player_id !== playerId)
            .map(p => {
              const conflict = conflictFor?.(p.player_id)
              return (
                <button
                  key={p.player_id}
                  onClick={() => onPick(p.player_id)}
                  className={`flex flex-col items-center gap-1.5 active:opacity-60 ${conflict ? 'opacity-40' : ''}`}
                >
                  <PlayerAvatar player={p.players} size="md" />
                  <span className="text-xs font-medium text-foreground">{p.players.name}</span>
                </button>
              )
            })}
        </div>
      </>
    )
  }

  function renderSubFlowContent() {
    if (activeSubFlow === 'soloTyp') return (
      <>
        <p className="text-sm font-semibold text-foreground mb-3">Welches Solo?</p>
        <div className="grid grid-cols-2 gap-2">
          {SOLO_TYPEN.map(t => (
            <button
              key={t.type}
              onClick={() => handleSoloTyp(t.type)}
              className="p-3 rounded-xl border border-border bg-background active:bg-muted text-sm font-medium text-left"
            >
              {t.label}
            </button>
          ))}
        </div>
      </>
    )

    if (activeSubFlow === 'farbSolo') return (
      <>
        <p className="text-sm font-semibold text-foreground mb-3">Welche Farbe?</p>
        <div className="grid grid-cols-2 gap-3">
          {FARBEN.map(f => (
            <button
              key={f.type}
              onClick={() => handleFarbSolo(f.type)}
              className="py-5 rounded-xl border border-border bg-background active:bg-muted text-3xl"
            >
              {f.emoji}
            </button>
          ))}
        </div>
      </>
    )

    if (activeSubFlow === 'hochzeitPartner') return (
      <PlayerPicker
        title="Wen hast Du geheiratet?"
        onPick={handleHochzeitPartner}
        conflictFor={id => previewHochzeit?.(playerId, id)}
      />
    )

    if (activeSubFlow === 'armutReich') return (
      <PlayerPicker
        title="Who is the rich bitch? 💸"
        onPick={handleArmutReich}
        conflictFor={id => previewArmut?.(playerId, id)}
      />
    )

    if (activeSubFlow === 'fuchsVonWem') return (
      <PlayerPicker
        title="Fuchs gefangen – von wem?"
        onPick={id => handleLoserSelect(id, 'fuchs_gefangen')}
        conflictFor={id => previewSpecialPoint(playerId, 'fuchs_gefangen', id)}
      />
    )

    if (activeSubFlow === 'karlchenVonWem') return (
      <PlayerPicker
        title="Karlchen gefangen – von wem?"
        onPick={id => handleLoserSelect(id, 'karlchen_gefangen')}
        conflictFor={id => previewSpecialPoint(playerId, 'karlchen_gefangen', id)}
      />
    )

    return null
  }

  return (
    <>
      {/* Haupt-Backdrop: tippen schließt alles */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Player Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease',
        }}
      >
        {/* Drag-Handle: Touch-Events nur hier, nicht auf dem ganzen Sheet.
            So reagieren Buttons im Content-Bereich sofort ohne Drag-Verzögerung. */}
        <div
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header: Avatar + Name + Re/N/Ko-Toggle + X */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <PlayerAvatar player={playerData} size="sm" />
            <p className="font-semibold text-sm">{playerData.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[
                { value: 're',     label: 'Re' },
                // "neutral" ist nur ein Durchgangszustand: bei vollständig
                // zugeordnetem Tisch nicht mehr als Option anbieten (B.5.5).
                ...(teamsComplete ? [] : [{ value: null, label: '·' }]),
                { value: 'kontra', label: 'Ko' },
              ].map(opt => {
                const isActive = currentParty === opt.value
                // P5: würde dieser Partei-Klick einen Konflikt auslösen? → optisch
                // ausgegraut, aber klickbar (der Klick öffnet den Auflösungs-Dialog).
                const conflict = !isActive && opt.value !== null
                  && previewParty?.(playerId, opt.value)
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => onChangeParty(playerId, opt.value)}
                    className={`w-9 h-8 text-xs font-semibold transition-colors ${
                      isActive
                        ? opt.value === 're'
                          ? 'bg-green-700 text-white'
                          : opt.value === 'kontra'
                          ? 'bg-amber-500 text-white'
                          : 'bg-muted-foreground/30 text-foreground'
                        : 'bg-background text-muted-foreground'
                    } ${conflict ? 'opacity-40' : ''}`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollbarer Inhalt */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5 relative">

          {/* Overlay wenn Sub-Flow aktiv: Tippen auf Player Sheet schließt Sub-Flow */}
          {activeSubFlow && (
            <div className="absolute inset-0 z-10" onClick={closeSubFlow} />
          )}

          {/* AN- UND ABSAGEN */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              An- und Absagen
            </p>
            <div className="flex gap-2 mb-2">
              {[{ type: 're', label: 'Re' }, { type: 'kontra', label: 'Kontra' }].map(btn => {
                const active = currentAnnouncements.includes(btn.type)
                // P5: würde dieser Klick eine Doppelung erzeugen? → ausgegraut,
                // aber klickbar (der Klick öffnet dann den Auflösungs-Dialog).
                const conflict = !active && previewAnnouncement(playerId, btn.type)
                return (
                  <button
                    key={btn.type}
                    onClick={() => handleAnnouncement(btn.type)}
                    className={`flex-1 py-2 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border'
                    } ${conflict ? 'opacity-40' : ''}`}
                  >
                    {btn.label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { type: 'keine_90', label: 'Keine 90' },
                { type: 'keine_60', label: 'Keine 60' },
                { type: 'keine_30', label: 'Keine 30' },
                { type: 'schwarz',  label: 'Schwarz'  },
              ].map(btn => {
                const active = currentAnnouncements.includes(btn.type)
                const conflict = !active && previewAnnouncement(playerId, btn.type)
                return (
                  <button
                    key={btn.type}
                    onClick={() => handleAnnouncement(btn.type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border'
                    } ${conflict ? 'opacity-40' : ''}`}
                  >
                    {btn.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* SONDERSPIEL */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Sonderspiel
            </p>
            {activeSonderspiel() ? (
              <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                <span className="text-sm font-medium text-secondary-foreground flex-1">
                  {sonderspielLabel()}
                </span>
                {canClearRole && (
                  <button onClick={handleSonderspielClear} className="text-muted-foreground shrink-0">
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : someSpecialGameActive ? (
              // Gegner eines laufenden Sonderspiels: festes, read-only Label statt
              // der Auswahl-Buttons (B.4.4) – aufgelöst wird an der auslösenden Person.
              <div className="flex items-center bg-secondary rounded-xl px-3 py-2">
                <span className="text-sm font-medium text-secondary-foreground">
                  {gegnerLabel()}
                </span>
              </div>
            ) : (
              // Buttons gleichmäßig auf volle Breite verteilt
              <div className="flex gap-2">
                {[
                  { key: 'solo',     label: 'Solo',     flow: 'soloTyp'          },
                  { key: 'hochzeit', label: 'Hochzeit', flow: 'hochzeitPartner'  },
                  { key: 'armut',    label: 'Armut',    flow: 'armutReich'       },
                ].map(btn => {
                  // P5: Solo hängt nicht vom Typ ab → der Konflikt (eigene
                  // Gegen-Ansage) lässt sich schon am Eingang ausgrauen. Hochzeit/
                  // Armut hängen vom Partner ab – dort wird erst im Picker grau.
                  const conflict = btn.key === 'solo' && previewSolo?.(playerId, 'fleischlos', null)
                  return (
                    <button
                      key={btn.key}
                      onClick={() => setSubFlow(btn.flow)}
                      className={`flex-1 py-2 rounded-full text-sm font-medium border border-border bg-background active:bg-muted ${
                        conflict ? 'opacity-40' : ''
                      }`}
                    >
                      {btn.label}
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* SONDERPUNKTE */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Sonderpunkte
            </p>

            {/* Viererreihe: Fuchs / Doko / Karl / gefangen */}
            <div className="flex gap-2 mb-3">
              {SONDERPUNKT_TYPEN.map(def => {
                // P5: tischweites Kontingent erschöpft (I11)? → optisch ausgegraut,
                // aber klickbar; der Klick öffnet den Auflösungs-Dialog C.3.2.
                const conflict = previewSpecialPoint(playerId, def.type, null)
                return (
                  <button
                    key={def.type}
                    onClick={() => handleSonderpunktAdd(def.type, def.needsLoser)}
                    className={`flex-1 rounded-xl border overflow-hidden transition-colors border-border bg-background active:opacity-70 ${
                      conflict ? 'opacity-40' : ''
                    }`}
                  >
                    <SpIcon icon={def.icon} disabled={conflict} />
                  </button>
                )
              })}
            </div>

            {/* Ausgewählte Sonderpunkte mit X */}
            {ownSpecialPoints.length > 0 && (
              <div className="space-y-1.5">
                {ownSpecialPoints.map(sp => {
                  const def       = SONDERPUNKT_TYPEN.find(t => t.type === sp.type)
                  const loserName = sp.loserId
                    ? activePlayers.find(p => p.player_id === sp.loserId)?.players.name
                    : null
                  return (
                    <div key={sp.id} className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                      <SpIcon icon={def?.icon} size="sm" />
                      <span className="text-sm flex-1">
                        {def?.label}
                        {loserName && (
                          <span className="text-muted-foreground"> – von {loserName}</span>
                        )}
                      </span>
                      <button
                        onClick={() => onSpecialPointRemove(sp.id)}
                        className="text-muted-foreground shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <div className="h-4" />
        </div>
      </div>

      {/* Sub-Flow Sheet */}
      {activeSubFlow && (
        <>
          {/* Backdrop oben (Tisch-Bereich): tippen schließt ALLES */}
          <div
            className="fixed inset-x-0 top-0"
            style={{ zIndex: 55, height: '15vh' }}
            onClick={onClose}
          />
          {/* Backdrop mitte (sichtbarer Player-Sheet-Bereich): tippen schließt nur Sub-Flow */}
          <div
            className="fixed inset-x-0"
            style={{ zIndex: 55, top: '15vh', bottom: '55vh' }}
            onClick={closeSubFlow}
          />

          <div
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-2xl max-h-[55vh] flex flex-col"
            style={{
              zIndex: 60,
              transform: `translateY(${subDragY}px)`,
              transition: isSubDragging ? 'none' : 'transform 0.25s ease',
            }}
          >
            {/* Drag-Handle Sub-Flow: Touch-Events nur auf dem Handle */}
            <div
              className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing"
              onTouchStart={onSubDragStart}
              onTouchMove={onSubDragMove}
              onTouchEnd={onSubDragEnd}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-end px-4 py-2 border-b border-border shrink-0">
              <button onClick={closeSubFlow} className="p-1 text-muted-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-4">
              {renderSubFlowContent()}
              <div className="h-4" />
            </div>
          </div>
        </>
      )}
    </>
  )
}
