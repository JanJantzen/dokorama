// SeatingConfirm – Schritt 2: Partie bestätigen
// Zeigt Datum, Ort und Sitzreihenfolge zur Bestätigung (Reihenfolge: Wann → Wo → Wer).
// Die Sitzreihenfolge kann per Drag & Drop noch angepasst werden.

import { useState } from 'react'
import {
  DndContext, closestCenter,
  MouseSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, GripVertical, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { cn } from '@/lib/utils'

// Berechnet die Rolle in Spiel 1 basierend auf Sitzposition und Spielerzahl
function getRoleLabel(position, totalPlayers) {
  const roles = []
  if (position === 1) {
    roles.push('Geben')
    if (totalPlayers >= 5) roles.push('Aussetzen')
  }
  if (position === 2) roles.push('Rauskommen')
  if (position === 3 && totalPlayers >= 6) roles.push('Aussetzen')
  if (position === 5 && totalPlayers >= 7) roles.push('Aussetzen')
  return roles.join(' · ')
}

// Eine einzelne sortierbare Zeile in der Sitzliste
function SortableRow({ player, position, totalPlayers }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id })
  const role = getRoleLabel(position, totalPlayers)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5 transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg z-50' : ''
      }`}
    >
      {/* Positionsnummer */}
      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
        {position}
      </span>

      {/* Avatar */}
      <PlayerAvatar player={player} size="sm" />

      {/* Name + Rolle */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm">{player.name}</span>
        {role && (
          <span className="ml-2 text-xs text-muted-foreground">{role}</span>
        )}
      </div>

      {/* Drag-Handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground touch-none p-1 cursor-grab active:cursor-grabbing"
        aria-label="Reihenfolge ändern"
      >
        <GripVertical size={20} />
      </button>
    </div>
  )
}

export default function SeatingConfirm({
  players, venues, venue, date,
  onReorder, onVenueChange, onDateChange,
  onBack, onConfirm, saving,
}) {
  const [venueOpen, setVenueOpen] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = players.findIndex(p => p.id === active.id)
      const newIndex = players.findIndex(p => p.id === over.id)
      onReorder(arrayMove(players, oldIndex, newIndex))
    }
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Kopfzeile */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partie bestätigen</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Ort wählen · Datum und Reihenfolge bestätigen</p>
        </div>
      </header>

      <div className="flex-1 px-4 flex flex-col gap-6 pb-4">

        {/* 1. WANN – Datum */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Datum</label>
          <input
            type="date"
            value={date}
            onChange={e => onDateChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />
        </div>

        {/* 2. WO – Ort (Combobox mit Suche) */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Ort</label>
          <Popover open={venueOpen} onOpenChange={setVenueOpen}>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm text-left">
                <span className={venue ? 'text-foreground' : 'text-muted-foreground'}>
                  {venue ? venue.name : 'Ort auswählen...'}
                </span>
                <ChevronDown size={16} className="text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
              <Command>
                <CommandInput placeholder="Suchen..." />
                <CommandEmpty>Kein Ort gefunden</CommandEmpty>
                <CommandGroup>
                  {venues.map(v => (
                    <CommandItem
                      key={v.id}
                      value={v.name}
                      onSelect={() => { onVenueChange(v); setVenueOpen(false) }}
                    >
                      <Check
                        size={16}
                        className={cn('mr-2 shrink-0', venue?.id === v.id ? 'opacity-100' : 'opacity-0')}
                      />
                      {v.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* 3. WER – Sitzreihenfolge */}
        <div>
          <div className="mb-1">
            <span className="text-sm font-medium text-muted-foreground">Sitzreihenfolge</span>
            <p className="text-xs text-muted-foreground mt-0.5">Rollen gelten für Spiel 1</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={players.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2 mt-2">
                {players.map((player, index) => (
                  <SortableRow
                    key={player.id}
                    player={player}
                    position={index + 1}
                    totalPlayers={players.length}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Partie starten */}
      <div className="px-4 py-6">
        <Button
          className="w-full h-14 text-base"
          onClick={onConfirm}
          disabled={saving}
        >
          {saving ? 'Wird gestartet...' : 'Lasst die Spiele beginnen!'}
        </Button>
      </div>
    </div>
  )
}
