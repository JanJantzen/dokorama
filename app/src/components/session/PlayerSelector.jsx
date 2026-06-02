// PlayerSelector – Schritt 1: Wer spielt heute?
// Spieler:innen werden in der Reihenfolge angetippt, in der sie am Tisch sitzen.
// Die Nummer auf dem Button zeigt die Sitzposition.

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function PlayerSelector({ players, selected, onToggle, onNext }) {
  const navigate = useNavigate()

  // Ist diese:r Spieler:in bereits ausgewählt?
  const isSelected = (player) => selected.some(p => p.id === player.id)

  // An welcher Sitzposition sitzt diese:r Spieler:in?
  const positionOf = (player) => selected.findIndex(p => p.id === player.id) + 1

  return (
    <div className="flex flex-col min-h-screen">
      {/* Kopfzeile mit Zurück-Button */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wer spielt heute?</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            In Sitzreihenfolge antippen · {selected.length} ausgewählt
          </p>
        </div>
      </header>

      {/* Spieler:innen-Raster */}
      <div className="px-4 grid grid-cols-3 gap-3 flex-1 content-start">
        {players.map(player => {
          const sel = isSelected(player)
          const pos = positionOf(player)
          return (
            <button
              key={player.id}
              onClick={() => onToggle(player)}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-4 h-24 transition-all active:scale-95 ${
                sel
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border bg-card text-foreground'
              }`}
            >
              {/* Sitzpositionsnummer oben links wenn ausgewählt */}
              {sel && (
                <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {pos}
                </span>
              )}
              <span className="text-sm leading-tight text-center">{player.name}</span>
            </button>
          )
        })}
      </div>

      {/* Weiter-Button */}
      <div className="px-4 py-6">
        <Button
          className="w-full h-14 text-base gap-2"
          disabled={selected.length < 4}
          onClick={onNext}
        >
          Weiter zur Sitzreihenfolge
          <ArrowRight size={20} />
        </Button>
        {selected.length < 4 && (
          <p className="text-center text-muted-foreground text-sm mt-2">
            Mindestens 4 Spieler:innen auswählen
          </p>
        )}
      </div>
    </div>
  )
}
