// BlockView – Block-Ansicht für die Spielerfassung (Platzhalter)
//
// Geplant: nüchterner Schreibblock-Stil, alle Infos auf einer Seite ohne Sheets.
// Teilt denselben GameContext wie TableView – Zustand bleibt beim Wechsel erhalten.

import { ClipboardList } from 'lucide-react'

export default function BlockView() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 bg-background text-center px-8">
      <ClipboardList size={48} className="text-muted-foreground/30" />
      <div>
        <p className="font-semibold text-foreground">Block-Ansicht</p>
        <p className="text-sm text-muted-foreground mt-1">Kommt bald – nüchterner Schreibblock-Stil als Alternative zur Tisch-Ansicht.</p>
      </div>
    </main>
  )
}
