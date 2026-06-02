// HomePage – Startseite wenn kein Abend läuft
// Zeigt den "Abend starten"-Button und zuletzt gespielte Abende.

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PlayCircle } from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Kopfzeile */}
      <header className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dokorama</h1>
        <p className="text-muted-foreground text-sm mt-1">Willkommen zurück</p>
      </header>

      {/* Hauptaktion: Abend starten */}
      <div className="px-4">
        <Button
          className="w-full h-16 text-lg gap-3"
          onClick={() => navigate('/abend/starten')}
        >
          <PlayCircle size={24} />
          Abend starten
        </Button>
      </div>

      {/* Platzhalter für zuletzt gespielte Abende */}
      <div className="px-4 mt-8">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Letzte Abende
        </h2>
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
          Noch keine Abende gespielt
        </div>
      </div>
    </div>
  )
}
