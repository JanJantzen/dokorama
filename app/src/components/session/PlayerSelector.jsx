// PlayerSelector – Schritt 1: Wer spielt heute?
// Spieler:innen werden in der Reihenfolge angetippt, in der sie am Tisch sitzen.
// Sortierung: meiste Partien zuerst (Stammspieler:innen oben).
// Standard: Top 6 sichtbar, Rest eingeklappt.

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { useNavigate } from 'react-router-dom'

const MIN_PLAYERS = 4
const MAX_PLAYERS = 7
const DEFAULT_VISIBLE = 6

export default function PlayerSelector({ players, selected, onToggle, onNext }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  // Spieler:innen nach Suchbegriff filtern (Groß-/Kleinschreibung egal)
  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // Bei aktiver Suche immer alle zeigen, sonst erst Top 6
  const visible = (search || showAll) ? filtered : filtered.slice(0, DEFAULT_VISIBLE)
  const hiddenCount = filtered.length - DEFAULT_VISIBLE

  const isSelected = (player) => selected.some(p => p.id === player.id)
  const positionOf = (player) => selected.findIndex(p => p.id === player.id) + 1
  const atMax = selected.length >= MAX_PLAYERS

  function handleToggle(player) {
    if (!isSelected(player) && atMax) return // Max erreicht – kein weiteres Auswählen
    onToggle(player)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Kopfzeile */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wer spielt?</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            In Sitzreihenfolge antippen · {selected.length}/{MAX_PLAYERS}
          </p>
        </div>
      </header>

      {/* Suchfeld */}
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

      {/* Hinweis wenn Maximum erreicht */}
      {atMax && (
        <p className="px-4 pb-3 text-xs text-muted-foreground text-center">
          Maximum von {MAX_PLAYERS} Spieler:innen erreicht
        </p>
      )}

      {/* Spieler:innen-Raster */}
      <div className="px-4 grid grid-cols-3 gap-3 flex-1 content-start">
        {visible.map(player => {
          const sel = isSelected(player)
          const pos = positionOf(player)
          const disabled = !sel && atMax

          return (
            <button
              key={player.id}
              onClick={() => handleToggle(player)}
              disabled={disabled}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 pt-4 pb-3 px-2 gap-2 transition-all active:scale-95 ${
                sel
                  ? 'border-primary bg-primary/10'
                  : disabled
                    ? 'border-border bg-card opacity-35'
                    : 'border-border bg-card'
              }`}
            >
              {/* Sitzpositionsnummer oben links */}
              {sel && (
                <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {pos}
                </span>
              )}

              <PlayerAvatar player={player} size="md" />
              <span className={`text-xs leading-tight text-center font-medium ${sel ? 'text-primary' : 'text-foreground'}`}>
                {player.name}
              </span>
            </button>
          )
        })}

        {/* "Neuen Spieler anlegen" Platzhalter */}
        <button
          disabled
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card pt-4 pb-3 px-2 gap-2 opacity-40"
        >
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center">
            <Plus size={20} className="text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">Neu anlegen</span>
        </button>
      </div>

      {/* "Alle anzeigen"-Button */}
      {!search && !showAll && hiddenCount > 0 && (
        <div className="px-4 pt-4">
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-2 text-sm text-muted-foreground border border-border rounded-xl bg-card"
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
        {selected.length < MIN_PLAYERS && (
          <p className="text-center text-muted-foreground text-sm mt-2">
            Mindestens {MIN_PLAYERS} Spieler:innen auswählen
          </p>
        )}
      </div>
    </div>
  )
}
