// PlayersPage – Spieler:innen-Übersicht
// Platzhalter – wird später mit echten Spieler:innen aus Supabase befüllt.

export default function PlayersPage() {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Spieler</h1>
        <p className="text-muted-foreground text-sm mt-1">Alle Mitglieder der Runde</p>
      </header>

      <div className="px-4">
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
          Spieler:innen folgen in Kürze
        </div>
      </div>
    </div>
  )
}
