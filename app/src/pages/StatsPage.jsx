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

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Info, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  loadStatsData,
  playerTotals,
  playedRoundsByPlayer,
  playedGamesByPlayer,
  playedSessionsByPlayer,
  bestWorstSaldo,
  placementStats,
  winLossStats,
  winLossStreaks,
  placementStreaks,
  clarityStats,
  spreadStats,
  attendanceTimeline,
  dealingStats,
  playtimeStats,
  buildScoreCurve,
  filterByPeriod,
  availableYears,
  isWeakSample,
} from '@/lib/stats'
import { StatsFilterProvider, useStatsFilter } from '@/contexts/StatsFilterContext'
import StatsRankingList from '@/components/stats/StatsRankingList'
import ClarityBars from '@/components/stats/ClarityBars'
import BoxPlot from '@/components/stats/BoxPlot'
import AttendanceGrid from '@/components/stats/AttendanceGrid'
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
      {/* Erklärtext: normal-case, damit er nicht wie der Titel in Großbuchstaben steht.
          <div> (nicht <p>), weil InfoDefs ein Grid rendert – ein Grid darf nicht in ein <p>. */}
      {info && open && (
        <div className="text-xs text-muted-foreground mt-1.5 normal-case font-normal tracking-normal">
          {info}
        </div>
      )}
    </div>
  )
}

// Erklärungs-Definitionsliste für die ⓘ-Kästen: Zeilen „Begriff = Erklärung", wobei
// die „="-Zeichen über ein Grid exakt untereinander stehen (col 1 = Begriff, col 2 =
// „=", col 3 = Erklärung, die bei Bedarf umbricht). items:
//   { t, d } → eine Zeile „t = d"
//   { n }    → freie Hinweiszeile über die volle Breite (ohne „=")
function InfoDefs({ items }) {
  return (
    <div className="grid grid-cols-[auto_auto_1fr] gap-x-1.5 gap-y-0.5 items-baseline">
      {items.map((it, i) =>
        it.n ? (
          <div key={i} className="col-span-3">{it.n}</div>
        ) : (
          <Fragment key={i}>
            <span className="whitespace-nowrap">{it.t}</span>
            <span>=</span>
            <span>{it.d}</span>
          </Fragment>
        ),
      )}
    </div>
  )
}

// Fette Zwischenüberschrift innerhalb eines ⓘ-Kastens (z. B. „Spiel" / „…Platzierung").
function InfoHeading({ children }) {
  return <p className="font-semibold text-foreground mt-2 first:mt-0">{children}</p>
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

// Kleine Unterüberschrift innerhalb eines Bereichs (z. B. „Erster" / „Letzter"
// / „Netto-Saldo" unter dem gemeinsamen Ebenen-Umschalter).
function SubTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold text-foreground/80 mb-2 mt-6 first:mt-0">
      {children}
    </h3>
  )
}

// Mehrwertiger Umschalter (z. B. Spiel | Runde | Partie) – gleiches kleines
// Segmented Control wie ViewToggle, nur mit frei übergebenen Optionen.
function LevelToggle({ level, onChange, options }) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 mb-4 text-sm">
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-3 py-1 rounded-md transition-colors ${
            level === o.key ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const LEVEL_OPTIONS = [
  { key: 'game',    label: 'Spiel' },
  { key: 'round',   label: 'Runde' },
  { key: 'session', label: 'Partie' },
]

// Globaler Nerd-Modus-Schalter (Tier 1, Phase 4.2): eine kleine Pille, die quer
// über alle Kennzahlen zusätzliche technische Tiefe zuschaltet (erste Nutzlast:
// σ neben dem Box-Plot L8). Sitzt oben bei den Filtern; der Zustand lebt global
// im StatsFilterContext und überlebt einen Neustart.
function NerdToggle() {
  const { nerdMode, setNerdMode } = useStatsFilter()
  return (
    <button
      onClick={() => setNerdMode(v => !v)}
      className={`self-start px-3 py-1 rounded-full border text-sm whitespace-nowrap transition-colors ${
        nerdMode
          ? 'bg-primary text-primary-foreground border-primary font-medium'
          : 'border-border text-muted-foreground hover:text-foreground'
      }`}
      aria-pressed={nerdMode}
    >
      🤓 Nerd-Modus {nerdMode ? 'an' : 'aus'}
    </button>
  )
}

// Rubrik-Kachel (Navigations-Ebene 0): teasert ein Statistik-Thema an und führt
// per Tap auf die Rubrik-Seite (Ebene 1). Emoji + Titel + Halbsatz + eine
// Highlight-Zeile (aktuelle:r Spitzenreiter:in einer Signatur-Kennzahl).
function RubrikCard({ emoji, title, teaser, highlight, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start text-left gap-1 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-2xl" aria-hidden>{emoji}</span>
        <ChevronRight size={18} className="text-muted-foreground" />
      </div>
      <span className="font-semibold text-base">{title}</span>
      <span className="text-xs text-muted-foreground">{teaser}</span>
      {highlight && (
        <span className="text-xs text-foreground/70 mt-1 tabular-nums">{highlight}</span>
      )}
    </button>
  )
}

// Raster der Rubrik-Kacheln auf dem Dashboard (Ebene 0). Zwei Spalten; wächst
// später um weitere Rubriken (Risiko, Solo, …), ohne dass sich die Logik ändert.
function RubrikGrid({ onOpen, highlights }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <RubrikCard
        emoji="🏆"
        title="Leistung"
        teaser="Wer punktet."
        highlight={highlights ? `Meiste Siege: ${highlights.leistung}` : null}
        onClick={() => onOpen('leistung')}
      />
      <RubrikCard
        emoji="⏱️"
        title="Ausdauer"
        teaser="Wer am meisten dabei ist."
        highlight={highlights ? `Meiste Partien: ${highlights.ausdauer}` : null}
        onClick={() => onOpen('ausdauer')}
      />
    </div>
  )
}

// Zurück-Leiste auf einer Rubrik-Seite (Ebene 1): führt zurück aufs Dashboard.
function BackBar({ title, onBack }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground -mb-2"
    >
      <ChevronLeft size={18} />
      <span>Übersicht</span>
      <span className="mx-1 text-border">/</span>
      <span className="text-foreground font-medium">{title}</span>
    </button>
  )
}

// Kleiner Hinweis-Kasten für Datenlücken (P2): erklärt, dass eine Kennzahl nur
// auf einem Teil der Historie beruht – statt still eine falsche 0 zu zeigen.
function GapNote({ children }) {
  return (
    <p className="mb-3 text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
      {children}
    </p>
  )
}

// A7: drei kleine Kacheln mit der Ø-Dauer je Partie / Runde / Spiel. Die Dauer
// ist eine Eigenschaft des Abends (für alle am Tisch gleich), deshalb KEINE
// Personen-Rangliste, sondern kompakte Gruppen-Werte.
function DurationTiles({ avg, gameCaveat }) {
  const tiles = [
    { label: 'Ø Partie', value: avg.session },
    { label: 'Ø Runde',  value: avg.round },
    { label: 'Ø Spiel',  value: avg.game, caveat: gameCaveat },
  ]
  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map(t => (
        <div key={t.label} className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-card text-center">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{t.label}</span>
          <span className="text-base font-semibold tabular-nums mt-1">{fmtDur(t.value)}</span>
          {t.caveat && <span className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{t.caveat}</span>}
        </div>
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
// Reiner Zähler ohne Vorzeichen: 12 / 0 (für Anzahlen wie „wie oft Erster").
const fmtCount = (n) => (n === null ? '–' : `${n}`)
// Dezimalzahl mit einer Nachkommastelle OHNE Vorzeichen (für Dichte-Werte wie
// „4,2 Runden/Partie" – die sind immer ≥ 0, ein „+" wäre hier sinnlos).
const fmtDec1 = (n) => (n === null ? '–' : n.toFixed(1).replace('.', ','))
// Quote als Prozent ohne Nachkommastelle: 63 % (Eingabe ist ein Anteil 0…1).
const fmtQuote = (n) => (n === null ? '–' : `${Math.round(n * 100)} %`)
// Mehrleistung über eine Norm, in Prozentpunkten mit Plus-Vorzeichen: +20 % / 0 %.
// (Eingabe ist schon der Prozentwert, nicht der Anteil – kann hier nie < 0 werden.)
const fmtPlusPercent = (n) => (n === null ? '–' : `${n > 0 ? '+' : ''}${Math.round(n)} %`)
// Zeitdauer aus Millisekunden: „2 h 39 min" bzw. „8 min" (unter 1 h ohne Stunden).
const fmtDur = (ms) => {
  if (ms == null) return '–'
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
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
      // P6: „Schnitt" ist ein Durchschnitt → bei < 8 gespielten Runden dämpfen.
      // „Gesamt" ist eine Absolutzahl und bleibt immun (kein weak-Eintrag).
      weak: { per4: isWeakSample(r) },
    }
  })
}

const GESAMTSCORE_COLUMNS = [
  { key: 'absolut', label: 'Gesamt',  format: fmtInt },
  { key: 'per4',    label: 'Schnitt', format: fmtPer4 },
]

// L1 Sieg/Niederlage (Spielebene, binär): pro Person die Anzahl gewonnener Spiele
// und die Siegquote (Siege ÷ eigene gespielte, entschiedene Spiele).
// P6: nur die Quote dämpfen; „Siege" ist eine Absolutzahl und bleibt immun.
function buildSiegNiederlage(data) {
  const acc = winLossStats(data)
  return [...acc.entries()].map(([id, a]) => {
    const p = data.players.get(id)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: {
        siege: a.siege,
        // Ohne gespielte Spiele keine sinnvolle Quote → null (zeigt „–").
        quote: a.games > 0 ? a.siege / a.games : null,
      },
      weak: { quote: isWeakSample(a.games) },
    }
  })
}

const SIEG_COLUMNS = [
  { key: 'siege', label: 'Siege',     format: fmtCount, tone: 'good' },
  { key: 'quote', label: 'Siegquote', format: fmtQuote, tone: 'plain' },
]

// L6 Durchschnittsscore: der mittlere Punktestand je Spiel / Runde / Partie.
// Für jede Ebene teilen wir die Gesamtsumme durch die eigene Anzahl gespielter
// Einheiten – so ist der Schnitt fair unabhängig davon, wer wie oft dabei war.
// Alle drei Ebenen stehen nebeneinander; jede Spalte ist per Kopf sortierbar.
function buildDurchschnittsscore(data) {
  const totals   = playerTotals(data)
  const games    = playedGamesByPlayer(data)
  const rounds   = playedRoundsByPlayer(data)
  const sessions = playedSessionsByPlayer(data)
  return [...totals.entries()].map(([id, total]) => {
    const p = data.players.get(id)
    const g = games.get(id) ?? 0
    const r = rounds.get(id) ?? 0
    const s = sessions.get(id) ?? 0
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: {
        // Ohne gespielte Einheiten kein sinnvoller Schnitt → null (zeigt „–").
        avgGame:    g > 0 ? total / g : null,
        avgRound:   r > 0 ? total / r : null,
        avgSession: s > 0 ? total / s : null,
      },
      // P6: alle drei sind Durchschnitte → je Ebene mit dem EIGENEN Nenner
      // (Spiele/Runden/Partien) dämpfen. So kann jemand bei „Ø Spiel" solide
      // und bei „Ø Partie" dünn sein.
      weak: {
        avgGame:    isWeakSample(g),
        avgRound:   isWeakSample(r),
        avgSession: isWeakSample(s),
      },
    }
  })
}

const DURCHSCHNITT_COLUMNS = [
  { key: 'avgGame',    label: 'Ø Spiel',  format: fmtPer4 },
  { key: 'avgRound',   label: 'Ø Runde',  format: fmtPer4 },
  { key: 'avgSession', label: 'Ø Partie', format: fmtPer4 },
]

// Kurzes Rekord-Datum „TT.MM.JJ" mit fester Stellenzahl (führende Nullen bleiben,
// damit die Datumszeilen sauber untereinander stehen). ISO ist schon 2-stellig.
function recordDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y.slice(2)}`
}

// L7 Bester/schlechtester Wert: pro Person der höchste und der tiefste
// Einzelsaldo auf der gewählten Ebene (Spiel/Runde/Partie). „Höchster" = das
// beste Einzelergebnis, „Tiefster" = das schlechteste. Unter jedem Wert steht
// als Zusatzzeile (meta.sublabel) das Datum, an dem der Rekord fiel.
function buildBestWorst(data, level) {
  const { best, worst } = bestWorstSaldo(data, level)
  // Alle Personen einsammeln, die auf dieser Ebene überhaupt einen Wert haben.
  const ids = new Set([...best.keys(), ...worst.keys()])
  return [...ids].map(id => {
    const p = data.players.get(id)
    const b = best.get(id)
    const w = worst.get(id)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: {
        best:  b ? b.value : null,
        worst: w ? w.value : null,
      },
      meta: {
        best:  b ? { sublabel: recordDate(b.date) } : undefined,
        worst: w ? { sublabel: recordDate(w.date) } : undefined,
      },
    }
  })
}

const BESTWORST_COLUMNS = [
  { key: 'best',  label: 'Höchster', format: fmtInt },
  // Start-Sortierung aufsteigend → beim ersten Klick steht der negativste oben.
  { key: 'worst', label: 'Tiefster', format: fmtInt, sortDir: 'asc' },
]

// L2/L3 Platzierung: Erster + Letzter in EINER Tabelle (wie oft ganz vorn / ganz
// hinten), die Quote je als kleine Zeile darunter (meta.sublabel) – analog zur
// Netto-Tabelle. Erster und Letzter sind zwei getrennte Auszeichnungen, keine
// Aufteilung (dazwischen liegt das Mittelfeld) – sie müssen sich also nicht zu
// 100 % summieren. P6: die Quoten-Zeilen werden bei dünner Stichprobe kursiv;
// die Zähler bleiben als Absolutzahlen voll sichtbar und sortierbar.
function buildPlatzierung(data, level) {
  const acc = placementStats(data, level)
  return [...acc.entries()].map(([id, a]) => {
    const p = data.players.get(id)
    const q = (n) => (a.units > 0 ? fmtQuote(n / a.units) : '')
    const weak = isWeakSample(a.units)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: { erster: a.erster, letzter: a.letzter },
      meta: {
        erster:  { sublabel: q(a.erster),  weak },
        letzter: { sublabel: q(a.letzter), weak },
      },
    }
  })
}

// Netto-Saldo (L4): Anzahl Einheiten mit positivem / neutralem / negativem Saldo.
// Unter jeder Anzahl steht klein die zugehörige Quote (Anteil an gespielten Einheiten).
function buildNetto(data, level) {
  const acc = placementStats(data, level)
  return [...acc.entries()].map(([id, a]) => {
    const p = data.players.get(id)
    const q = (n) => (a.units > 0 ? fmtQuote(n / a.units) : '')
    // P6: Die Zähler (pos/neutral/neg) sind Absolutzahlen und bleiben voll
    // sichtbar; nur die Quoten-Unterzeilen werden bei dünner Stichprobe kursiv.
    const weak = isWeakSample(a.units)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: { pos: a.pos, neutral: a.neutral, neg: a.neg },
      meta: {
        pos:     { sublabel: q(a.pos),     weak },
        neutral: { sublabel: q(a.neutral), weak },
        neg:     { sublabel: q(a.neg),     weak },
      },
    }
  })
}

// Datumsspanne der Rekord-Serie, kompakt und in Klammern – ohne führende Nullen,
// und es wird nur wiederholt, was sich zwischen Start und Ende ändert:
//   • gleicher Monat      → „(1.-14.3.26)"        (Tag–Tag, Monat & Jahr einmal)
//   • gleiches Jahr       → „(1.3.-17.7.26)"      (beide Monate, Jahr einmal)
//   • über Jahreswechsel  → „(23.12.25-17.5.26)"  (beide Jahre)
//   • Serie der Länge 1   → „(14.3.26)"           (ein Datum)
// null (nie erreicht) → keine Zeile. Der Bindestrich ist die einzige Umbruch-
// stelle, daher bricht die Zeile – wenn überhaupt – sauber zwischen den zwei Daten.
function streakRange(von, bis) {
  if (!von) return null
  const p = (iso) => { const [y, m, d] = iso.split('-'); return { d: Number(d), m: Number(m), y: y.slice(2) } }
  const a = p(von), b = p(bis)
  if (von === bis) return `(${a.d}.${a.m}.${a.y})`
  if (a.y !== b.y) return `(${a.d}.${a.m}.${a.y}-${b.d}.${b.m}.${b.y})`
  if (a.m !== b.m) return `(${a.d}.${a.m}.-${b.d}.${b.m}.${b.y})`
  return `(${a.d}.-${b.d}.${b.m}.${b.y})`
}

// L5 Serien (Spielebene): längste Sieg- bzw. Niederlagen-Serie als Hauptwert;
// darunter zwei kleine Zeilen – die Datumsspanne der Rekord-Serie und die gerade
// laufende Serie („aktuell: N"). Serien sind Absolutzahlen → immun gegen P6.
function buildSiegSerie(data) {
  const acc = winLossStreaks(data)
  return [...acc.entries()].map(([id, a]) => {
    const p = data.players.get(id)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: { sieg: a.siegLaengste, pech: a.niederlageLaengste },
      meta: {
        sieg: { sublabel: [streakRange(a.siegVon, a.siegBis), `aktuell: ${a.siegAktuell}`].filter(Boolean) },
        pech: { sublabel: [streakRange(a.niederlageVon, a.niederlageBis), `aktuell: ${a.niederlageAktuell}`].filter(Boolean) },
      },
    }
  })
}

// L5 Serien (Runde-/Partie-Ebene): längste Erster- bzw. Letzter-Serie als
// Hauptwert; darunter Datumsspanne des Rekords und die aktuelle Serie.
function buildPlatzSerie(data, level) {
  const acc = placementStreaks(data, level)
  return [...acc.entries()].map(([id, a]) => {
    const p = data.players.get(id)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: { erster: a.ersterLaengste, letzter: a.letzterLaengste },
      meta: {
        erster:  { sublabel: [streakRange(a.ersterVon, a.ersterBis),   `aktuell: ${a.ersterAktuell}`].filter(Boolean) },
        letzter: { sublabel: [streakRange(a.letzterVon, a.letzterBis), `aktuell: ${a.letzterAktuell}`].filter(Boolean) },
      },
    }
  })
}

const SIEGSERIE_COLUMNS = [
  { key: 'sieg', label: 'Siegserie',   format: fmtCount, tone: 'good' },
  { key: 'pech', label: 'Pechsträhne', format: fmtCount, tone: 'bad' },
]
const PLATZSERIE_COLUMNS = [
  { key: 'erster',  label: 'Erster',  format: fmtCount, tone: 'good' },
  { key: 'letzter', label: 'Letzter', format: fmtCount, tone: 'bad' },
]

// L9 Deutlichkeit der Siege: Verteilung der eigenen Siege auf die fünf Stufen als
// gestapelter Balken. clearShare = Anteil „deutlicher" Siege (alles außer „normal")
// – danach wird sortiert. P6: bei < 8 Siegen dünn → gedämpft und ans Ende.
function buildClarity(data) {
  const acc = clarityStats(data)
  return [...acc.entries()].map(([id, a]) => {
    const p = data.players.get(id)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      total:     a.total,
      counts:    { normal: a.normal, k90: a.k90, k60: a.k60, k30: a.k30, schwarz: a.schwarz },
      // Anteil deutlicher Siege = alles außer dem knappen „normalen" Sieg.
      clearShare: a.total > 0 ? (a.total - a.normal) / a.total : 0,
      weak:       isWeakSample(a.total),
    }
  })
}

// L8 Streuung/Konstanz: pro Person die Verteilungs-Kennzahlen für den Box-Plot
// (min/q1/median/q3/max + σ + n). Die Sortierung (nach Median) und die
// P6-Dämpfung übernimmt die BoxPlot-Komponente selbst.
function buildSpread(data, level) {
  const acc = spreadStats(data, level)
  return [...acc.entries()].map(([id, s]) => {
    const p = data.players.get(id)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      ...s, // n, min, q1, median, q3, max, sigma
      weak: isWeakSample(s.n),
    }
  })
}

const PLATZIERUNG_COLUMNS = [
  { key: 'erster',  label: 'Erster',  format: fmtCount, tone: 'good' },
  { key: 'letzter', label: 'Letzter', format: fmtCount, tone: 'bad' },
]
const NETTO_COLUMNS = [
  { key: 'pos',     label: 'Positiv', format: fmtCount, tone: 'good' },
  { key: 'neutral', label: 'Neutral', format: fmtCount, tone: 'muted' },
  { key: 'neg',     label: 'Negativ', format: fmtCount, tone: 'bad' },
]

// ── Ausdauer-Block (A1–A3) ──
// Alle drei sind laut Konzept P6-immun: A1/A2 sind Mengen bzw. strukturelle
// Dichten, A3 hat einen Gruppen-Nenner (nicht die eigene Stichprobe). Deshalb
// setzen die Bau-Funktionen KEIN weak-Flag – es wird nirgends gedämpft.

// A1 Mengen: absolute Anzahl gespielter Spiele / Runden / Partien je Person.
// „Gespielt" = mit dabei (Ausgesetzt-Spiele zählen bei den Spielen nicht mit).
function buildMengen(data) {
  const games    = playedGamesByPlayer(data)
  const rounds   = playedRoundsByPlayer(data)
  const sessions = playedSessionsByPlayer(data)
  // Basis = alle, die überhaupt eine Partie mitgespielt haben.
  return [...sessions.keys()].map(id => {
    const p = data.players.get(id)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: {
        spiele:  games.get(id)    ?? 0,
        runden:  rounds.get(id)   ?? 0,
        partien: sessions.get(id) ?? 0,
      },
    }
  })
}

const MENGEN_COLUMNS = [
  { key: 'spiele',  label: 'Spiele',  format: fmtCount, tone: 'plain' },
  { key: 'runden',  label: 'Runden',  format: fmtCount, tone: 'plain' },
  { key: 'partien', label: 'Partien', format: fmtCount, tone: 'plain' },
]

// A2 Dichte: wie „voll" die eigenen Einheiten typischerweise waren.
//   Runden/Partie = eigene Runden ÷ eigene Partien (wie lang ein Abend lief)
//   Spiele/Runde  = eigene Spiele ÷ eigene Runden  (steigt durch Solos)
// Bezug jeweils die EIGENEN gespielten Einheiten (konsistent mit L6).
function buildDichte(data) {
  const games    = playedGamesByPlayer(data)
  const rounds   = playedRoundsByPlayer(data)
  const sessions = playedSessionsByPlayer(data)
  return [...sessions.keys()].map(id => {
    const p = data.players.get(id)
    const g = games.get(id)    ?? 0
    const r = rounds.get(id)   ?? 0
    const s = sessions.get(id) ?? 0
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: {
        rundenProPartie: s > 0 ? r / s : null,
        spieleProRunde:  r > 0 ? g / r : null,
      },
    }
  })
}

const DICHTE_COLUMNS = [
  { key: 'rundenProPartie', label: 'Runden/Partie', format: fmtDec1, tone: 'plain' },
  { key: 'spieleProRunde',  label: 'Spiele/Runde',  format: fmtDec1, tone: 'plain' },
]

// A3 Teilnahmequote: Anteil an ALLEN Partien der Gruppe im Zeitraum. Nenner =
// alle Partien im Zeitraum (nicht die eigene Stichprobe) → immer aussagekräftig,
// P6-immun. Darunter als kleiner Anker die absolute „12/14"-Zeile.
function buildTeilnahme(data) {
  const sessions = playedSessionsByPlayer(data)
  const total = data.sessions.length
  return [...sessions.keys()].map(id => {
    const p = data.players.get(id)
    const mine = sessions.get(id) ?? 0
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: { quote: total > 0 ? mine / total : null },
      meta:   { quote: { sublabel: `${mine}/${total}` } },
    }
  })
}

const TEILNAHME_COLUMNS = [
  { key: 'quote', label: 'Anteil', format: fmtQuote, tone: 'plain' },
]

// A5 Gebeversuche: absolute Zahl der Gaben (Rotation + Solo-Neugaben + Neugeben)
// und daneben die „Mehrlast" – wie viel öfter als der Soll (1×/Runde) jemand
// austeilen musste. Rohwert Gaben/Runden liegt immer knapp über 1; wir zeigen
// deshalb die prozentuale Mehrleistung (1,2 → +20 %), das spreizt Pech-/Solo-
// Vielgeber sichtbar. Beides P6-immun (Mengen bzw. strukturelle Relation).
function buildGebeversuche(data) {
  const deals  = dealingStats(data)
  const rounds = playedRoundsByPlayer(data)
  return [...deals.entries()].map(([id, d]) => {
    const p = data.players.get(id)
    const r = rounds.get(id) ?? 0
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: {
        gaben:    d,
        // Ohne gespielte Runden keine sinnvolle Relation → null (zeigt „–").
        mehrlast: r > 0 ? (d / r - 1) * 100 : null,
      },
      // P6: „Gaben" ist eine Absolutzahl und bleibt immun; die „Mehrlast" ist
      // eine Quote (Gaben ÷ Runden) und rauscht bei wenigen Runden stark – wie
      // jede andere Quote im App dämpfen wir sie bei < 8 Runden.
      weak: { mehrlast: isWeakSample(r) },
    }
  })
}

const GEBEVERSUCHE_COLUMNS = [
  { key: 'gaben',    label: 'Gaben',    format: fmtCount,       tone: 'plain' },
  { key: 'mehrlast', label: 'Mehrlast', format: fmtPlusPercent, tone: 'plain' },
]

// A6 Spielstunden: Summe der am Tisch verbrachten Zeit je Person, nur aus
// App-erfassten Abenden (Importe haben keine Uhrzeiten – s. P2-Hinweis).
function buildSpielstunden(pt, data) {
  return [...pt.perPlayer.entries()].map(([id, ms]) => {
    const p = data.players.get(id)
    return {
      id,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      values: { zeit: ms },
    }
  })
}

const SPIELSTUNDEN_COLUMNS = [
  { key: 'zeit', label: 'Spielzeit', format: fmtDur, tone: 'plain' },
]

// Name der Person mit dem höchsten Wert in einer Map(id → zahl) – für die
// Highlight-Zeile auf den Rubrik-Kacheln. Leere Map → „–".
function topName(data, map) {
  let bestId = null
  let bestV = -Infinity
  for (const [id, v] of map) {
    if (v > bestV) { bestV = v; bestId = id }
  }
  return bestId != null ? (data.players.get(bestId)?.name ?? '?') : '–'
}

// Die eigentliche Seite – lebt INNERHALB des StatsFilterProvider (s. Default-Export
// unten), damit sie den gewählten Zeitraum über useStatsFilter() lesen kann.
function StatsPageInner() {
  const [data, setData] = useState(null)          // null = lädt noch (ungefilterte Rohdaten)
  const [error, setError] = useState(false)
  const [view, setView] = useState('verlauf')     // 'verlauf' | 'tabelle' (Gesamtscore)
  const [l7Level, setL7Level] = useState('game')  // 'game' | 'round' | 'session' (L7-Ebene)
  const [placementLevel, setPlacementLevel] = useState('game') // 'game' (L1) | 'round' | 'session' (L2/L3/L4)
  const [streakLevel, setStreakLevel] = useState('session')    // 'game' | 'round' | 'session' (L5-Ebene; Partie = Königs-KPI → Default)
  const [spreadLevel, setSpreadLevel] = useState('game')       // 'game' | 'round' | 'session' (L8-Ebene; Spiel = meiste Datenpunkte → Default)
  const [activeBlock, setActiveBlock] = useState(null)         // null = Dashboard (Ebene 0), 'leistung' | 'ausdauer' = Rubrik-Seite (Ebene 1)

  // Der aktive Zeitraum als Datumsgrenzen + der globale Nerd-Modus (beides aus dem Context).
  const { range, nerdMode } = useStatsFilter()

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
  const gesamtscore   = useMemo(() => (filtered ? buildGesamtscore(filtered) : null), [filtered])
  const curve         = useMemo(() => (filtered ? buildScoreCurve(filtered) : null), [filtered])
  const durchschnitt  = useMemo(() => (filtered ? buildDurchschnittsscore(filtered) : null), [filtered])
  // Bester/schlechtester Wert hängt zusätzlich an der gewählten Ebene (l7Level).
  const bestWorst     = useMemo(
    () => (filtered ? buildBestWorst(filtered, l7Level) : null),
    [filtered, l7Level],
  )
  // Platzierungs-Block, gesteuert vom gemeinsamen Ebenen-Umschalter:
  //   Spiel  → Sieg/Niederlage (L1, binär)
  //   Runde/Partie → Erster/Letzter/Netto (L2/L3/L4)
  // Es wird immer nur die Kennzahl der AKTIVEN Ebene berechnet (die jeweils andere = null).
  const isGameLevel = placementLevel === 'game'
  const siegNiederlage = useMemo(
    () => (filtered && isGameLevel ? buildSiegNiederlage(filtered) : null),
    [filtered, isGameLevel],
  )
  const platzierung = useMemo(() => (filtered && !isGameLevel ? buildPlatzierung(filtered, placementLevel) : null), [filtered, placementLevel, isGameLevel])
  const netto       = useMemo(() => (filtered && !isGameLevel ? buildNetto(filtered, placementLevel)       : null), [filtered, placementLevel, isGameLevel])

  // Serien-Block (L5), gesteuert vom eigenen Ebenen-Umschalter:
  //   Spiel        → Siegserie / Pechsträhne (aus dem Gewinner-Flag)
  //   Runde/Partie → Erster-Serie / Letzter-Serie (aus den Salden)
  const isStreakGame = streakLevel === 'game'
  const siegSerie  = useMemo(() => (filtered &&  isStreakGame ? buildSiegSerie(filtered)                : null), [filtered, isStreakGame])
  const platzSerie = useMemo(() => (filtered && !isStreakGame ? buildPlatzSerie(filtered, streakLevel)  : null), [filtered, streakLevel, isStreakGame])

  // Deutlichkeit der Siege (L9) – Verteilung über die fünf Stufen, Spielebene.
  const clarity = useMemo(() => (filtered ? buildClarity(filtered) : null), [filtered])

  // Streuung/Konstanz (L8) – Box-Plot-Kennzahlen auf der gewählten Ebene.
  const spread = useMemo(() => (filtered ? buildSpread(filtered, spreadLevel) : null), [filtered, spreadLevel])

  // Ausdauer-Block (A1–A3).
  const mengen     = useMemo(() => (filtered ? buildMengen(filtered)        : null), [filtered])
  const dichte     = useMemo(() => (filtered ? buildDichte(filtered)        : null), [filtered])
  const teilnahme  = useMemo(() => (filtered ? buildTeilnahme(filtered)     : null), [filtered])
  const attendance = useMemo(() => (filtered ? attendanceTimeline(filtered) : null), [filtered])
  const gebeversuche = useMemo(() => (filtered ? buildGebeversuche(filtered) : null), [filtered])
  // Spielzeit (A6/A7): einmal die Rohkennzahlen, daraus die Personen-Liste (A6).
  const playtime     = useMemo(() => (filtered ? playtimeStats(filtered) : null), [filtered])
  const spielstunden = useMemo(() => (playtime ? buildSpielstunden(playtime, filtered) : null), [playtime, filtered])

  // Highlight-Zeilen für die Rubrik-Kacheln (Dashboard): aktuelle Spitzenreiter:innen.
  //   Leistung → meiste Siege (L1), Ausdauer → meiste Partien (A1).
  const highlights = useMemo(() => {
    if (!filtered) return null
    const siege = new Map([...winLossStats(filtered)].map(([id, a]) => [id, a.siege]))
    return {
      leistung: topName(filtered, siege),
      ausdauer: topName(filtered, playedSessionsByPlayer(filtered)),
    }
  }, [filtered])

  // Enthält der gewählte Zeitraum überhaupt Partien?
  const isEmpty = filtered && filtered.sessions.length === 0

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Statistiken</h1>
        <p className="text-muted-foreground text-sm mt-1">Alle Auswertungen auf einen Blick</p>
      </header>

      <div className="px-4 flex flex-col gap-8">
        {/* Globaler Zeitraum-Filter + Nerd-Modus – gelten für alle Bereiche darunter */}
        {data && <PeriodFilter years={years} />}
        {data && <NerdToggle />}

        {/* Fehler-/Lade-/Leer-Zustand einmal zentral; die Bereiche erscheinen
            nur, wenn es im gewählten Zeitraum wirklich etwas anzuzeigen gibt. */}
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
        ) : activeBlock === null ? (
          /* ── Ebene 0: Dashboard – Gesamtscore als Held + Rubrik-Kacheln ── */
          <>
            {/* ── Gesamtscore (G1) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { t: 'Gesamt',  d: 'Summe aller Punkte' },
                    { t: 'Schnitt', d: 'Durchschnitt je „Standard-Partie" (4 Runden)' },
                  ]} />
                }
              >
                Gesamtscore
              </SectionTitle>

              <ViewToggle view={view} onChange={setView} />

              {view === 'verlauf' ? (
                <ScoreCurve points={curve.points} players={curve.players} />
              ) : (
                <StatsRankingList
                  entries={gesamtscore}
                  columns={GESAMTSCORE_COLUMNS}
                  defaultSortKey="absolut"
                />
              )}
            </section>

            {/* Rubrik-Kacheln → Ebene 1 */}
            <RubrikGrid onOpen={setActiveBlock} highlights={highlights} />
          </>
        ) : activeBlock === 'leistung' ? (
          /* ── Ebene 1: Rubrik „Leistung“ ── */
          <>
            <BackBar title="Leistung" onBack={() => setActiveBlock(null)} />

            {/* ── Durchschnittsscore (L6) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { t: 'Ø Spiel',  d: 'Durchschnitt je mitgespieltem Spiel' },
                    { t: 'Ø Runde',  d: 'Durchschnitt je mitgespielter Runde' },
                    { t: 'Ø Partie', d: 'Durchschnitt je mitgespielter Partie' },
                  ]} />
                }
              >
                Durchschnittsscore
              </SectionTitle>

              <StatsRankingList
                entries={durchschnitt}
                columns={DURCHSCHNITT_COLUMNS}
                defaultSortKey="avgSession"
              />
            </section>

            {/* ── Bester/schlechtester Wert (L7) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { n: 'Auf der gewählten Ebene (Spiel, Runde oder Partie):' },
                    { t: 'Höchster', d: 'das beste eigene Ergebnis' },
                    { t: 'Tiefster', d: 'das schlechteste eigene Ergebnis' },
                  ]} />
                }
              >
                Bester &amp; schlechtester Wert
              </SectionTitle>

              <LevelToggle level={l7Level} onChange={setL7Level} options={LEVEL_OPTIONS} />

              <StatsRankingList
                entries={bestWorst}
                columns={BESTWORST_COLUMNS}
                defaultSortKey="best"
              />
            </section>

            {/* ── Sieg · Platz · Saldo (L1/L2/L3/L4), ein Umschalter über alle Ebenen ── */}
            <section>
              <SectionTitle
                info={
                  <>
                    <InfoHeading>Spiel</InfoHeading>
                    <InfoDefs items={[
                      { t: 'Siege',     d: 'Anzahl gewonnener Spiele' },
                      { t: 'Siegquote', d: 'Anteil gewonnener an den mitgespielten Spielen' },
                    ]} />
                    <InfoHeading>Runde / Partie – Platzierung</InfoHeading>
                    <InfoDefs items={[
                      { t: 'Erster',  d: 'wie oft man den höchsten Punktestand der Runde/Partie hatte' },
                      { t: 'Letzter', d: 'wie oft man den niedrigsten Punktestand der Runde/Partie hatte' },
                      { n: 'Bei Gleichstand zählt der Platz für alle Beteiligten.' },
                    ]} />
                    <InfoHeading>Runde / Partie – Netto-Saldo</InfoHeading>
                    <InfoDefs items={[
                      { t: 'Positiv / Neutral / Negativ', d: 'wie oft die eigene Bilanz je Runde/Partie so ausfiel' },
                      { t: 'Quote',                       d: 'Anteil an den mitgespielten Runden/Partien' },
                    ]} />
                  </>
                }
              >
                Sieg · Platz · Saldo
              </SectionTitle>

              <LevelToggle level={placementLevel} onChange={setPlacementLevel} options={LEVEL_OPTIONS} />

              {/* Eigene key je Liste: sonst behält React beim Ebenen-Wechsel die
                  Listen-Instanz samt Sortierspalte, die es auf der neuen Ebene
                  gar nicht gibt → wirkt unsortiert. */}
              {isGameLevel ? (
                <StatsRankingList key="l1" entries={siegNiederlage} columns={SIEG_COLUMNS} defaultSortKey="siege" />
              ) : (
                <>
                  <SubTitle>Platzierung</SubTitle>
                  <StatsRankingList key="platz" entries={platzierung} columns={PLATZIERUNG_COLUMNS} defaultSortKey="erster" />

                  <SubTitle>Netto-Saldo</SubTitle>
                  <StatsRankingList key="netto" entries={netto} columns={NETTO_COLUMNS} defaultSortKey="pos" />
                </>
              )}
            </section>

            {/* ── Serien (L5), eigener Umschalter über alle Ebenen ── */}
            <section>
              <SectionTitle
                info={
                  <>
                    <InfoHeading>Spiel</InfoHeading>
                    <InfoDefs items={[
                      { t: 'Siegserie',   d: 'gewonnene Spiele in Folge' },
                      { t: 'Pechsträhne', d: 'verlorene Spiele in Folge' },
                    ]} />
                    <InfoHeading>Runde / Partie</InfoHeading>
                    <InfoDefs items={[
                      { t: 'Erster',  d: 'Runden/Partien als Erster in Folge' },
                      { t: 'Letzter', d: 'Runden/Partien als Letzter in Folge' },
                    ]} />
                    <InfoDefs items={[
                      { n: 'Große Zahl = längste Serie im Zeitraum; darunter der Zeitraum dieser Rekord-Serie (von–bis) und „aktuell" = die gerade laufende.' },
                      { n: 'Aussetzen unterbricht nicht; jede mitgespielte Einheit ohne den Zustand bricht die Serie.' },
                    ]} />
                  </>
                }
              >
                Serien
              </SectionTitle>

              <LevelToggle level={streakLevel} onChange={setStreakLevel} options={LEVEL_OPTIONS} />

              {/* Eigene key je Ebene, damit die Sortierspalte beim Wechsel frisch
                  startet (analog zum Sieg·Platz·Saldo-Block). */}
              {isStreakGame ? (
                <StatsRankingList key="sserie" entries={siegSerie} columns={SIEGSERIE_COLUMNS} defaultSortKey="sieg" colWidth="w-20" />
              ) : (
                <StatsRankingList key="pserie" entries={platzSerie} columns={PLATZSERIE_COLUMNS} defaultSortKey="erster" colWidth="w-20" />
              )}
            </section>

            {/* ── Deutlichkeit der Siege (L9) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { n: 'Verteilung der eigenen Siege auf fünf Stufen – gemessen an den erreichten Augen, nicht am Angesagten:' },
                    { t: 'Normal',   d: 'knapper Sieg (über 120), keine Absage geschafft' },
                    { t: 'Keine 90', d: 'Gegner unter 90 Augen gehalten' },
                    { t: 'Keine 60', d: 'Gegner unter 60' },
                    { t: 'Keine 30', d: 'Gegner unter 30' },
                    { t: 'Schwarz',  d: 'Gegner ohne Stich (0 Augen)' },
                    { n: 'Sortiert nach dem Anteil „deutlicher" Siege (alles außer Normal) – die Prozentzahl rechts.' },
                  ]} />
                }
              >
                Deutlichkeit der Siege
              </SectionTitle>

              <ClarityBars entries={clarity} />
            </section>

            {/* ── Streuung / Konstanz (L8) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { n: 'Der Box-Plot zeigt, wie stark die eigenen Ergebnisse auf der gewählten Ebene schwanken:' },
                    { t: 'Kasten',  d: 'die mittleren 50 % der Ergebnisse (von Q1 bis Q3)' },
                    { t: 'Strich',  d: 'der Median – der typische Wert' },
                    { t: 'Linien',  d: 'bestes und schlechtestes Einzelergebnis' },
                    { n: 'Schmaler Kasten = konstant, breiter Kasten = Zocker. Sortiert nach Median. n = Anzahl der Ergebnisse.' },
                    ...(nerdMode ? [{ t: 'σ', d: 'Standardabweichung – die technische Streuungs-Kennzahl' }] : [{ n: 'Tipp: der Nerd-Modus (oben) blendet zusätzlich σ ein.' }]),
                  ]} />
                }
              >
                Streuung / Konstanz
              </SectionTitle>

              <LevelToggle level={spreadLevel} onChange={setSpreadLevel} options={LEVEL_OPTIONS} />

              <BoxPlot entries={spread} nerd={nerdMode} />
            </section>
          </>
        ) : (
          /* ── Ebene 1: Rubrik „Ausdauer“ (A1–A3) ── */
          <>
            <BackBar title="Ausdauer" onBack={() => setActiveBlock(null)} />

            {/* ── Mengen (A1) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { n: 'Absolute Anzahl – wie viel jemand insgesamt gespielt hat:' },
                    { t: 'Spiele',  d: 'mitgespielte Einzelspiele (Aussetzen zählt nicht)' },
                    { t: 'Runden',  d: 'mitgespielte Runden' },
                    { t: 'Partien', d: 'Spielabende, an denen man dabei war' },
                  ]} />
                }
              >
                Mengen
              </SectionTitle>

              <StatsRankingList
                entries={mengen}
                columns={MENGEN_COLUMNS}
                defaultSortKey="partien"
              />
            </section>

            {/* ── Dichte (A2) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { n: 'Wie „voll“ die eigenen Einheiten typischerweise waren:' },
                    { t: 'Runden/Partie', d: 'Ø Runden je Spielabend (wie lang ein Abend lief)' },
                    { t: 'Spiele/Runde',  d: 'Ø Spiele je Runde (steigt durch Solos)' },
                  ]} />
                }
              >
                Dichte
              </SectionTitle>

              <StatsRankingList
                entries={dichte}
                columns={DICHTE_COLUMNS}
                defaultSortKey="rundenProPartie"
                colWidth="w-24"
              />
            </section>

            {/* ── Teilnahmequote (A3) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { t: 'Anteil', d: 'wie viele aller Partien im Zeitraum man mitgespielt hat' },
                    { n: 'Stammspieler:in vs. Gelegenheitsgast. Nenner = alle Partien der Gruppe, darunter „eigene / alle“.' },
                  ]} />
                }
              >
                Teilnahmequote
              </SectionTitle>

              <StatsRankingList
                entries={teilnahme}
                columns={TEILNAHME_COLUMNS}
                defaultSortKey="quote"
              />
            </section>

            {/* ── Anwesenheit (A4) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { n: 'Wer war an welchem Spielabend dabei? Ein Balken je Person, von links (ältester Abend) nach rechts (jüngster) – ein Segment pro Abend.' },
                    { t: 'Grün', d: 'an dem Abend dabei' },
                    { t: 'Grau', d: 'gefehlt' },
                    { n: 'Durchgehend grün = treuer Stammgast; erst grün, dann grau = intensive Phase, danach abgeflacht. Tipp: auf eine Zeile tippen zeigt die Zusammenfassung.' },
                  ]} />
                }
              >
                Anwesenheit
              </SectionTitle>

              <AttendanceGrid timeline={attendance} />
            </section>

            {/* ── Gebeversuche (A5) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { t: 'Gaben',    d: 'wie oft jemand mischen & austeilen musste (absolut)' },
                    { t: 'Mehrlast', d: 'wie viel öfter als der Soll (1× pro Runde) – durch Solo-Neugaben und Neugeben' },
                    { n: 'Gezählt werden: das normale Geben (Rotation), die Solo-Neugabe (nach einem angesagten Solo gibt derselbe nochmal) und jedes Neugeben (fünf Neunen / Armut ohne Retter / trumpfschwach / vergeben).' },
                  ]} />
                }
              >
                Gebeversuche
              </SectionTitle>

              <StatsRankingList
                entries={gebeversuche}
                columns={GEBEVERSUCHE_COLUMNS}
                defaultSortKey="mehrlast"
                colWidth="w-20"
              />
            </section>

            {/* ── Spielzeit (A6/A7) ── */}
            <section>
              <SectionTitle
                info={
                  <InfoDefs items={[
                    { t: 'Spielzeit', d: 'am Tisch verbrachte Zeit je Person (Summe der besuchten Abende)' },
                    { t: 'Ø Partie/Runde/Spiel', d: 'durchschnittliche Dauer einer Einheit' },
                    { n: 'Dauer eines Abends = vom ersten bis zum letzten Spiel. Ø Spiel ist erfassungsempfindlich (Pausen zwischen Spielen verwischen mit der Spieldauer).' },
                  ]} />
                }
              >
                Spielzeit
              </SectionTitle>

              {playtime.dates.length === 0 ? (
                <GapNote>
                  Für den gewählten Zeitraum gibt es noch keine Abende mit Uhrzeiten – Spielzeiten
                  entstehen erst ab der App-Erfassung (ältere importierte Abende haben keine Zeitstempel).
                </GapNote>
              ) : (
                <>
                  <GapNote>
                    Nur aus {playtime.dates.length} App-erfassten{' '}
                    {playtime.dates.length === 1 ? 'Abend' : 'Abenden'} (ab {recordDate(playtime.dates[0])}).
                    Ältere importierte Abende haben keine Uhrzeiten und zählen hier bewusst nicht mit.
                  </GapNote>

                  <SubTitle>Spielstunden</SubTitle>
                  <StatsRankingList
                    entries={spielstunden}
                    columns={SPIELSTUNDEN_COLUMNS}
                    defaultSortKey="zeit"
                    colWidth="w-24"
                  />

                  <SubTitle>Ø Dauer</SubTitle>
                  <DurationTiles avg={playtime.avg} gameCaveat="mit Vorsicht" />
                </>
              )}
            </section>
          </>
        )}
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
