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

// Maximale Doppelköpfe: 16 Karten mit Punktwert ≥10 → max. 4 Stiche mit ≥40 Augen möglich
const DOPPELKOPF_MAX = 4

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

// Viererreihe: Fuchs / Doko / Karl / gefangen
const SONDERPUNKT_TYPEN = [
  { type: 'fuchs_gefangen',    label: 'Fuchs',    placeholder: 'F',  needsLoser: true,  max: 2            },
  { type: 'doppelkopf',        label: 'Doko',     placeholder: 'D',  needsLoser: false, max: DOPPELKOPF_MAX },
  { type: 'karlchen_gemacht',  label: 'Karl',     placeholder: 'K',  needsLoser: false, max: 1            },
  { type: 'karlchen_gefangen', label: 'gefangen', placeholder: 'Kg', needsLoser: true,  max: 1            },
]

// Platzhalter-Icon bis echte SVGs geliefert werden (→ CLAUDE.md Abschnitt 16)
function IconPlaceholder({ text, disabled = false }) {
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 ${
      disabled ? 'bg-muted text-muted-foreground/40' : 'bg-muted text-muted-foreground'
    }`}>
      {text}
    </span>
  )
}

export default function PlayerSheet({
  player,
  gameState,
  activePlayers,
  onPartyChange,
  onAnnouncementToggle,
  onSpecialRoleSet,
  onSpecialRoleClear,
  onSpecialPointAdd,
  onSpecialPointRemove,
  onClose,
}) {
  const playerId   = player.player_id
  const playerData = player.players

  const [subFlow, setSubFlow] = useState(null)

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

  function handleAnnouncement(type) {
    if (type === 're'     && currentParty !== 're')     onPartyChange(playerId, 're')
    if (type === 'kontra' && currentParty !== 'kontra') onPartyChange(playerId, 'kontra')
    onAnnouncementToggle(playerId, type)
  }

  function handleSoloTyp(type) {
    if (type === 'farb_solo') {
      setSubFlow('farbSolo')
    } else {
      onSpecialRoleSet(playerId, 'solist', { soloType: type, soloColor: null })
      onPartyChange(playerId, 're')
      setSubFlow(null)
    }
  }

  function handleFarbSolo(color) {
    onSpecialRoleSet(playerId, 'solist', { soloType: 'farb_solo', soloColor: color })
    onPartyChange(playerId, 're')
    setSubFlow(null)
  }

  function handleHochzeitPartner(partnerId) {
    onSpecialRoleSet(playerId,  'hochzeit',      null)
    onSpecialRoleSet(partnerId, 'eingeheiratet', null)
    onPartyChange(playerId,  're')
    onPartyChange(partnerId, 're')
    setSubFlow(null)
  }

  function handleArmutReich(partnerId) {
    onSpecialRoleSet(playerId,  'arm',   null)
    onSpecialRoleSet(partnerId, 'reich', null)
    onPartyChange(playerId,  're')
    onPartyChange(partnerId, 're')
    setSubFlow(null)
  }

  function handleSonderspielClear() {
    onSpecialRoleClear(playerId)
    setSubFlow(null)
  }

  function closeSubFlow() { setSubFlow(null) }

  function handleSonderpunktAdd(type, needsLoser) {
    if (needsLoser) {
      setSubFlow(type === 'fuchs_gefangen' ? 'fuchsVonWem' : 'karlchenVonWem')
    } else {
      onSpecialPointAdd(playerId, type, null)
    }
  }

  function handleLoserSelect(loserId, type) {
    onSpecialPointAdd(playerId, type, loserId)
    setSubFlow(null)
  }

  function countOwn(type) {
    return ownSpecialPoints.filter(sp => sp.type === type).length
  }

  // Personen-Auswahl: runde Avatare + Name, keine Kacheln
  function PlayerPicker({ title, onPick }) {
    return (
      <>
        <p className="text-sm font-semibold text-foreground mb-4">{title}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {activePlayers
            .filter(p => p.player_id !== playerId)
            .map(p => (
              <button
                key={p.player_id}
                onClick={() => onPick(p.player_id)}
                className="flex flex-col items-center gap-1.5 active:opacity-60"
              >
                <PlayerAvatar player={p.players} size="md" />
                <span className="text-xs font-medium text-foreground">{p.players.name}</span>
              </button>
            ))}
        </div>
      </>
    )
  }

  function renderSubFlowContent() {
    if (subFlow === 'soloTyp') return (
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

    if (subFlow === 'farbSolo') return (
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

    if (subFlow === 'hochzeitPartner') return (
      <PlayerPicker title="Wen hast Du geheiratet?" onPick={handleHochzeitPartner} />
    )

    if (subFlow === 'armutReich') return (
      <PlayerPicker title="Who is the rich bitch? 💸" onPick={handleArmutReich} />
    )

    if (subFlow === 'fuchsVonWem') return (
      <PlayerPicker
        title="Fuchs gefangen – von wem?"
        onPick={id => handleLoserSelect(id, 'fuchs_gefangen')}
      />
    )

    if (subFlow === 'karlchenVonWem') return (
      <PlayerPicker
        title="Karlchen gefangen – von wem?"
        onPick={id => handleLoserSelect(id, 'karlchen_gefangen')}
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
                { value: null,     label: '·'  },
                { value: 'kontra', label: 'Ko' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => onPartyChange(playerId, opt.value)}
                  className={`w-9 h-8 text-xs font-semibold transition-colors ${
                    currentParty === opt.value
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
            <button onClick={onClose} className="p-1 text-muted-foreground">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollbarer Inhalt */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5 relative">

          {/* Overlay wenn Sub-Flow aktiv: Tippen auf Player Sheet schließt Sub-Flow */}
          {subFlow && (
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
                return (
                  <button
                    key={btn.type}
                    onClick={() => handleAnnouncement(btn.type)}
                    className={`flex-1 py-2 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border'
                    }`}
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
                return (
                  <button
                    key={btn.type}
                    onClick={() => handleAnnouncement(btn.type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border'
                    }`}
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
            ) : (
              // Buttons gleichmäßig auf volle Breite verteilt
              <div className="flex gap-2">
                {[
                  { key: 'solo',     label: 'Solo',     flow: 'soloTyp'          },
                  { key: 'hochzeit', label: 'Hochzeit', flow: 'hochzeitPartner'  },
                  { key: 'armut',    label: 'Armut',    flow: 'armutReich'       },
                ].map(btn => (
                  <button
                    key={btn.key}
                    onClick={() => setSubFlow(btn.flow)}
                    className="flex-1 py-2 rounded-full text-sm font-medium border border-border bg-background active:bg-muted"
                  >
                    {btn.label}
                  </button>
                ))}
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
                const count    = countOwn(def.type)
                const disabled = count >= def.max
                return (
                  <button
                    key={def.type}
                    onClick={() => !disabled && handleSonderpunktAdd(def.type, def.needsLoser)}
                    disabled={disabled}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                      disabled
                        ? 'border-border bg-muted text-muted-foreground/40 cursor-not-allowed'
                        : 'border-border bg-background active:bg-muted text-foreground'
                    }`}
                  >
                    <IconPlaceholder text={def.placeholder} disabled={disabled} />
                    <span>{def.label}</span>
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
                      <IconPlaceholder text={def?.placeholder} />
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
      {subFlow && (
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
