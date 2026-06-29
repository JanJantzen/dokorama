// HomePage – Startseite
// Zeigt laufende Partien (nur wenn vorhanden), "Neue Partie starten" und die letzten
// (beendeten) Partien. Klick auf laufend → an den Tisch; Klick auf beendet → Details.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PlayCircle, LogIn, LogOut } from 'lucide-react'
import { loadSessions, formatSessionDate } from '@/lib/sessions'
import { useAuth } from '@/contexts/AuthContext'

function plural(n, sg, pl) {
  return `${n} ${n === 1 ? sg : pl}`
}

// Eine Partie-Zeile – einheitlich für laufende und beendete Partien:
//   Zeile 1: Datum bei Ort (kleiner in Klammern: laufend "Runde X · Spiel Y",
//            beendet "R Runden / G Spiele")
//   Zeile 2: Endstand nach Punkten absteigend: "Name (Punkte) | Name (Punkte) | …"
//            (frische laufende Partie ohne Spiele → nur Namen)
function SessionRow({ session, onClick }) {
  const isDone    = session.status === 'abgeschlossen'
  const venuePart = session.venueName ? ` bei ${session.venueName}` : ''

  const bracket = isDone
    ? `${plural(session.roundsCount, 'Runde', 'Runden')} / ${plural(session.gamesCount, 'Spiel', 'Spiele')}`
    : (session.progress ? `aktuell: Runde ${session.progress.round} / Spiel ${session.progress.game}` : null)

  const secondLine = session.standings.length > 0
    ? session.standings.map(s => `${s.name} (${s.total})`).join('  |  ')
    : session.playerNames.join('  |  ')

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card p-4 active:bg-muted"
    >
      <p className="text-sm font-medium">
        {formatSessionDate(session.date)}{venuePart}
        {bracket && <span className="text-xs font-normal text-muted-foreground"> ({bracket})</span>}
      </p>
      {secondLine && (
        <p className="text-xs text-muted-foreground mt-1">{secondLine}</p>
      )}
      {!isDone && session.writerName && (
        <p className="text-xs text-muted-foreground mt-1">Schreiber: {session.writerName}</p>
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
  const { user, player, signOut } = useAuth()
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
      <header className="px-4 pt-12 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dokorama</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user ? `Eingeloggt als ${player?.name ?? user.email}` : 'Willkommen'}
          </p>
        </div>
        {/* Login- oder Logout-Button oben rechts */}
        {user ? (
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1 py-1"
            title="Ausloggen"
          >
            <LogOut size={16} />
            <span>Ausloggen</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-sm text-primary mt-1 py-1 font-medium"
            title="Einloggen"
          >
            <LogIn size={16} />
            <span>Einloggen</span>
          </button>
        )}
      </header>

      <div className="px-4 flex flex-col gap-8">
        {/* Laufende Partien – nur wenn vorhanden */}
        {running.length > 0 && (
          <section>
            <SectionTitle>Laufende Partien</SectionTitle>
            <div className="flex flex-col gap-2">
              {running.map(s => (
                <SessionRow key={s.id} session={s} onClick={() => navigate(`/partie/${s.id}/ergebnis`)} />
              ))}
            </div>
          </section>
        )}

        {/* Neue Partie starten – nur für eingeloggte Spieler:innen */}
        <Button
          className="w-full h-16 text-lg gap-3"
          onClick={() => user ? navigate('/partie/starten') : navigate('/login', { state: { from: '/partie/starten', forced: true } })}
        >
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
