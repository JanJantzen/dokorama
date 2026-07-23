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

// Textfarbe einer Wertzahl nach Spalten-Tönung. Fehlende Werte (null) sind immer
// gedämpft. 'sign' färbt nach Vorzeichen (grün ≥0 / rot <0), die anderen fest.
function colorFor(v, tone = 'sign') {
  if (v === null) return 'text-muted-foreground'
  switch (tone) {
    case 'plain': return 'text-foreground'
    case 'good':  return 'text-green-700'
    case 'bad':   return 'text-destructive'
    case 'muted': return 'text-muted-foreground'
    case 'sign':
    default:      return v >= 0 ? 'text-green-700' : 'text-destructive'
  }
}

// Erwartete Props:
//   entries: [{ id, name, avatarUrl,
//               values: { <spaltenKey>: number | null },   // null → „–", ans Ende sortiert
//               weak?:  { <spaltenKey>: boolean },          // P6: dünne Stichprobe →
//                                                           //   Wert grau+kursiv + ans Ende
//               meta?:  { <spaltenKey>: { sublabel, weak? } } }]  // kleine Zeile unter dem
//                                                           //   Wert; weak → Zeile kursiv
//   columns: [{ key, label, format, sortDir?, tone? }]
//            sortDir: Start-Richtung beim WECHSEL auf diese Spalte ('asc' | 'desc',
//                     Standard 'desc'). Für „kleiner ist interessanter"-Spalten
//                     (z. B. Tiefstwert) auf 'asc' setzen → negativster oben.
//            tone:    Farbe der Zahl. 'sign' (Standard) = grün bei ≥0, rot bei <0
//                     (passt für Punktesalden). Für Zähler/Quoten stattdessen:
//                     'plain' (neutral), 'good' (grün), 'bad' (rot), 'muted' (grau).
//   defaultSortKey: nach welcher Spalte anfangs sortiert wird (Standard: erste Spalte)
//   topN: wie viele Zeilen im zusammengeklappten Zustand sichtbar sind (Standard 3).
//         Bei mehr Einträgen erscheint „Alle anzeigen (N)" zum Aufklappen. Die
//         sichtbaren Zeilen sind immer die Top N der AKTIVEN Sortierspalte.
export default function StatsRankingList({ entries, columns, defaultSortKey, topN = 3 }) {
  // Anfangsspalte und -richtung: die Start-Richtung richtet sich nach der
  // sortDir der Anfangsspalte (Standard 'desc' = größter Wert oben).
  const initialKey = defaultSortKey ?? columns[0].key
  const initialDir = columns.find(c => c.key === initialKey)?.sortDir ?? 'desc'
  // Sortier-Zustand lebt LOKAL in der Komponente (rein Anzeige, nicht global).
  const [sortKey, setSortKey] = useState(initialKey)
  const [dir, setDir] = useState(initialDir)
  // Aufgeklappt (alle Zeilen) vs. zusammengeklappt (nur Top N).
  const [expanded, setExpanded] = useState(false)

  // Lade-/Leerzustände (analog StandingsList)
  if (entries === null) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Lädt…</p>
  }
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Noch keine Daten.</p>
  }

  // Klick auf einen Spaltenkopf: gleiche Spalte → Richtung umdrehen;
  // andere Spalte → dorthin wechseln und in ihrer Start-Richtung sortieren
  // (sortDir der Spalte, Standard 'desc').
  function toggleSort(key) {
    if (key === sortKey) setDir(d => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setDir(columns.find(c => c.key === key)?.sortDir ?? 'desc') }
  }

  // Sortier-Rang einer Zeile für die aktive Spalte:
  //   0 = solider Wert · 1 = dünne Stichprobe (P6) · 2 = kein Wert (null).
  // Dünne und fehlende Werte rutschen so IMMER ans Ende – unabhängig von der
  // Sortierrichtung –, damit keine statistisch bedeutungslose Quote (z. B.
  // „100 % aus 1 Runde") die Liste anführt.
  function tierFor(e) {
    const v = e.values[sortKey]
    if (v === null || v === undefined) return 2
    if (e.weak?.[sortKey]) return 1
    return 0
  }
  // Nach der aktiven Spalte sortieren: erst nach Rang (solide vor dünn vor
  // fehlend), innerhalb desselben Rangs nach dem Wert in der gewählten Richtung.
  const sorted = [...entries].sort((a, b) => {
    const ta = tierFor(a)
    const tb = tierFor(b)
    if (ta !== tb) return ta - tb
    const av = a.values[sortKey]
    const bv = b.values[sortKey]
    if (av === null || av === undefined) return 0 // beide ohne Wert → gleichrangig
    return dir === 'desc' ? bv - av : av - bv
  })

  // Nur die Top N zeigen, solange nicht aufgeklappt ist.
  const collapsible = sorted.length > topN
  const visible = expanded || !collapsible ? sorted : sorted.slice(0, topN)

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

      {/* Ranglisten-Zeilen (nur Top N, solange zusammengeklappt) */}
      <div className="space-y-2">
        {visible.map((e, i) => (
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
              // P6: dünne Stichprobe? Dann Wert grau + kursiv (überschreibt die
              // normale Tönung) – aber nur bei echtem Wert, nicht beim „–".
              const weak = !!e.weak?.[col.key] && v !== null
              const color = weak ? 'text-muted-foreground italic' : colorFor(v, col.tone)
              // Optionale kleine Zusatzzeile (z. B. Datum des Rekords oder eine
              // Quote unter einem Zähler). meta.weak → Zeile kursiv, wenn die
              // Quote auf zu dünner Stichprobe beruht (der Zähler darüber bleibt
              // als Absolutzahl voll sichtbar und immun).
              const sub = e.meta?.[col.key]?.sublabel
              const subWeak = !!e.meta?.[col.key]?.weak
              return (
                <div key={col.key} className="w-16 flex flex-col items-end leading-tight">
                  <span className={`text-right text-sm tabular-nums ${active ? 'font-bold' : 'font-normal'} ${color}`}>
                    {col.format(v)}
                  </span>
                  {sub && (
                    <span className={`text-[10px] text-muted-foreground font-normal tabular-nums ${subWeak ? 'italic' : ''}`}>
                      {sub}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Aufklappen/Zuklappen – nur wenn es mehr als Top N gibt */}
      {collapsible && (
        <button
          onClick={() => setExpanded(x => !x)}
          className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground py-1"
        >
          {expanded ? 'Weniger anzeigen' : `Alle anzeigen (${sorted.length})`}
        </button>
      )}
    </div>
  )
}
