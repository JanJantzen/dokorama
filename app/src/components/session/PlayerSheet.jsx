// PlayerSheet – Bottom Sheet für einen einzelnen Spieler im Erfassungsscreen
//
// Aufbau:
//   Header:        Avatar + Name + Re/N/Ko-Toggle (auch hier änderbar)
//   Abschnitt 1:   An- und Absagen (2 Zeilen: Re/Ko oben, Absagen unten)
//   Abschnitt 2:   Sonderspiel (Solo / Hochzeit / Armut)
//   Abschnitt 3:   Sonderpunkte (2×2-Raster zum Auswählen, Liste der ausgewählten darunter)
//
// Sub-Flows (Solo-Typ, Farb-Solo, Partner-Auswahl, Von-Wem?) erscheinen als zweites,
// kleineres Bottom Sheet gestapelt über diesem Sheet:
//   - X schließt nur den Sub-Flow, Player Sheet bleibt offen
//   - Tippen auf sichtbaren Player-Sheet-Bereich schließt Sub-Flow
//   - Tippen auf dunklen Tisch-Backdrop schließt alles
//
// Rollen werden erst in den Spielzustand geschrieben wenn die Auswahl vollständig ist.
// Partner-Rollen (eingeheiratet / reich) sind read-only: nur der Initiator kann löschen.

import { useState } from 'react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { X } from 'lucide-react'

// Maximale Doppelköpfe pro Spiel: 16 Karten mit Punktwert ≥10 → max. 4 Stiche mit ≥40 Augen
const DOPPELKOPF_MAX = 4

const SOLO_TYPEN = [
  { type: 'fleischlos',   label: 'Fleischlos'   },
  { type: 'buben_solo',   label: 'Buben-Solo'   },
  { type: 'damen_solo',   label: 'Damen-Solo'   },
  { type: 'farb_solo',    label: 'Farb-Solo'    },
  { type: 'stilles_solo', label: 'Stilles Solo' },
]

const FARBEN = [
  { type: 'karo',  label: 'Karo ♦'  },
  { type: 'herz',  label: 'Herz ♥'  },
  { type: 'pik',   label: 'Pik ♠'   },
  { type: 'kreuz', label: 'Kreuz ♣' },
]

// 2×2-Raster: Fuchs / Karlchen gemacht / Doppelkopf / Karlchen gefangen
const SONDERPUNKT_TYPEN = [
  { type: 'fuchs_gefangen',    label: 'Fuchs gefangen',    placeholder: 'F',  needsLoser: true,  max: 2            },
  { type: 'karlchen_gemacht',  label: 'Karlchen gemacht',  placeholder: 'Km', needsLoser: false, max: 1            },
  { type: 'doppelkopf',        label: 'Doppelkopf',        placeholder: 'D',  needsLoser: false, max: DOPPELKOPF_MAX },
  { type: 'karlchen_gefangen', label: 'Karlchen gefangen', placeholder: 'Kg', needsLoser: true,  max: 1            },
]

// Platzhalter-Icon: abgerundetes Quadrat mit Buchstaben-Kürzel.
// Wird durch echte SVG-Icons ersetzt sobald Jan die Dateien liefert (→ CLAUDE.md Abschnitt 16).
function IconPlaceholder({ text, disabled = false }) {
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 ${
      disabled ? 'bg-muted text-muted-foreground/40' : 'bg-muted text-muted-foreground'
    }`}>
      {text}
    </span>
  )
}

export default function PlayerSheet({
  player,             // { player_id, players: {id, name, avatar_url}, isDealer, isSitting }
  gameState,          // vollständiger aktueller Spielzustand
  activePlayers,      // alle nicht-aussetzenden Spieler
  onPartyChange,      // (playerId, party: 're'|'kontra'|null) → void
  onAnnouncementToggle, // (playerId, type) → void
  onSpecialRoleSet,   // (playerId, role, extraData) → void
  onSpecialRoleClear, // (playerId) → void
  onSpecialPointAdd,  // (earnerId, type, loserId|null) → void
  onSpecialPointRemove, // (pointId) → void
  onClose,            // () → void – schließt alles
}) {
  const playerId   = player.player_id
  const playerData = player.players

  // Welcher Sub-Flow ist gerade offen?
  // null | 'soloTyp' | 'farbSolo' | 'hochzeitPartner' | 'armutReich' | 'fuchsVonWem' | 'karlchenVonWem'
  const [subFlow, setSubFlow] = useState(null)

  const currentParty         = gameState.parties[playerId] ?? null
  const currentAnnouncements = gameState.announcements[playerId] ?? []
  const currentSpecialRole   = gameState.specialRoles[playerId] ?? null
  const ownSpecialPoints     = gameState.specialPoints.filter(sp => sp.earnerId === playerId)

  // Initiator kann die Sonderrolle löschen (und damit auch die des Partners)
  const isInitiator = ['hochzeit', 'arm'].includes(currentSpecialRole)
  // Partner-Rollen sind read-only (nur durch den Initiator löschbar)
  const isPartner   = ['eingeheiratet', 'reich'].includes(currentSpecialRole)

  // Welche Sonderspiel-Kategorie ist aktuell aktiv?
  function activeSonderspiel() {
    if (!currentSpecialRole) return null
    if (currentSpecialRole === 'solist') return 'solo'
    if (['hochzeit', 'eingeheiratet'].includes(currentSpecialRole)) return 'hochzeit'
    if (['arm', 'reich'].includes(currentSpecialRole)) return 'armut'
    return null
  }

  // Anzeigetext für die aktive Sonderrolle im Sheet
  function sonderspielLabel() {
    if (currentSpecialRole === 'solist') {
      const typLabel  = SOLO_TYPEN.find(t => t.type === gameState.soloType)?.label ?? 'Solo'
      const farbLabel = FARBEN.find(f => f.type === gameState.soloColor)?.label
      return farbLabel ? `${typLabel} (${farbLabel})` : typLabel
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

  // --- Ansage togglen ---
  function handleAnnouncement(type) {
    // Re/Kontra setzen auch automatisch die Partei (für die Tischansicht)
    if (type === 're'     && currentParty !== 're')     onPartyChange(playerId, 're')
    if (type === 'kontra' && currentParty !== 'kontra') onPartyChange(playerId, 'kontra')
    onAnnouncementToggle(playerId, type)
  }

  // --- Solo-Auswahl ---
  function handleSoloTyp(type) {
    if (type === 'farb_solo') {
      // Bei Farb-Solo: erst Farbe wählen, dann committen
      setSubFlow('farbSolo')
    } else {
      // Sofort committen – vollständige Auswahl
      onSpecialRoleSet(playerId, 'solist', { soloType: type, soloColor: null })
      onPartyChange(playerId, 're')
      setSubFlow(null)
    }
  }

  function handleFarbSolo(color) {
    // Jetzt vollständig: Solist + Typ + Farbe committen
    onSpecialRoleSet(playerId, 'solist', { soloType: 'farb_solo', soloColor: color })
    onPartyChange(playerId, 're')
    setSubFlow(null)
  }

  // --- Hochzeit-Partner auswählen ---
  // Erst wenn Partner gewählt ist, werden BEIDE Rollen committet
  function handleHochzeitPartner(partnerId) {
    onSpecialRoleSet(playerId,  'hochzeit',      null)
    onSpecialRoleSet(partnerId, 'eingeheiratet', null)
    onPartyChange(playerId,  're')
    onPartyChange(partnerId, 're')
    setSubFlow(null)
  }

  // --- Armut-Partner auswählen (Who is the rich bitch?) ---
  // Erst wenn Partner gewählt ist, werden BEIDE Rollen committet
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

  function closeSubFlow() {
    setSubFlow(null)
  }

  // --- Sonderpunkte ---
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

  // --- Sub-Flow-Inhalt ---
  function renderSubFlowContent() {
    // Spieler-Auswahl-Raster (für Hochzeit-Partner, Armut-Reich, Von-Wem?)
    function PlayerPicker({ title, onPick }) {
      return (
        <>
          <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
          <div className="grid grid-cols-2 gap-2">
            {activePlayers
              .filter(p => p.player_id !== playerId)
              .map(p => (
                <button
                  key={p.player_id}
                  onClick={() => onPick(p.player_id)}
                  className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background active:bg-muted text-left"
                >
                  <PlayerAvatar player={p.players} size="sm" />
                  <span className="text-sm font-medium">{p.players.name}</span>
                </button>
              ))}
          </div>
        </>
      )
    }

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
        <div className="grid grid-cols-2 gap-2">
          {FARBEN.map(f => (
            <button
              key={f.type}
              onClick={() => handleFarbSolo(f.type)}
              className="p-3 rounded-xl border border-border bg-background active:bg-muted text-sm font-medium"
            >
              {f.label}
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

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      {/* Haupt-Backdrop (hinter dem Player Sheet): tippen schließt alles */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Player Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col">

        {/* Drag-Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
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

        {/* Scrollbarer Inhalt – wenn Sub-Flow offen: Overlay fängt Taps ab (→ Sub-Flow schließen) */}
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
            {/* Zeile 1: Re / Kontra (gegenseitig ausschließend) */}
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
            {/* Zeile 2: Absagen (unabhängig von Re/Kontra, einzeln an/aus) */}
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
              // Aktive Rolle anzeigen
              <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                <span className="text-sm font-medium text-secondary-foreground flex-1">
                  {sonderspielLabel()}
                </span>
                {/* Nur Initiator kann löschen – Partner sieht die Rolle nur als Info */}
                {isInitiator && (
                  <button onClick={handleSonderspielClear} className="text-muted-foreground shrink-0">
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              // Auswahl-Buttons (nur wenn noch keine Rolle aktiv)
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'solo',    label: 'Solo',    flow: 'soloTyp'          },
                  { key: 'hochzeit', label: 'Hochzeit', flow: 'hochzeitPartner' },
                  { key: 'armut',   label: 'Armut',   flow: 'armutReich'       },
                ].map(btn => (
                  <button
                    key={btn.key}
                    onClick={() => setSubFlow(btn.flow)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border border-border bg-background active:bg-muted"
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

            {/* 2×2-Raster: Auswahl-Buttons (ausgegraut wenn Maximum erreicht) */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {SONDERPUNKT_TYPEN.map(def => {
                const count    = countOwn(def.type)
                const disabled = count >= def.max
                return (
                  <button
                    key={def.type}
                    onClick={() => !disabled && handleSonderpunktAdd(def.type, def.needsLoser)}
                    disabled={disabled}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left ${
                      disabled
                        ? 'border-border bg-muted text-muted-foreground/40 cursor-not-allowed'
                        : 'border-border bg-background active:bg-muted text-foreground'
                    }`}
                  >
                    <IconPlaceholder text={def.placeholder} disabled={disabled} />
                    <span className="leading-tight">{def.label}</span>
                    {count > 0 && !disabled && (
                      <span className="ml-auto text-xs text-muted-foreground">+{count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Liste der bereits ausgewählten Sonderpunkte mit X zum Löschen */}
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

      {/* Sub-Flow Sheet – kleines Sheet über dem Player Sheet */}
      {subFlow && (
        <>
          {/* Sub-Flow-Backdrop: deckt den sichtbaren Player-Sheet-Bereich ab.
              Tippen darauf schließt nur den Sub-Flow (nicht das Player Sheet). */}
          <div
            className="fixed inset-x-0 top-0 z-55"
            style={{ zIndex: 55, bottom: '55vh' }}
            onClick={closeSubFlow}
          />

          {/* Das eigentliche Sub-Flow-Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-2xl max-h-[55vh] flex flex-col"
            style={{ zIndex: 60 }}
          >
            {/* Drag-Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header: nur X-Button (kein "Zurück") */}
            <div className="flex items-center justify-end px-4 py-2 border-b border-border shrink-0">
              <button onClick={closeSubFlow} className="p-1 text-muted-foreground">
                <X size={20} />
              </button>
            </div>

            {/* Sub-Flow-Inhalt */}
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
