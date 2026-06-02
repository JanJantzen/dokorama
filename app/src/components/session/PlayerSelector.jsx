// PlayerSelector – Schritt 1: Wer spielt heute?
// Spieler:innen werden in der Reihenfolge angetippt, in der sie am Tisch sitzen.
// Sortierung: meiste Partien zuerst. Standard: Top 6, Rest eingeklappt.

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { useNavigate } from 'react-router-dom'

const MIN_PLAYERS = 4
const MAX_PLAYERS = 7
const DEFAULT_VISIBLE = 6

// Dynamischer Status-Text im Header
function getStatusText(count) {
  if (count === MAX_PLAYERS) return `${count} ausgewählt · Maximum erreicht`
  if (count >= MIN_PLAYERS) return `${count} ausgewählt`
  if (count === 0) return `Mindestens ${MIN_PLAYERS} auswählen`
  return `Noch mindestens ${MIN_PLAYERS - count} auswählen`
}

export default function PlayerSelector({ players, selected, onToggle, onNext }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const hasMany = players.length > DEFAULT_VISIBLE
  const isExpanded = showAll || !hasMany // alle sichtbar wenn ≤6 oder aufgeklappt

  // Spieler:innen nach Suchbegriff filtern
  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // Sichtbare Spieler:innen: bei aufgeklappt/wenig alle, sonst Top 6
  const visible = isExpanded ? filtered : filtered.slice(0, DEFAULT_VISIBLE)

  const isSelected = (player) => selected.some(p => p.id === player.id)
  const positionOf = (player) => selected.findIndex(p => p.id === player.id) + 1
  const atMax = selected.length >= MAX_PLAYERS

  function handleToggle(player) {
    if (!isSelected(player) && atMax) return
    onToggle(player)
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Kopfzeile mit dynamischem Status */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-5">
        <button onClick={() => navigate('/')} className="text-muted-foreground shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wer spielt?</h1>
          <p className={`text-sm mt-0.5 ${
            selected.length === MAX_PLAYERS
              ? 'text-primary font-medium'
              : selected.length >= MIN_PLAYERS
                ? 'text-muted-foreground'
                : 'text-muted-foreground'
          }`}>
            {getStatusText(selected.length)}
          </p>
        </div>
      </header>

      {/* Suchfeld – nur sichtbar wenn aufgeklappt und viele Spieler:innen */}
      {isExpanded && hasMany && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Spieler:in suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      {/* Feste Instruktion direkt über dem Grid */}
      <p className="px-4 pb-3 text-xs text-muted-foreground">
        In Sitzreihenfolge antippen
      </p>

      {/* Spieler:innen-Grid – keine Kacheln, nur Avatar + Name */}
      <div className="px-4 grid grid-cols-3 gap-x-3 gap-y-5 flex-1 content-start">
        {visible.map(player => {
          const sel = isSelected(player)
          const pos = positionOf(player)
          const disabled = !sel && atMax

          return (
            <button
              key={player.id}
              onClick={() => handleToggle(player)}
              disabled={disabled}
              className={`flex flex-col items-center gap-2 py-1 transition-all active:scale-95 ${disabled ? 'opacity-30' : ''}`}
            >
              {/* Avatar mit Selektions-Ring und Positions-Badge */}
              <div className="relative">
                <div className={sel ? 'ring-2 ring-primary ring-offset-2 rounded-full' : ''}>
                  <PlayerAvatar player={player} size="lg" />
                </div>
                {sel && (
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow-sm">
                    {pos}
                  </span>
                )}
              </div>

              {/* Name */}
              <span className={`text-xs text-center leading-tight font-medium ${sel ? 'text-primary' : 'text-foreground'}`}>
                {player.name}
              </span>
            </button>
          )
        })}

        {/* "Neu anlegen" – nur sichtbar wenn alle Spieler:innen sichtbar */}
        {isExpanded && (
          <button
            disabled
            className="flex flex-col items-center gap-2 py-1 opacity-40"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
              <Plus size={22} className="text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Neu anlegen</span>
          </button>
        )}
      </div>

      {/* "Alle anzeigen" – nur wenn mehr als 6 und noch nicht aufgeklappt */}
      {hasMany && !showAll && (
        <div className="px-4 pt-5">
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-2.5 text-sm text-muted-foreground border border-border rounded-xl bg-card"
          >
            Alle {players.length} Spieler:innen anzeigen
          </button>
        </div>
      )}

      {/* Weiter-Button */}
      <div className="px-4 py-6">
        <Button
          className="w-full h-14 text-base gap-2"
          disabled={selected.length < MIN_PLAYERS}
          onClick={onNext}
        >
          Weiter
          <ArrowRight size={20} />
        </Button>
      </div>
    </div>
  )
}
