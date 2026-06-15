// Scoreboard – aktueller Punktestand der laufenden Partie
//
// Vollbild-Overlay, geöffnet über den Trophy-Button im Header. Lädt beim Öffnen
// frisch aus der DB (loadStandings) und zeigt die Rangliste mit dem Gesamtstand.
// Die Unterzeile sagt, auf welchen Stand sich die Tabelle bezieht (z.B. "nach
// Runde 3 · Spiel 2") – also bis zu welchem gespeicherten Spiel gezählt wurde.

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { loadStandings } from '@/lib/standings'

const fmt = (n) => (n > 0 ? `+${n}` : `${n}`)

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

export default function Scoreboard({ sessionId, roundNumber, gameNumber, date, venue, onClose }) {
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
        {error ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Spielstand konnte nicht geladen werden.
          </p>
        ) : standings === null ? (
          <p className="text-sm text-muted-foreground text-center mt-8">Lädt…</p>
        ) : standings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Noch keine Spiele gespeichert.
          </p>
        ) : (
          <div className="space-y-2">
            {standings.map((s, i) => (
              <div
                key={s.player_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card"
              >
                <span className="w-5 text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}.</span>
                <PlayerAvatar player={s} size="sm" />
                <span className="flex-1 font-medium text-sm truncate">{s.name}</span>
                <span className={`text-lg font-bold tabular-nums ${s.total >= 0 ? 'text-green-700' : 'text-destructive'}`}>
                  {fmt(s.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
