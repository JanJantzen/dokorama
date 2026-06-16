// StandingsList – Darstellung einer Punkte-Rangliste
//
// Reine Anzeige-Komponente: bekommt den (per loadStandings geladenen) Stand und
// rendert Rang + Avatar + Name + Gesamtpunkte. Behandelt auch die Lade-/Leer-/
// Fehlerzustände, damit Scoreboard und RoundEndView sie nicht doppeln müssen.

import PlayerAvatar from '@/components/ui/PlayerAvatar'

const fmt = (n) => (n > 0 ? `+${n}` : `${n}`)

export default function StandingsList({ standings, error }) {
  if (error) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Spielstand konnte nicht geladen werden.</p>
  }
  if (standings === null) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Lädt…</p>
  }
  if (standings.length === 0) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Noch keine Spiele gespeichert.</p>
  }

  return (
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
  )
}
