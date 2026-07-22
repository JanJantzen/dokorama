// PeriodFilter – der globale Zeitraum-Umschalter für die Statistiken (Tier 1, Phase 2)
//
// Chip-Leiste:  [ Total ] [ 2026 ] [ 2025 ] … [ Zeitraum … ]
//   • Total          → gesamte Historie
//   • Jahres-Chips    → ein Kalenderjahr. Der Chip fürs LAUFENDE Jahr steht für
//                       den Modus 'currentYear' (folgt automatisch dem Jahreswechsel);
//                       vergangene Jahre stehen für den Modus 'year'.
//   • „Zeitraum …"    → klappt zwei Datumsfelder (von/bis) für einen freien Zeitraum auf.
//
// Darunter eine Kontextzeile in Worten („Zeitraum: 2026 (laufendes Jahr)") – dort
// steht der „laufend"-Hinweis, nah an den Zahlen, die sich dadurch noch ändern.
//
// Die verfügbaren Jahre kommen als Prop `years` von der Seite (aus availableYears()),
// damit dieser Umschalter selbst nichts über die Daten wissen muss.

import { useState } from 'react'
import { useStatsFilter } from '@/contexts/StatsFilterContext'

// Ein einzelner Chip – aktiv = gefüllt (wie das ViewToggle auf der Seite).
function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary font-medium'
          : 'border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

export default function PeriodFilter({ years }) {
  const { period, setPeriod, label } = useStatsFilter()
  const thisYear = new Date().getFullYear()

  // Datumsfelder nur zeigen, wenn der freie Zeitraum aktiv ist. Startzustand
  // richtet sich nach der gemerkten Wahl (nach Neustart im 'range'-Modus offen).
  const [rangeOpen, setRangeOpen] = useState(period.mode === 'range')

  // Ist der Jahres-Chip für Jahr Y gerade aktiv?
  //   • laufendes Jahr: aktiv, wenn Modus 'currentYear' (dieser Chip = Y == thisYear)
  //   • vergangenes Jahr: aktiv, wenn Modus 'year' und die Jahreszahl passt
  const yearActive = (y) =>
    (period.mode === 'currentYear' && y === thisYear) ||
    (period.mode === 'year' && period.year === y)

  // Klick auf einen Jahres-Chip: das laufende Jahr setzt 'currentYear' (folgt dem
  // Jahreswechsel), jedes vergangene Jahr setzt 'year' mit fester Jahreszahl.
  function pickYear(y) {
    setRangeOpen(false)
    setPeriod(y === thisYear ? { mode: 'currentYear' } : { mode: 'year', year: y })
  }

  return (
    <div className="mb-4">
      {/* Chip-Leiste: horizontal scrollbar, falls viele Jahre dazukommen */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <Chip
          active={period.mode === 'total'}
          onClick={() => { setRangeOpen(false); setPeriod({ mode: 'total' }) }}
        >
          Total
        </Chip>

        {years.map(y => (
          <Chip key={y} active={yearActive(y)} onClick={() => pickYear(y)}>
            {y}
          </Chip>
        ))}

        <Chip
          active={period.mode === 'range'}
          onClick={() => {
            // Aufklappen und in den freien-Zeitraum-Modus wechseln (Grenzen
            // zunächst offen, bis Jan Datumswerte einträgt).
            setRangeOpen(true)
            if (period.mode !== 'range') setPeriod({ mode: 'range', from: null, to: null })
          }}
        >
          Zeitraum …
        </Chip>
      </div>

      {/* Datumsfelder für den freien Zeitraum (nur wenn aufgeklappt) */}
      {rangeOpen && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">von</span>
            <input
              type="date"
              value={period.from ?? ''}
              onChange={e => setPeriod({ ...period, mode: 'range', from: e.target.value || null })}
              className="rounded-md border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">bis</span>
            <input
              type="date"
              value={period.to ?? ''}
              onChange={e => setPeriod({ ...period, mode: 'range', to: e.target.value || null })}
              className="rounded-md border border-border bg-background px-2 py-1"
            />
          </label>
        </div>
      )}

      {/* Kontextzeile: der aktive Zeitraum in Worten */}
      <p className="text-xs text-muted-foreground mt-2">
        Zeitraum: {label}
      </p>
    </div>
  )
}
