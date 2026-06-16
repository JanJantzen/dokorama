// HomePage – Startseite
// Zeigt laufende Partien (nur wenn vorhanden), "Neue Partie starten" und die letzten
// (beendeten) Partien. Klick auf laufend → an den Tisch; Klick auf beendet → Details.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PlayCircle } from 'lucide-react'
import { loadSessions, formatSessionDate } from '@/lib/sessions'

// Eine Partie-Zeile: Datum · Ort, Spielernamen, (bei laufenden) Runde/Spiel
function SessionRow({ session, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card p-4 active:bg-muted"
    >
      <p className="text-sm font-medium">
        {formatSessionDate(session.date)}{session.venueName ? ` · ${session.venueName}` : ''}
      </p>
      {session.playerNames.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{session.playerNames.join(', ')}</p>
      )}
      {session.progress && (
        <p className="text-xs text-primary mt-1">
          Runde {session.progress.round} · Spiel {session.progress.game}
        </p>
      )}
    </button>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </h2>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState(null) // null = lädt noch
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadSessions().then(setSessions).catch(() => setSessions([]))
  }, [])

  const running   = (sessions ?? []).filter(s => s.status === 'laufend')
  const completed  = (sessions ?? []).filter(s => s.status === 'abgeschlossen')
  const shownCompleted = showAll ? completed : completed.slice(0, 3)

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Kopfzeile */}
      <header className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dokorama</h1>
        <p className="text-muted-foreground text-sm mt-1">Willkommen zurück</p>
      </header>

      <div className="px-4 flex flex-col gap-8">
        {/* Laufende Partien – nur wenn vorhanden */}
        {running.length > 0 && (
          <section>
            <SectionTitle>Laufende Partien</SectionTitle>
            <div className="flex flex-col gap-2">
              {running.map(s => (
                <SessionRow key={s.id} session={s} onClick={() => navigate(`/partie/${s.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Neue Partie starten */}
        <Button className="w-full h-16 text-lg gap-3" onClick={() => navigate('/partie/starten')}>
          <PlayCircle size={24} />
          Neue Partie starten
        </Button>

        {/* Letzte Partien */}
        <section>
          <SectionTitle>Letzte Partien</SectionTitle>
          {sessions === null ? (
            <div className="rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
              Lädt…
            </div>
          ) : completed.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
              Noch keine Partien gespielt
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {shownCompleted.map(s => (
                <SessionRow key={s.id} session={s} onClick={() => navigate(`/partie/${s.id}/ergebnis`)} />
              ))}
              {completed.length > 3 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="text-sm text-primary font-medium py-2"
                >
                  {showAll ? 'Weniger anzeigen' : `Alle anzeigen (${completed.length})`}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
