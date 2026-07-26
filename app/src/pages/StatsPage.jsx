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
import { Info } from 'lucide-react'
import {
  loadStatsData,
  playerTotals,
  playedRoundsByPlayer,
  playedGamesByPlayer,
  playedSessionsByPlayer,
  bestWorstSaldo,
  placementStats,
  winLossStats,
  buildScoreCurve,
  filterByPeriod,
  availableYears,
  isWeakSample,
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
// Quote als Prozent ohne Nachkommastelle: 63 % (Eingabe ist ein Anteil 0…1).
const fmtQuote = (n) => (n === null ? '–' : `${Math.round(n * 100)} %`)

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

const PLATZIERUNG_COLUMNS = [
  { key: 'erster',  label: 'Erster',  format: fmtCount, tone: 'good' },
  { key: 'letzter', label: 'Letzter', format: fmtCount, tone: 'bad' },
]
const NETTO_COLUMNS = [
  { key: 'pos',     label: 'Positiv', format: fmtCount, tone: 'good' },
  { key: 'neutral', label: 'Neutral', format: fmtCount, tone: 'muted' },
  { key: 'neg',     label: 'Negativ', format: fmtCount, tone: 'bad' },
]

// Die eigentliche Seite – lebt INNERHALB des StatsFilterProvider (s. Default-Export
// unten), damit sie den gewählten Zeitraum über useStatsFilter() lesen kann.
function StatsPageInner() {
  const [data, setData] = useState(null)          // null = lädt noch (ungefilterte Rohdaten)
  const [error, setError] = useState(false)
  const [view, setView] = useState('verlauf')     // 'verlauf' | 'tabelle' (Gesamtscore)
  const [l7Level, setL7Level] = useState('game')  // 'game' | 'round' | 'session' (L7-Ebene)
  const [placementLevel, setPlacementLevel] = useState('game') // 'game' (L1) | 'round' | 'session' (L2/L3/L4)

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
        ) : (
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
