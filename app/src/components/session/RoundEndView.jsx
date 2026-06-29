// RoundEndView – Runden-Übergangs-Screen
//
// Erscheint automatisch, sobald eine Runde komplett ist (letztes Spiel gespeichert).
// Zeigt "Runde X beendet!" + den aktuellen Punktestand (geladen aus der DB) und
// bietet zwei Wege: nächste Runde starten oder die Partie beenden.

import { useEffect, useState } from 'react'
import StandingsList from '@/components/session/StandingsList'
import { loadStandings } from '@/lib/standings'

// isWriter: false = Zuschauer:in – Buttons ausblenden, Warte-Hinweis zeigen
export default function RoundEndView({ sessionId, roundNumber, onNextRound, onEndSession, busy, isWriter = true }) {
  const [standings, setStandings] = useState(null) // null = lädt noch
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    loadStandings(sessionId)
      .then(s => { if (alive) setStandings(s) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [sessionId])

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Kopf */}
      <div className="px-4 pt-12 pb-4 border-b border-border text-center">
        <p className="text-2xl font-bold">Runde {roundNumber} beendet!</p>
        <p className="text-sm text-muted-foreground mt-1">Aktueller Spielstand</p>
      </div>

      {/* Rangliste */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <StandingsList standings={standings} error={error} />
      </div>

      {/* Aktionen */}
      <div className="px-4 pt-3 pb-5 border-t border-border space-y-2">
        {isWriter ? (
          <>
            <button
              onClick={onNextRound}
              disabled={busy}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50"
            >
              {busy ? 'Starte…' : `Runde ${roundNumber + 1} starten`}
            </button>
            <button
              onClick={onEndSession}
              disabled={busy}
              className="w-full h-12 rounded-xl border border-border font-semibold text-base disabled:opacity-50"
            >
              Partie beenden
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-3">
            Wartet auf den Schreiber…
          </p>
        )}
      </div>
    </div>
  )
}
