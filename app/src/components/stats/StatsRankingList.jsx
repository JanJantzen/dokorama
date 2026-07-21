// StatsRankingList – zweiwertige, sortierbare Rangliste für den Statistik-Bereich
//
// Ergänzt die einspaltige StandingsList (die für einwertige Fälle bleibt): zeigt
// pro Spieler:in ZWEI Werte nebeneinander (z.B. Gesamtscore absolut + pro 4 Runden)
// und lässt nach jeder der beiden Spalten sortieren – man sieht also immer beide
// Zahlen. Bewusst generisch gehalten, damit dieselbe Komponente für alle
// "zweiwertigen" Kennzahlen wiederverwendbar ist (absolut + pro 4R,
// Häufigkeit + Quote, …), nicht nur für den Gesamtscore.

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// Erwartete Props:
//   entries: [{ id, name, avatarUrl, values: { <spaltenKey>: number | null } }]
//            (null = Wert liegt nicht vor → wird als „–" gezeigt und ans Ende sortiert)
//   columns: [{ key, label, format }]   – genau zwei Spalten erwartet
//   defaultSortKey: nach welcher Spalte anfangs sortiert wird (Standard: erste Spalte)
export default function StatsRankingList({ entries, columns, defaultSortKey }) {
  // Sortier-Zustand lebt LOKAL in der Komponente (rein Anzeige, nicht global).
  const [sortKey, setSortKey] = useState(defaultSortKey ?? columns[0].key)
  const [dir, setDir] = useState('desc') // 'desc' = größter Wert oben

  // Lade-/Leerzustände (analog StandingsList)
  if (entries === null) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Lädt…</p>
  }
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Noch keine Daten.</p>
  }

  // Klick auf einen Spaltenkopf: gleiche Spalte → Richtung umdrehen;
  // andere Spalte → dorthin wechseln und absteigend sortieren.
  function toggleSort(key) {
    if (key === sortKey) setDir(d => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setDir('desc') }
  }

  // Nach der aktiven Spalte sortieren. Fehlende Werte (null) landen IMMER am Ende,
  // egal in welche Richtung sortiert wird (sonst stünden „keine Daten" ganz oben).
  const sorted = [...entries].sort((a, b) => {
    const av = a.values[sortKey]
    const bv = b.values[sortKey]
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1
    return dir === 'desc' ? bv - av : av - bv
  })

  return (
    <div>
      {/* Kopfzeile: tippbare Spaltenüberschriften. Die leeren Spacer richten die
          Überschriften exakt über die Wertspalten der Zeilen darunter aus. */}
      <div className="flex items-center gap-3 px-3 pb-2">
        <span className="w-5" />   {/* Rang */}
        <span className="w-10" />  {/* Avatar */}
        <span className="flex-1" />{/* Name */}
        {columns.map(col => {
          const active = col.key === sortKey
          return (
            <button
              key={col.key}
              onClick={() => toggleSort(col.key)}
              className={`w-16 flex items-center justify-end gap-0.5 text-xs py-1 ${
                active ? 'text-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              {col.label}
              {active && (dir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
            </button>
          )
        })}
      </div>

      {/* Ranglisten-Zeilen */}
      <div className="space-y-2">
        {sorted.map((e, i) => (
          <div
            key={e.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card"
          >
            <span className="w-5 text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}.</span>
            <PlayerAvatar player={{ name: e.name, avatar_url: e.avatarUrl }} size="sm" />
            <span className="flex-1 font-medium text-sm truncate">{e.name}</span>
            {columns.map(col => {
              const v = e.values[col.key]
              const active = col.key === sortKey
              // Farbe nach Vorzeichen (grün = Plus, rot = Minus), fehlend = neutral.
              const color = v === null ? 'text-muted-foreground' : v >= 0 ? 'text-green-700' : 'text-destructive'
              return (
                <span
                  key={col.key}
                  className={`w-16 text-right text-sm tabular-nums ${active ? 'font-bold' : 'font-normal'} ${color}`}
                >
                  {col.format(v)}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
