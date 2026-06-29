// RoundEndView – Runden-Übergangs-Screen
//
// Erscheint automatisch, sobald eine Runde komplett ist (letztes Spiel gespeichert).
// Zeigt "Runde X beendet!" + den aktuellen Punktestand (geladen aus der DB) und
// bietet zwei Wege: nächste Runde starten oder die Partie beenden.
//
// Zuschauer:innen sehen denselben Screen (via round-complete Broadcast), aber
// die Buttons öffnen den Übergabe-Dialog statt direkt zu handeln.

import { useEffect, useState } from 'react'
import StandingsList from '@/components/session/StandingsList'
import { loadStandings } from '@/lib/standings'

// isWriter: false = Zuschauer:in → Buttons öffnen Übergabe-Dialog
export default function RoundEndView({
  sessionId, roundNumber,
  onNextRound, onEndSession, busy,
  isWriter = true,
  isParticipant = false,
  onRequestTakeover,
  currentWriterName,
}) {
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

      {/* Zuschauer-Banner */}
      {!isWriter && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-amber-800">
            {currentWriterName ? `${currentWriterName} schreibt – du schaust zu` : 'Zuschauer-Modus'}
          </span>
          {isParticipant && (
            <button
              onClick={onRequestTakeover}
              className="text-xs font-medium text-amber-800 border border-amber-400 rounded-lg px-2.5 py-1 active:bg-amber-100 shrink-0 ml-3"
            >
              Übernehmen
            </button>
          )}
        </div>
      )}

      {/* Rangliste */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <StandingsList standings={standings} error={error} />
      </div>

      {/* Aktionen: Schreiber:in handelt direkt, Zuschauer:in öffnet Übergabe-Dialog */}
      <div className="px-4 pt-3 pb-5 border-t border-border space-y-2">
        <button
          onClick={isWriter ? onNextRound : () => onRequestTakeover(onNextRound, 'nextRound')}
          disabled={busy}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50"
        >
          {busy ? 'Starte…' : `Runde ${roundNumber + 1} starten`}
        </button>
        <button
          onClick={isWriter ? onEndSession : () => onRequestTakeover(onEndSession, 'endSession')}
          disabled={busy}
          className="w-full h-12 rounded-xl border border-border font-semibold text-base disabled:opacity-50"
        >
          Partie beenden
        </button>
      </div>
    </div>
  )
}
