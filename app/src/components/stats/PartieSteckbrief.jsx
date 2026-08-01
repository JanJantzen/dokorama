// PartieSteckbrief – „Stats of the Party": kompakte, kuratierte Kennzahlen zu
// GENAU EINEM Abend. Sitzt auf dem Endstand-Screen unter der Rangliste (nur bei
// beendeten Partien). Kein neuer Datentopf – alle Werte kommen aus den ohnehin
// geladenen Gruppendaten (loadStatsData), auf diese eine sessionId gefiltert.
//
// Stand Phase 8.2:
//   - Verlauf des Abends (Kurve über die Spiele, 8.1)
//   - Rekorde des Abends (bester/schlechtester Einzelspielwert)
//   - Streak des Abends (längste Sieg-/Niederlagenserie)
// Es folgt in Phase 8.3: Solo-/Sonderpunkt-/Sonderspiel-Zahlen mit Benchmark.

import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import ScoreCurve from './ScoreCurve'
import {
  buildSessionCurve,
  sessionSingleGameExtremes,
  sessionStreaks,
  sessionCounts,
} from '@/lib/stats'

// Vorzeichen vor positive Werte: +12 / −5.
const fmt = (n) => (n > 0 ? `+${n}` : `${n}`)

// Durchschnitt mit einer Nachkommastelle, deutsches Komma: 2,3.
const fmtAvg = (n) => n.toFixed(1).replace('.', ',')

// Kurzort „R4S2" (Runde 4, Spiel 2).
const rs = (round, game) => `R${round}S${game}`

// Inhaber:innen eines Einzelwert-Rekords → Liste { name, loc }, EIN Eintrag pro
// Person. Hält jemand denselben Wert in mehreren Spielen, stehen die Orte
// gesammelt in einer Klammer: „Dani (R2S3 + R4S1)".
function extremeHolders(rec) {
  const byName = new Map()
  for (const x of rec.holders) {
    if (!byName.has(x.name)) byName.set(x.name, [])
    byName.get(x.name).push(rs(x.round, x.game))
  }
  return [...byName].map(([name, locs]) => ({ name, loc: locs.join(' + ') }))
}

// Inhaber:innen einer Streak → Liste { name, loc } mit Spanne „R3S2–R4S2".
function streakHolders(s) {
  return s.holders.map(x => ({
    name: x.name,
    loc: `${rs(x.from.round, x.from.game)}–${rs(x.to.round, x.to.game)}`,
  }))
}

// Überschrift einer Steckbrief-Sektion – klein, gedämpft, in Versalien.
function SectionHead({ children }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      {children}
    </h3>
  )
}

// Eine Kennzahl-Kachel: kleines Label oben, großer Wert, darunter die
// Inhaber:innen – je eine Zeile pro Name, der Kurzort dahinter in hellerem Grau.
// tone färbt den großen Wert grün/rot/neutral.
function StatTile({ label, value, tone = 'plain', holders }) {
  const valueColor =
    tone === 'good' ? 'text-green-700'
    : tone === 'bad' ? 'text-destructive'
    : 'text-foreground'
  return (
    <div className="flex flex-col p-3 rounded-xl border border-border bg-card">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${valueColor}`}>{value}</span>
      {holders && holders.length > 0 && (
        <div className="mt-1 flex flex-col gap-0.5">
          {holders.map((h, i) => (
            <span key={i} className="text-xs leading-snug">
              {h.name} <span className="text-muted-foreground">({h.loc})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Zentrale Lesart Ist vs. Erwartungswert. Es wird durchgängig ein richtungs-
// unabhängiger FAKTOR benutzt = „wie viele Male liegen Ist und Erwartung
// auseinander" = max(ist,erw) ÷ min(ist,erw). Der ist symmetrisch: 8 vs 9,6 und
// 9,6 vs 8 ergeben beide 1,2×. Grenzen:
//   ≤ 1,15×          → Norm       (step 0)
//   1,15× – 1,5×     → etwas      (step 1)
//   1,5× – 2,0×      → deutlich   (step 2)
//   > 2,0×           → außergewöhnlich (step 3)
// dir = 'over' (Ist > Erwartung) / 'under' / 'norm'. Bei Erwartung 0 gilt jeder
// Wert > 0 als höchste Stufe „over".
function deviationVerdict(value, expected) {
  if (expected === 0) return value > 0 ? { dir: 'over', step: 3 } : { dir: 'norm', step: 0 }
  const factor = value >= expected ? value / expected : expected / value
  if (factor <= 1.15) return { dir: 'norm', step: 0 }
  const dir  = value > expected ? 'over' : 'under'
  const step = factor > 2 ? 3 : factor > 1.5 ? 2 : 1
  return { dir, step }
}

// Balken-FARBE (nur Richtung): leitet sich aus derselben Lesart ab → über = grün,
// unter = amber, Norm = neutral. Die feine Abstufung trägt der Erklärtext, nicht
// die Farbe, damit die Bars ruhig bleiben.
function bulletState(value, expected) {
  const { dir } = deviationVerdict(value, expected)
  return dir === 'over' ? 'over' : dir === 'under' ? 'under' : 'neutral'
}

// Verdikt-Satzteil aus { dir, step } für den Erklärtext.
function verdictPhrase(label, { dir, step }) {
  if (dir === 'norm') return `der heutige Abend liegt damit in der Norm.`
  const richtung = dir === 'over' ? 'mehr' : 'weniger'
  const staffel =
    step === 1 ? 'etwas'
    : step === 2 ? 'deutlich'
    : 'außergewöhnlich'   // step 3
  // „außergewöhnlich mehr" klingt schief → eigene Formulierung für die höchste Stufe.
  if (step === 3) {
    return dir === 'over'
      ? `das sind außergewöhnlich viele.`
      : `das sind außergewöhnlich wenige.`
  }
  return `das sind ${staffel} ${richtung} als üblich.`
}

// Balken-Geometrie: Füll-Länge (Ist), Marker-Position (Erwartung), Lesart.
// Skala je Zeile 0 … max(Ist, Erwartung) × 1,3, damit der Marker nie am Rand klebt.
function bulletGeom(value, expected) {
  const max = Math.max(value, expected, 1) * 1.3
  return {
    fillPct: Math.min(100, (value / max) * 100),
    expPct:  Math.min(100, (expected / max) * 100),
    state:   bulletState(value, expected),
  }
}

// Textfarbe passend zur Lesart.
function stateColor(state) {
  return state === 'over' ? 'text-green-700'
    : state === 'under' ? 'text-amber-600'
    : 'text-foreground'
}

// Der reine Balken: Spur + farbige Füllung bis zum Ist-Wert + Erwartungs-Marker.
function Bar({ fillPct, expPct, state }) {
  const fillColor =
    state === 'over'  ? 'bg-green-600'
    : state === 'under' ? 'bg-amber-500'
    : 'bg-muted-foreground/50'
  return (
    <div className="relative h-3">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${fillColor}`} style={{ width: `${fillPct}%` }} />
      </div>
      <div
        className="absolute top-0 h-full w-0.5 rounded bg-foreground"
        style={{ left: `calc(${expPct}% - 1px)` }}
      />
    </div>
  )
}

// Erklärsatz hinter dem ⓘ-Button, dreistufig nach Verhältnis Ist ÷ Erwartung.
function hintText(label, count, expected) {
  const verdict = verdictPhrase(label, deviationVerdict(count, expected))
  return `Es gab heute ${count} ${label}. An einem vergleichbaren Abend dieser Länge sind es `
    + `normalerweise ${fmtAvg(expected)} (Erwartungswert) – ${verdict}`
}

// Eine Zähl-Zeile (volle Breite): Label + ⓘ-Button oben; darunter die Ist-Zahl
// über dem Füll-Ende, der Balken, und die Erwartungszahl unter dem Marker (in
// Marker-Farbe). Ganz unten die Pro-Person-Aufschlüsselung. Der ⓘ-Button blendet
// den Erklärsatz ein/aus.
function CountRow({ label, count, expected, byPlayer }) {
  const [showHint, setShowHint] = useState(false)
  const breakdown = (byPlayer ?? []).map(p => `${p.name} ${p.count}`).join(' · ')
  const { fillPct, expPct, state } = bulletGeom(count, expected)

  return (
    <div className="p-3 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <button
          onClick={() => setShowHint(v => !v)}
          className="text-muted-foreground p-0.5"
          aria-label="Erklärung anzeigen"
        >
          <Info size={15} />
        </button>
      </div>

      {/* Ist-Zahl oberhalb, am Füll-Ende positioniert */}
      <div className="relative h-4 mt-1">
        <span
          className={`absolute -translate-x-1/2 text-xs font-bold tabular-nums ${stateColor(state)}`}
          style={{ left: `${fillPct}%` }}
        >
          {count}
        </span>
      </div>

      <Bar fillPct={fillPct} expPct={expPct} state={state} />

      {/* Erwartungszahl unterhalb, am Marker positioniert, in Marker-Farbe */}
      <div className="relative h-4 mt-0.5">
        <span
          className="absolute -translate-x-1/2 text-xs tabular-nums text-foreground"
          style={{ left: `${expPct}%` }}
        >
          {fmtAvg(expected)}
        </span>
      </div>

      {showHint && (
        <p className="text-xs text-muted-foreground leading-snug mt-1">
          {hintText(label, count, expected)}
        </p>
      )}

      {breakdown && <div className="text-xs text-muted-foreground mt-1.5 leading-snug">{breakdown}</div>}
    </div>
  )
}

export default function PartieSteckbrief({ data, sessionId }) {
  // Alle Abend-Kennzahlen einmal berechnen (nur neu, wenn Daten/Partie wechseln).
  const curve    = useMemo(() => buildSessionCurve(data, sessionId), [data, sessionId])
  const extremes = useMemo(() => sessionSingleGameExtremes(data, sessionId), [data, sessionId])
  const streaks  = useMemo(() => sessionStreaks(data, sessionId), [data, sessionId])
  const counts   = useMemo(() => sessionCounts(data, sessionId), [data, sessionId])

  // Ohne Spiele (dürfte bei einer beendeten Partie nicht vorkommen) nichts zeigen.
  if (!curve.points.length) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold">Stats des Abends</span>
      </div>

      {/* ── Verlauf des Abends (8.1) ── */}
      <section>
        <SectionHead>Verlauf des Abends</SectionHead>
        <ScoreCurve points={curve.points} players={curve.players} meta={curve.meta} />
      </section>

      {/* ── Rekorde des Abends: bester/schlechtester Einzelspielwert (8.2) ── */}
      {(extremes.best || extremes.worst) && (
        <section>
          <SectionHead>Rekorde des Abends</SectionHead>
          <div className="grid grid-cols-2 gap-2">
            {extremes.best && (
              <StatTile
                label="Bester Einzelwert"
                value={fmt(extremes.best.value)}
                tone="good"
                holders={extremeHolders(extremes.best)}
              />
            )}
            {extremes.worst && (
              <StatTile
                label="Schlechtester Einzelwert"
                value={fmt(extremes.worst.value)}
                tone="bad"
                holders={extremeHolders(extremes.worst)}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Streak des Abends: längste Sieg-/Niederlagenserie (8.2) ── */}
      <section>
        <SectionHead>Streak des Abends</SectionHead>
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="Längste Siegesserie"
            value={streaks.bestWin ? streaks.bestWin.len : '–'}
            tone={streaks.bestWin ? 'good' : 'plain'}
            holders={streaks.bestWin ? streakHolders(streaks.bestWin) : null}
          />
          <StatTile
            label="Längste Pechsträhne"
            value={streaks.bestLoss ? streaks.bestLoss.len : '–'}
            tone={streaks.bestLoss ? 'bad' : 'plain'}
            holders={streaks.bestLoss ? streakHolders(streaks.bestLoss) : null}
          />
        </div>
      </section>

      {/* ── Zahlen des Abends: Solos / Sonderspiele / Sonderpunkte mit Benchmark (8.3) ── */}
      <section>
        <SectionHead>Zahlen des Abends</SectionHead>
        <div className="flex flex-col gap-2">
          <CountRow label="Soli"         count={counts.solos.count}        expected={counts.solos.expected}        byPlayer={counts.solos.byPlayer} />
          <CountRow label="Sonderspiele" count={counts.sonderspiele.count} expected={counts.sonderspiele.expected} byPlayer={counts.sonderspiele.byPlayer} />
          <CountRow label="Sonderpunkte" count={counts.sonderpunkte.count} expected={counts.sonderpunkte.expected} byPlayer={counts.sonderpunkte.byPlayer} />
        </div>
      </section>
    </div>
  )
}
