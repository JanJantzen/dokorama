// Scoreboard – aktueller Punktestand der laufenden Partie
//
// Vollbild-Overlay, geöffnet über den Trophy-Button im Header. Lädt beim Öffnen
// frisch aus der DB (loadStandings) und zeigt die Rangliste mit dem Gesamtstand.
// Die Unterzeile sagt, auf welchen Stand sich die Tabelle bezieht (z.B. "nach
// Runde 3 · Spiel 2") – also bis zu welchem gespeicherten Spiel gezählt wurde.

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import StandingsList from '@/components/session/StandingsList'
import { loadStandings } from '@/lib/standings'

// Beschreibt, bis zu welchem Spiel der Stand zählt. gameNumber ist das AKTUELLE
// (noch nicht gespeicherte) Spiel der laufenden Runde – gezählt ist also alles davor.
function asOfLabel(roundNumber, gameNumber) {
  if (roundNumber === 1 && gameNumber === 1) return 'Noch keine Spiele gespielt'
  if (gameNumber === 1) return `Stand nach Runde ${roundNumber - 1}`
  return `Stand nach Runde ${roundNumber} · Spiel ${gameNumber - 1}`
}

// "Partie vom <Datum> bei <Ort>" – Ort weglassen, wenn keiner gesetzt ist.
function partieLabel(date, venue) {
  if (!date) return ''
  return venue ? `Partie vom ${date} bei ${venue}` : `Partie vom ${date}`
}

// refreshKey: wird von SessionPage hochgezählt wenn ein Spiel gespeichert wurde –
// sorgt dafür dass der Spielstand aktuell bleibt wenn das Scoreboard offen ist.
export default function Scoreboard({ sessionId, roundNumber, gameNumber, date, venue, onClose, refreshKey }) {
  const [standings, setStandings] = useState(null) // null = lädt noch
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    loadStandings(sessionId)
      .then(s => { if (alive) setStandings(s) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [sessionId, refreshKey])

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <p className="font-semibold text-sm">Spielstand</p>
          {partieLabel(date, venue) && (
            <p className="text-xs text-muted-foreground truncate">{partieLabel(date, venue)}</p>
          )}
          <p className="text-xs text-muted-foreground">{asOfLabel(roundNumber, gameNumber)}</p>
        </div>
      </div>

      {/* Rangliste */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <StandingsList standings={standings} error={error} />
      </div>
    </div>
  )
}
