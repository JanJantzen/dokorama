// SessionPage – Vollbild-Erfassungsscreen für einen aktiven Abend
// Keine Tab-Bar, maximale Fläche für die Spielerfassung.
// Das Ranglisten-Icon oben rechts öffnet per Bottom Sheet den aktuellen Spielstand.

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy } from 'lucide-react'

export default function SessionPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Schmale Kopfzeile – nimmt so wenig Platz wie möglich */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-border">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Beenden</span>
        </button>

        <span className="text-sm font-medium">Runde 1 · Spiel 1</span>

        {/* Ranglisten-Button – öffnet später einen Bottom Sheet mit dem Spielstand */}
        <button className="text-muted-foreground">
          <Trophy size={20} />
        </button>
      </header>

      {/* Spielerfassung – hier kommt in Phase 2 die eigentliche UI rein */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center text-muted-foreground text-sm">
          Spielerfassung folgt in Phase 2
        </div>
      </main>
    </div>
  )
}
