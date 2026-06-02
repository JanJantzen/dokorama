// EvaluationView – Auswertungs-Screen vor dem Speichern
// Zeigt den berechneten Spielwert pro Spieler.
// "Bestätigen" speichert in Supabase und startet das nächste Spiel.
// "Zurück" kehrt zum Tischscreen zurück ohne Verlust der Eingaben.
//
// Die detaillierte Grundpunkte-Aufschlüsselung ist für eine spätere Iteration geplant.

import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { ArrowLeft } from 'lucide-react'

export default function EvaluationView({
  result,        // Rückgabe von calculateGameResult
  activePlayers, // alle nicht-aussetzenden Spieler mit { player_id, players }
  gameState,     // für Parteizuordnung
  gameNumber,
  roundNumber,
  onConfirm,     // () → void – speichert und nächstes Spiel
  onBack,        // () → void – zurück zum Tischscreen
  saving,        // boolean
}) {
  if (!result) return null

  const { winner, isTie, spielwert, multiplier, perPlayer, breakdown } = result

  // Spieler sortiert nach Punkten (höchste zuerst)
  const sortedPlayers = [...activePlayers].sort((a, b) => {
    const scoreA = perPlayer[a.player_id] ?? 0
    const scoreB = perPlayer[b.player_id] ?? 0
    return scoreB - scoreA
  })

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border">
        <button onClick={onBack} className="text-muted-foreground p-1">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="font-semibold text-sm">Runde {roundNumber} · Spiel {gameNumber}</p>
          <p className="text-xs text-muted-foreground">Auswertung</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Ergebnis-Überschrift */}
        <div className="text-center">
          <p className="text-2xl font-bold">
            {isTie
              ? 'Gespaltener Arsch!'
              : winner === 're'
              ? 'Re gewinnt'
              : 'Kontra gewinnt'
            }
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Spielwert {spielwert}
            {multiplier > 1 && ` (×${multiplier})`}
          </p>
        </div>

        {/* Punkte pro Spieler */}
        <div className="space-y-2">
          {sortedPlayers.map(p => {
            const score = perPlayer[p.player_id] ?? 0
            const party = gameState.parties[p.player_id]
            const isWinner = party === winner

            return (
              <div
                key={p.player_id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  isWinner ? 'border-green-200 bg-green-50' : 'border-border bg-card'
                }`}
              >
                <PlayerAvatar player={p.players} size="sm" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{p.players.name}</p>
                  <p className={`text-xs ${party === 're' ? 'text-green-700' : 'text-amber-600'}`}>
                    {party === 're' ? 'Re' : 'Kontra'}
                  </p>
                </div>
                <span className={`text-lg font-bold ${score >= 0 ? 'text-green-700' : 'text-destructive'}`}>
                  {score > 0 ? `+${score}` : score}
                </span>
              </div>
            )
          })}
        </div>

        {/* Grundpunkte-Aufschlüsselung (kompakt) */}
        <div className="bg-muted rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Grundpunkte
          </p>
          {breakdown.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">+{item.points}</span>
            </div>
          ))}
          {multiplier > 1 && (
            <div className="flex justify-between text-sm border-t border-border mt-1 pt-1">
              <span className="text-muted-foreground">Ansagen (×{multiplier})</span>
              <span className="font-medium">= {spielwert}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bestätigen-Button */}
      <div className="px-4 pt-3 pb-5 border-t border-border">
        <button
          onClick={onConfirm}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50"
        >
          {saving ? 'Wird gespeichert…' : 'Bestätigen – nächstes Spiel'}
        </button>
      </div>
    </div>
  )
}
