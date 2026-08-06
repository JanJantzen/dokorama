// PlayerProfile – der Spieler-Steckbrief (Block C, Tier 2, Phase 10)
//
// Der „Konvergenzpunkt": egal von wo man auf einen Namen tippt (Verzeichnis,
// Rangliste, Partie-Steckbrief …), man landet immer auf dieser einen Seite.
//
// Aufbau (Konzept, Abschnitte A–F):
//   A Kopf        – Avatar, Name, „X Partien"                    ← Phase 10.1
//   B Gesamtscore – Gesamt/Schnitt + eigener Rang                ← Phase 10.2 (hier)
//   C Meine Werte – je Kennzahl Wert + Rang (Medaille bei 1–3)   ← Phase 10.2 (hier)
//   D Spielstil   – Reizhöhe/Lieblings-Solo/Mut-vs-Können        ← Phase 11/12
//   E Teamplay    – beste:r Partner:in, härteste:r Gegner:in     ← Tier 4
//   F Hall of Fame– Rekordhalter                                 ← Tier 3
//
// Die Ränge (B + C) werden intern über das GANZE Feld gerechnet (im gewählten
// Zeitraum) – der Personen-Filter bleibt hier bewusst außen vor, nur der
// Zeitraum-Filter gilt. Die fertigen Steckbrief-Daten (profile) kommen aus
// buildProfile() in StatsPage; diese Komponente stellt sie nur dar.

import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// Rang als kleine Auszeichnung: Podest 1–3 als Medaille, sonst „#n" in gedämpfter
// Schrift. rank == null (kein belastbarer Rang, z. B. dünne Stichprobe) → „–".
function RankBadge({ rank }) {
  if (rank == null) return <span className="text-muted-foreground/60">–</span>
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  if (medal) return <span aria-label={`Rang ${rank}`}>{medal}</span>
  return <span className="text-sm text-muted-foreground tabular-nums">#{rank}</span>
}

// Eine Kennzahl-Zeile in „Meine Werte": Label links, Wert + Rang rechts. marker
// (optional) = Fußnoten-Ziffer hinter dem Label (z. B. Datenqualitäts-Hinweis).
function MetricRow({ label, value, rank, marker }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-card">
      <span className="truncate">
        {label}
        {marker && <sup className="ml-0.5 text-[10px] text-muted-foreground">{marker}</sup>}
      </span>
      <span className="ml-auto font-semibold tabular-nums whitespace-nowrap">{value}</span>
      <span className="w-6 text-right shrink-0">
        <RankBadge rank={rank} />
      </span>
    </li>
  )
}

// player: { id, name, avatarUrl }; partien: A1-Zähler im Zeitraum;
// profile: { b, metrics } aus buildProfile(); onBack: zurück zum Verzeichnis.
export default function PlayerProfile({ player, partien, profile, onBack }) {
  // „Alle Werte anzeigen" – klappt die vollständige Kennzahlen-Liste in-page auf.
  const [showAll, setShowAll] = useState(false)

  const metrics = profile?.metrics ?? []
  // Nur Kennzahlen mit belastbarem Rang können auf ein Podest / in die Auswahl.
  const ranked = metrics.filter(m => m.rank != null)
  const top3 = ranked.filter(m => m.rank <= 3)
  // Standard: die Top-3-Platzierungen. Fallback (nirgends Top 3): die drei besten
  // eigenen Ränge. metrics ist bereits nach Rang aufsteigend sortiert (buildProfile).
  const standard = top3.length > 0 ? top3 : ranked.slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      {/* Zurück aufs Verzeichnis (Ebene: Übersicht / Personen / Name) */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground -mb-2"
      >
        <ChevronLeft size={18} />
        <span>Personen</span>
        <span className="mx-1 text-border">/</span>
        <span className="text-foreground font-medium">{player.name}</span>
      </button>

      {/* ── A – Kopf/Identität ── */}
      <div className="flex items-center gap-4">
        <PlayerAvatar player={{ name: player.name, avatar_url: player.avatarUrl }} size="xl" />
        <div>
          <h2 className="text-xl font-bold tracking-tight">{player.name}</h2>
          <p className="text-sm text-muted-foreground">
            {partien} {partien === 1 ? 'Partie' : 'Partien'}
          </p>
        </div>
      </div>

      {/* ── B – Gesamtscore (Gesamt + Schnitt, je mit eigenem Rang) ── */}
      {profile?.b && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Gesamtscore
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 p-4 rounded-2xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Gesamt</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">{profile.b.gesamt.value}</span>
                <RankBadge rank={profile.b.gesamt.rank} />
              </div>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-2xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Schnitt</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">{profile.b.schnitt.value}</span>
                <RankBadge rank={profile.b.schnitt.rank} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── C – Meine Werte (je Kennzahl Wert + Rang) ── */}
      {metrics.length > 0 && (() => {
        // EINE Liste, die beim Aufklappen wächst: standard ist immer der Anfang der
        // vollen (nach Rang sortierten) Liste, also wird sie nur länger, statt sich
        // zu verdoppeln. Fußnoten (z. B. Spielzeit-Datenqualität) nur für die gerade
        // sichtbaren Zeilen, fortlaufend nummeriert.
        const visible = showAll ? metrics : standard
        const noted = visible.filter(m => m.note)
        const markerOf = new Map(noted.map((m, i) => [m.id, i + 1]))
        return (
          <section>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Meine Werte
            </h3>

            {visible.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {visible.map(m => (
                  <MetricRow key={m.id} label={m.label} value={m.value} rank={m.rank} marker={markerOf.get(m.id)} />
                ))}
              </ul>
            ) : (
              // Kein belastbarer Rang (nur dünne Stichproben) – erst „Alle Werte" hilft.
              <p className="text-xs text-muted-foreground">
                Noch keine Podestplätze im gewählten Zeitraum.
              </p>
            )}

            {/* Fußnoten zu den sichtbaren Zeilen (Datenqualitäts-Hinweise). */}
            {noted.length > 0 && (
              <ul className="mt-2 flex flex-col gap-0.5">
                {noted.map((m, i) => (
                  <li key={m.id} className="text-[11px] text-muted-foreground leading-snug">
                    <sup>{i + 1}</sup> {m.note}
                  </li>
                ))}
              </ul>
            )}

            {/* „Alle Werte anzeigen": klappt die restlichen Kennzahlen in dieselbe
                Liste. Nur nötig, wenn es mehr gibt als der Standard schon zeigt. */}
            {metrics.length > standard.length && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="mt-3 text-sm text-muted-foreground underline hover:text-foreground"
              >
                {showAll ? 'Weniger anzeigen' : 'Alle Werte anzeigen'}
              </button>
            )}
          </section>
        )
      })()}
    </div>
  )
}
