// PlayerSheet – Bottom Sheet für einen einzelnen Spieler im Erfassungsscreen
// Öffnet sich beim Tap auf einen Avatar.
// Drei Abschnitte: An- und Absagen / Sonderspiel / Sonderpunkte.
// Sheet zeigt immer den aktuellen Zustand – erneut öffnen = sehen + ändern.

import { useState } from 'react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { X, Plus } from 'lucide-react'

// --- Konstanten für die Anzeige ---

const ANSAGEN_BUTTONS = [
  { type: 're',       label: 'Re' },
  { type: 'kontra',   label: 'Kontra' },
  { type: 'keine_90', label: 'Keine 90' },
  { type: 'keine_60', label: 'Keine 60' },
  { type: 'keine_30', label: 'Keine 30' },
  { type: 'schwarz',  label: 'Schwarz' },
]

const SONDERSPIEL_BUTTONS = [
  { type: 'solo',     label: 'Solo' },
  { type: 'hochzeit', label: 'Hochzeit' },
  { type: 'armut',    label: 'Armut' },
]

const SOLO_TYPEN = [
  { type: 'fleischlos',   label: 'Fleischlos' },
  { type: 'buben_solo',   label: 'Buben-Solo' },
  { type: 'damen_solo',   label: 'Damen-Solo' },
  { type: 'farb_solo',    label: 'Farb-Solo' },
  { type: 'stilles_solo', label: 'Stilles Solo' },
]

const FARBEN = [
  { type: 'karo',  label: 'Karo ♦' },
  { type: 'herz',  label: 'Herz ♥' },
  { type: 'pik',   label: 'Pik ♠' },
  { type: 'kreuz', label: 'Kreuz ♣' },
]

const SONDERPUNKT_TYPEN = [
  { type: 'fuchs_gefangen',    label: '🦊 Fuchs gefangen',    needsLoser: true,  max: 2 },
  { type: 'karlchen_gemacht',  label: '♞ Karlchen gemacht',   needsLoser: false, max: 1 },
  { type: 'karlchen_gefangen', label: '♞ Karlchen gefangen',  needsLoser: true,  max: 1 },
  { type: 'doppelkopf',        label: '💰 Doppelkopf',        needsLoser: false, max: 99 },
]

// --- Hauptkomponente ---

export default function PlayerSheet({
  player,           // { player_id, players: {id, name, avatar_url}, isDealer, isSitting }
  gameState,        // vollständiger aktueller Spielzustand
  activePlayers,    // alle nicht-aussetzenden Spieler (für "Von wem?"-Auswahl)
  onPartyChange,    // (playerId, party: 're'|'kontra'|null) → void
  onAnnouncementToggle, // (playerId, type) → void
  onSpecialRoleSet,    // (playerId, role, extraData) → void
  onSpecialRoleClear,  // (playerId) → void
  onSpecialPointAdd,   // (earnerId, type, loserId|null) → void
  onSpecialPointRemove, // (pointId) → void
  onClose,
}) {
  const playerId = player.player_id
  const playerData = player.players

  // Sub-Flow: null = Hauptansicht, 'soloTyp', 'farbSolo', 'hochzeitPartner', 'armutRetter',
  //           'fuchsVonWem', 'karlchenVonWem'
  const [subFlow, setSubFlow] = useState(null)

  const currentParty        = gameState.parties[playerId] ?? null
  const currentAnnouncements = gameState.announcements[playerId] ?? []
  const currentSpecialRole  = gameState.specialRoles[playerId] ?? null
  const isSolist            = currentSpecialRole === 'solist'

  // Alle Sonderpunkte die dieser Spieler GEWONNEN hat
  const ownSpecialPoints = gameState.specialPoints.filter(sp => sp.earnerId === playerId)

  // --- Ansage togglen ---
  function handleAnnouncement(type) {
    // Re-Ansage setzt automatisch die Re-Partei, Kontra-Ansage die Kontra-Partei
    if (type === 're' && currentParty !== 're') onPartyChange(playerId, 're')
    if (type === 'kontra' && currentParty !== 'kontra') onPartyChange(playerId, 'kontra')
    onAnnouncementToggle(playerId, type)
  }

  // --- Sonderspiel auswählen ---
  function handleSonderspiel(type) {
    if (type === 'solo') {
      setSubFlow('soloTyp')
    } else if (type === 'hochzeit') {
      // Hochzeiter:in → Re-Partei, dann nach Partner fragen
      onSpecialRoleSet(playerId, 'hochzeiter', null)
      onPartyChange(playerId, 're')
      setSubFlow('hochzeitPartner')
    } else if (type === 'armut') {
      // Armut → Re-Partei, dann nach Retter fragen
      onSpecialRoleSet(playerId, 'armut', null)
      onPartyChange(playerId, 're')
      setSubFlow('armutRetter')
    }
  }

  function handleSoloTyp(type) {
    if (type === 'farb_solo') {
      onSpecialRoleSet(playerId, 'solist', { soloType: type, soloColor: null })
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

  function handlePartnerSelect(partnerId, role) {
    // Partner bekommt die Gegenseite der Spezialrolle und Re-Partei
    onSpecialRoleSet(partnerId, role, null)
    onPartyChange(partnerId, 're')
    setSubFlow(null)
  }

  function handleSonderspielClear() {
    onSpecialRoleClear(playerId)
    setSubFlow(null)
  }

  // --- Sonderpunkt hinzufügen ---
  function handleSonderpunktAdd(type, needsLoser) {
    if (needsLoser) {
      // Sub-Flow öffnen um zu fragen "Von wem?"
      setSubFlow(type === 'fuchs_gefangen' ? 'fuchsVonWem' : 'karlchenVonWem')
    } else {
      onSpecialPointAdd(playerId, type, null)
    }
  }

  function handleLoserSelect(loserId, type) {
    onSpecialPointAdd(playerId, type, loserId)
    setSubFlow(null)
  }

  // --- Renderhelfer ---

  // Wie viele Instanzen dieses Typs gibt es schon für diesen Spieler?
  function countOwn(type) {
    return ownSpecialPoints.filter(sp => sp.type === type).length
  }

  // Welche Sonderspiel-Kategorie ist aktuell aktiv?
  function activeSonderspiel() {
    if (!currentSpecialRole) return null
    if (['solist'].includes(currentSpecialRole))               return 'solo'
    if (['hochzeiter', 'eingeheiratet'].includes(currentSpecialRole)) return 'hochzeit'
    if (['armut', 'retter'].includes(currentSpecialRole))     return 'armut'
    return null
  }

  // Partner-Anzeige für Hochzeit/Armut im Sheet
  function partnerLabel() {
    if (currentSpecialRole === 'hochzeiter') {
      const partner = activePlayers.find(p =>
        gameState.specialRoles[p.player_id] === 'eingeheiratet'
      )
      return partner ? `→ ${partner.players.name} eingeheiratet` : null
    }
    if (currentSpecialRole === 'armut') {
      const retter = activePlayers.find(p =>
        gameState.specialRoles[p.player_id] === 'retter'
      )
      return retter ? `→ ${retter.players.name} ist Retter:in` : null
    }
    return null
  }

  // Solo-Label für die Anzeige
  function soloLabel() {
    if (!isSolist) return null
    const typLabel = SOLO_TYPEN.find(t => t.type === gameState.soloType)?.label ?? '?'
    const colorLabel = gameState.soloColor
      ? ` (${FARBEN.find(f => f.type === gameState.soloColor)?.label})`
      : ''
    return `${typLabel}${colorLabel}`
  }

  // --- Sub-Flow-Rendering ---

  // Spielerauswahl-Raster (für "Von wem?" und Hochzeit-/Armut-Partner)
  function PlayerPicker({ title, onPick, exclude }) {
    const options = activePlayers.filter(p => p.player_id !== exclude)
    return (
      <div>
        <p className="text-sm font-medium text-foreground mb-3">{title}</p>
        <div className="grid grid-cols-2 gap-2">
          {options.map(p => (
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
      </div>
    )
  }

  // Solo-Typ-Auswahl
  function SoloTypPicker() {
    return (
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Welches Solo?</p>
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
      </div>
    )
  }

  // Farb-Solo-Auswahl
  function FarbSoloPicker() {
    return (
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Welche Farbe?</p>
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
      </div>
    )
  }

  // --- Haupt-Render ---
  return (
    <>
      {/* Backdrop: tippen schließt das Sheet */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col">
        {/* Drag-Handle (dekorativ) */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header mit Spieler-Info */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <PlayerAvatar player={playerData} size="sm" />
            <div>
              <p className="font-semibold text-sm">{playerData.name}</p>
              {currentParty && (
                <p className={`text-xs font-medium ${currentParty === 're' ? 'text-green-700' : 'text-amber-600'}`}>
                  {currentParty === 're' ? 'Re' : 'Kontra'}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Scrollbarer Inhalt */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">

          {/* Sub-Flow: Solo-Typ */}
          {subFlow === 'soloTyp' && <SoloTypPicker />}

          {/* Sub-Flow: Farb-Solo Farbe */}
          {subFlow === 'farbSolo' && <FarbSoloPicker />}

          {/* Sub-Flow: Hochzeit-Partner */}
          {subFlow === 'hochzeitPartner' && (
            <PlayerPicker
              title="Wer hat eingeheiratet?"
              onPick={(id) => handlePartnerSelect(id, 'eingeheiratet')}
              exclude={playerId}
            />
          )}

          {/* Sub-Flow: Armut-Retter */}
          {subFlow === 'armutRetter' && (
            <PlayerPicker
              title="Wer ist Retter:in?"
              onPick={(id) => handlePartnerSelect(id, 'retter')}
              exclude={playerId}
            />
          )}

          {/* Sub-Flow: Fuchs von wem */}
          {subFlow === 'fuchsVonWem' && (
            <PlayerPicker
              title="Fuchs gefangen – von wem?"
              onPick={(id) => handleLoserSelect(id, 'fuchs_gefangen')}
              exclude={playerId}
            />
          )}

          {/* Sub-Flow: Karlchen gefangen von wem */}
          {subFlow === 'karlchenVonWem' && (
            <PlayerPicker
              title="Karlchen gefangen – von wem?"
              onPick={(id) => handleLoserSelect(id, 'karlchen_gefangen')}
              exclude={playerId}
            />
          )}

          {/* Haupt-Ansicht (nur wenn kein Sub-Flow aktiv) */}
          {!subFlow && (
            <>
              {/* Abschnitt: An- und Absagen */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  An- und Absagen
                </p>
                <div className="flex flex-wrap gap-2">
                  {ANSAGEN_BUTTONS.map(btn => {
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

              {/* Abschnitt: Sonderspiel */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Sonderspiel
                </p>

                {/* Aktuell aktives Sonderspiel anzeigen */}
                {activeSonderspiel() && (
                  <div className="mb-2 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                    <span className="text-sm font-medium text-secondary-foreground flex-1">
                      {currentSpecialRole === 'solist' && soloLabel()}
                      {currentSpecialRole === 'hochzeiter' && `Hochzeit${partnerLabel() ? ` ${partnerLabel()}` : ''}`}
                      {currentSpecialRole === 'eingeheiratet' && 'Eingeheiratet'}
                      {currentSpecialRole === 'armut' && `Armut${partnerLabel() ? ` ${partnerLabel()}` : ''}`}
                      {currentSpecialRole === 'retter' && 'Retter:in'}
                    </span>
                    <button onClick={handleSonderspielClear} className="text-muted-foreground">
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Sonderspiel-Buttons (ausblenden wenn bereits eine Rolle aktiv) */}
                {!currentSpecialRole && (
                  <div className="flex gap-2 flex-wrap">
                    {SONDERSPIEL_BUTTONS.map(btn => (
                      <button
                        key={btn.type}
                        onClick={() => handleSonderspiel(btn.type)}
                        className="px-3 py-1.5 rounded-full text-sm font-medium border border-border bg-background active:bg-muted"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Abschnitt: Sonderpunkte */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Sonderpunkte
                </p>

                {/* Bereits erfasste Sonderpunkte mit Löschen-X */}
                {ownSpecialPoints.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    {ownSpecialPoints.map(sp => {
                      const def = SONDERPUNKT_TYPEN.find(t => t.type === sp.type)
                      const loserName = sp.loserId
                        ? activePlayers.find(p => p.player_id === sp.loserId)?.players.name
                        : null
                      return (
                        <div
                          key={sp.id}
                          className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2"
                        >
                          <span className="text-sm flex-1">
                            {def?.label}
                            {loserName && <span className="text-muted-foreground"> von {loserName}</span>}
                          </span>
                          <button
                            onClick={() => onSpecialPointRemove(sp.id)}
                            className="text-muted-foreground"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Sonderpunkt-Buttons (nur wenn max noch nicht erreicht) */}
                <div className="flex flex-col gap-2">
                  {SONDERPUNKT_TYPEN.map(def => {
                    const count = countOwn(def.type)
                    const canAdd = count < def.max
                    if (!canAdd) return null
                    return (
                      <button
                        key={def.type}
                        onClick={() => handleSonderpunktAdd(def.type, def.needsLoser)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-muted-foreground active:bg-muted text-sm"
                      >
                        <Plus size={14} />
                        {def.label}
                        {count > 0 && <span className="ml-auto text-xs">+{count} bereits</span>}
                      </button>
                    )
                  })}
                </div>
              </section>
            </>
          )}

          {/* Sub-Flow: Zurück-Button */}
          {subFlow && (
            <button
              onClick={() => setSubFlow(null)}
              className="text-sm text-muted-foreground underline"
            >
              ← Zurück
            </button>
          )}

          {/* Abstand am Ende für Scroll */}
          <div className="h-4" />
        </div>
      </div>
    </>
  )
}
