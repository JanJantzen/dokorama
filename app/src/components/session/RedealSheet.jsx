// RedealSheet – Bottom Sheet für Neugeben-Events
//
// Zwei Modi:
//   'add'    → Typ auswählen (4 Buttons), dann Spieler-Picker mit Avataren
//   'list'   → Liste der bisherigen Gebeversuche mit Löschen + "Weiteres Neugeben"-Button
//
// Design orientiert sich 1:1 am PlayerSheet: weiße Card, Drag-Handle, Avatar-Picker.

import { useState, useRef } from 'react'
import { X, Trash2, Plus } from 'lucide-react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// Konfiguration der vier Typen
const REDEAL_TYPES = [
  {
    id:          'fuenf_neunen',
    label:       'Fünf Neunen',
    pickerTitle: 'Wer hatte die fünf Neunen?',
    needsPicker: true,
  },
  {
    id:          'armut_abgelehnt',
    label:       'Armut ohne Retter',
    pickerTitle: 'Wessen Armut wollte keiner retten?',
    needsPicker: true,
  },
  {
    id:          'trumpfschwach',
    label:       'Trumpfschwach',
    pickerTitle: 'Wer konnte keinen Fuchs stechen?',
    needsPicker: true,
  },
  {
    id:          'vergeben',
    label:       'Vergeben',
    pickerTitle: null, // kein Picker – Geber = Verursacher
    needsPicker: false,
  },
]

export const REDEAL_LABELS = {
  fuenf_neunen:    'Fünf Neunen',
  armut_abgelehnt: 'Armut ohne Retter',
  trumpfschwach:   'Trumpfschwach',
  vergeben:        'Vergeben',
}

export default function RedealSheet({
  initialMode = 'add', // 'add' | 'list'
  redeals,             // bisherige Neugeben-Events dieses Spielslots
  dealer,              // Participant-Objekt des aktuellen Gebers
  activePlayers,       // mitspielnde Teilnehmer:innen (für Avatar-Picker)
  participants,        // alle Teilnehmer:innen (für Namenslookup in der Liste)
  onSave,              // ({ redealType, culpritId }) → void
  onDelete,            // (id) → void
  onClose,
}) {
  const [mode,         setMode]         = useState(initialMode)
  const [selectedType, setSelectedType] = useState(null)

  // Drag-to-close (gleiche Geste wie PlayerSheet)
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

  function getName(playerId) {
    return participants.find(p => p.player_id === playerId)?.players?.name ?? '?'
  }

  function handleTypeSelect(type) {
    if (!type.needsPicker) {
      // Vergeben: Geber ist automatisch Verursacher
      onSave({ redealType: type.id, culpritId: dealer.player_id })
      onClose()
      return
    }
    setSelectedType(type)
    setMode('picker')
  }

  function handlePlayerSelect(playerId) {
    onSave({ redealType: selectedType.id, culpritId: playerId })
    onClose()
  }

  return (
    <>
      {/* Hintergrund-Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onPointerDown={onClose} />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col"
        style={{
          transform:  `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag-Handle */}
        <div
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="font-semibold text-sm">
            {mode === 'list' ? 'Gebeversuche' : 'Neu geben'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground p-1">
            <X size={18} />
          </button>
        </div>

        {/* Inhalt */}
        <div className="overflow-y-auto px-4 py-4 flex flex-col gap-3">

          {/* ── Typ auswählen ─────────────────────────────────────── */}
          {mode === 'add' && REDEAL_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type)}
              className="w-full text-left px-4 py-3.5 rounded-xl border border-border bg-background active:bg-muted text-sm font-medium text-foreground"
            >
              {type.label}
            </button>
          ))}

          {/* ── Avatar-Picker ──────────────────────────────────────── */}
          {mode === 'picker' && (
            <>
              <p className="text-sm font-semibold text-foreground mb-2">
                {selectedType?.pickerTitle}
              </p>
              <div className="flex flex-wrap justify-center gap-5 py-2">
                {activePlayers.map(p => (
                  <button
                    key={p.player_id}
                    onClick={() => handlePlayerSelect(p.player_id)}
                    className="flex flex-col items-center gap-1.5 active:opacity-60"
                  >
                    <PlayerAvatar player={p.players} size="md" />
                    <span className="text-xs font-medium text-foreground">{p.players.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Liste bisheriger Gebeversuche ──────────────────────── */}
          {mode === 'list' && (
            <>
              {redeals.map((r, i) => (
                <div
                  key={r.tempId}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-background"
                >
                  <span className="text-sm text-foreground">
                    <span className="text-muted-foreground mr-2">{i + 1}.</span>
                    {REDEAL_LABELS[r.redealType]}
                    {' – '}
                    <span className="font-medium">{getName(r.culpritId)}</span>
                  </span>
                  <button
                    onClick={() => onDelete(r.tempId)}
                    className="text-destructive/60 active:text-destructive ml-4 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setMode('add')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-background active:bg-muted text-sm font-medium text-muted-foreground mt-1"
              >
                <Plus size={16} />
                Weiteres Neugeben erfassen
              </button>
            </>
          )}

        </div>

        {/* iOS-Abstand unten */}
        <div className="shrink-0 h-safe-area-inset-bottom pb-4" />
      </div>
    </>
  )
}
