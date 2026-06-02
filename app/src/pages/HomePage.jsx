// HomePage – Startseite
// Zeigt laufende Partie (nur wenn vorhanden), "Neue Partie starten"-Button und letzte Partien.

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PlayCircle } from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()

  // TODO: laufende Partie aus Supabase laden (Phase 2)
  const activeSession = null

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Kopfzeile */}
      <header className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dokorama</h1>
        <p className="text-muted-foreground text-sm mt-1">Willkommen zurück</p>
      </header>

      <div className="px-4 flex flex-col gap-8">
        {/* Laufende Partie – nur anzeigen wenn vorhanden */}
        {activeSession && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Laufende Partie
            </h2>
            {/* TODO: Partie-Karte mit Weiter-Button */}
          </div>
        )}

        {/* Neue Partie starten */}
        <Button
          className="w-full h-16 text-lg gap-3"
          onClick={() => navigate('/partie/starten')}
        >
          <PlayCircle size={24} />
          Neue Partie starten
        </Button>

        {/* Letzte Partien */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Letzte Partien
          </h2>
          <div className="rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
            Noch keine Partien gespielt
          </div>
        </div>
      </div>
    </div>
  )
}
