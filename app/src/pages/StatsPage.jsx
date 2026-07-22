// StatsPage – Statistiken und Ranglisten (Block C)
//
// Wächst mit dem Bauplan Tier 1 (siehe dokorama_roadmap.md). Aktueller Stand:
//   - Phase 0.2: Grundgerüst (Kopf + Bereiche)
//   - Phase 1.1: Gesamtscore-Rangliste (absolut)
//   - Phase 1.2: zweite Spalte „Schnitt" (pro 4 Runden), per Spaltenkopf sortierbar
//   - Phase 1.3: Verlaufskurve (kumuliert, absolut) + Umschalter Verlauf | Tabelle
//   - Phase 2:   globaler Zeitraum-Filter (Total / Jahr / freier Zeitraum)
//
// Die Daten kommen aus der Statistik-Datenschicht lib/stats.js: einmal beim
// Öffnen laden, dann live in JavaScript verrechnen. Der Zeitraum-Filter schneidet
// die geladenen Daten vor der Berechnung zu (filterByPeriod) – kein neuer DB-Zugriff.

import { useEffect, useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import {
  loadStatsData,
  playerTotals,
  playedRoundsByPlayer,
  buildScoreCurve,
  filterByPeriod,
  availableYears,
} from '@/lib/stats'
import { StatsFilterProvider, useStatsFilter } from '@/contexts/StatsFilterContext'
import StatsRankingList from '@/components/stats/StatsRankingList'
import ScoreCurve from '@/components/stats/ScoreCurve'
import PeriodFilter from '@/components/stats/PeriodFilter'

// Kleiner Abschnitts-Titel im selben Stil wie auf der Startseite.
// Optionales `info`: zeigt ein ⓘ neben dem Titel; Tap blendet den Erklärtext
// darunter ein/aus – so bleibt die Ansicht schlank, Erklärung nur auf Wunsch.
function SectionTitle({ children, info }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {children}
        </h2>
        {info && (
          <button
            onClick={() => setOpen(o => !o)}
            className="text-muted-foreground/70 hover:text-muted-foreground p-0.5"
            aria-label="Erklärung anzeigen"
          >
            <Info size={14} />
          </button>
        )}
      </div>
      {/* Erklärtext: normal-case, damit er nicht wie der Titel in Großbuchstaben steht */}
      {info && open && (
        <p className="text-xs text-muted-foreground mt-1.5 normal-case font-normal tracking-normal">
          {info}
        </p>
      )}
    </div>
  )
}

// Zweiwertiger Umschalter (Verlauf | Tabelle) – kleines Segmented Control.
function ViewToggle({ view, onChange }) {
  const options = [
    { key: 'verlauf', label: 'Verlauf' },
    { key: 'tabelle', label: 'Tabelle' },
  ]
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 mb-4 text-sm">
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-3 py-1 rounded-md transition-colors ${
            view === o.key ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Wert-Formatierungen (Anzeige) ──
// Ganzzahl mit Vorzeichen: +120 / −162 (fehlend → „–").
const fmtInt = (n) => (n === null ? '–' : n > 0 ? `+${n}` : `${n}`)
// Eine Nachkommastelle mit deutschem Komma und Vorzeichen: +9,8 / −15,2.
const fmtPer4 = (n) => {
  if (n === null) return '–'
  const s = n.toFixed(1).replace('.', ',')
  return n > 0 ? `+${s}` : s // negative Zahl trägt ihr Minus schon selbst
}

// Baut die Gesamtscore-Einträge für StatsRankingList: pro Person zwei Werte –
// absolut (Summe Zählpunkte) und pro 4 Runden (Summe ÷ eigene gespielte Runden × 4).
function buildGesamtscore(data) {
  const totals = playerTotals(data)
  const rounds = playedRoundsByPlayer(data)
  return [...totals.entries()].map(([id, total]) => {
    const p = data.players.get(id)
    const r = rounds.get(id) ?? 0
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: {
        absolut: total,
        // Ohne gespielte Runden keine sinnvolle Normierung → null (zeigt „–").
        per4: r > 0 ? (total / r) * 4 : null,
      },
    }
  })
}

const GESAMTSCORE_COLUMNS = [
  { key: 'absolut', label: 'Gesamt',  format: fmtInt },
  { key: 'per4',    label: 'Schnitt', format: fmtPer4 },
]

// Die eigentliche Seite – lebt INNERHALB des StatsFilterProvider (s. Default-Export
// unten), damit sie den gewählten Zeitraum über useStatsFilter() lesen kann.
function StatsPageInner() {
  const [data, setData] = useState(null)          // null = lädt noch (ungefilterte Rohdaten)
  const [error, setError] = useState(false)
  const [view, setView] = useState('verlauf')     // 'verlauf' | 'tabelle'

  // Der aktive Zeitraum als Datumsgrenzen (kommt aus dem globalen Filter-Context).
  const { range } = useStatsFilter()

  // Einmal beim Öffnen der Seite alle abgeschlossenen Partien laden.
  useEffect(() => {
    let alive = true
    loadStatsData()
      .then(d => { if (alive) setData(d) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])

  // Welche Jahre gibt es überhaupt? (Für die Jahres-Chips – aus den VOLLEN Daten,
  // nicht aus den gefilterten, sonst verschwänden Chips beim Umschalten.)
  const years = useMemo(() => (data ? availableYears(data) : []), [data])

  // Rohdaten auf den gewählten Zeitraum zuschneiden; darauf rechnen alle Kennzahlen.
  // Neu, sobald sich die Daten ODER der Zeitraum ändern.
  const filtered = useMemo(
    () => (data ? filterByPeriod(data, range) : null),
    [data, range],
  )

  // Abgeleitete Ansichten aus den GEFILTERTEN Daten.
  const gesamtscore = useMemo(() => (filtered ? buildGesamtscore(filtered) : null), [filtered])
  const curve       = useMemo(() => (filtered ? buildScoreCurve(filtered) : null), [filtered])

  // Enthält der gewählte Zeitraum überhaupt Partien?
  const isEmpty = filtered && filtered.sessions.length === 0

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Statistiken</h1>
        <p className="text-muted-foreground text-sm mt-1">Alle Auswertungen auf einen Blick</p>
      </header>

      <div className="px-4 flex flex-col gap-8">
        {/* Globaler Zeitraum-Filter – gilt für alle Bereiche darunter */}
        {data && <PeriodFilter years={years} />}

        <section>
          <SectionTitle
            info={
              <>
                Gesamt = Summe aller Punkte
                <br />
                Schnitt = Durchschnitt je „Standard Partie" (4 Runden)
              </>
            }
          >
            Gesamtscore
          </SectionTitle>

          <ViewToggle view={view} onChange={setView} />

          {error ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              Statistiken konnten nicht geladen werden.
            </p>
          ) : !filtered ? (
            <p className="text-sm text-muted-foreground text-center mt-8">Lädt…</p>
          ) : isEmpty ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              In diesem Zeitraum gibt es keine Partien.
            </p>
          ) : view === 'verlauf' ? (
            <ScoreCurve points={curve.points} players={curve.players} />
          ) : (
            <StatsRankingList
              entries={gesamtscore}
              columns={GESAMTSCORE_COLUMNS}
              defaultSortKey="absolut"
            />
          )}
        </section>
      </div>
    </div>
  )
}

// Default-Export: umhüllt die Seite mit dem Zeitraum-Filter-Provider, damit die
// Wahl (und ihre Persistenz) an EINER Stelle für die ganze Statistik-Seite lebt.
export default function StatsPage() {
  return (
    <StatsFilterProvider>
      <StatsPageInner />
    </StatsFilterProvider>
  )
}
