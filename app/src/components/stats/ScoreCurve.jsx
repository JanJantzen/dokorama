// ScoreCurve – kumulierte Gesamtscore-Verlaufskurve (absolut) über die Zeit
//
// Eine Linie je Spieler:in: wie sich der aufsummierte Gesamtscore über die
// Partien entwickelt hat (ein Punkt je Partie). Das „Wettrennen" – wer führt
// wann, wer überholt wen.
//
// Statt einer Legende steht RECHTS neben dem Kurvenende die aktuelle Rangliste
// (Rang · Name · Punkte), jede Zeile in der Farbe ihrer Linie – das ist zugleich
// die Rangliste. Der Tooltip zeigt beim Überfahren den Stand am jeweiligen Datum,
// ebenfalls in Rangfolge (größter Wert oben).
//
// Farben: eine EIGENE, klar unterscheidbare Palette (nicht die Avatar-Farben –
// die vergeben per Namens-Hash zufällig teils gleiche/ähnliche Töne, was sechs
// Linien ununterscheidbar machen würde). Zuordnung stabil je Person (nach id),
// unabhängig von der Rangfolge. Mitteltöne → lesbar in hellem UND dunklem Modus.
//
// Achsen/Gitter/Tooltip nutzen die CSS-Variablen des Designs (var(--border) …),
// passen sich also automatisch an hell/dunkel an.

import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'

// Klar unterscheidbare Linien-Palette (Tailwind-600-Töne, hell/dunkel-tauglich).
const LINE_COLORS = [
  '#2563eb', // Blau
  '#ea580c', // Orange
  '#16a34a', // Grün
  '#9333ea', // Violett
  '#db2777', // Pink
  '#0d9488', // Türkis
  '#a16207', // Ocker
  '#dc2626', // Rot
]

// Vorzeichen vor positive Werte: +12 / −5.
const fmt = (n) => (n > 0 ? `+${n}` : `${n}`)

// meta (optional, Partie-Steckbrief): label → { round, game, roundStart }.
// Ist es gesetzt, wird die x-Achse zweizeilig (Spielnummer oben, Rundenmarker
// „R{n}" am Rundenstart) und der Tooltip nennt „Runde X · Spiel Y" statt des
// nackten Index. Ohne meta verhält sich die Kurve exakt wie bisher.
export default function ScoreCurve({ points, players, meta = null }) {
  if (!points || points.length === 0) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Noch keine Daten.</p>
  }

  // Stabile Farbzuordnung je Spieler:in: nach id sortiert, damit jede:r immer
  // dieselbe Farbe hat – unabhängig von der aktuellen Rangfolge – und alle
  // verschieden sind (keine Kollision wie bei den Avatar-Farben).
  const colorById = {}
  ;[...players]
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .forEach((p, i) => { colorById[p.id] = LINE_COLORS[i % LINE_COLORS.length] })

  // players kommt bereits nach Endstand absteigend sortiert (= Rangfolge).
  const lastPoint = points[points.length - 1]

  // Bei der Partie-Kurve die y-Achse unten um ~8 Punkte unter den tiefsten Wert
  // ziehen. So entsteht am unteren Rand freier Platz für die „Runde X"-Labels,
  // ohne dass sie auf einer tief verlaufenden Linie liegen. Ohne meta bleibt die
  // Skalierung automatisch (undefined).
  let yDomain
  if (meta) {
    let minVal = 0
    for (const p of points) for (const pl of players) {
      if (p[pl.id] < minVal) minVal = p[pl.id]
    }
    yDomain = [minVal - 8, 'auto']
  }

  // Tooltip-Titel: bei einer Partie-Kurve „Runde X · Spiel Y", sonst das rohe Label.
  const titleFor = (label) => {
    const m = meta?.[label]
    return m ? `Runde ${m.round} · Spiel ${m.game}` : label
  }

  // x-Achsen-Tick (nur mit meta): reine Spielnummer innerhalb der Runde. Der
  // Rundenmarker steht nicht mehr hier, sondern als Label IM Diagramm an der
  // Trennlinie (s. roundStarts unten). Ohne meta → Recharts-Default.
  const renderXTick = ({ x, y, payload }) => {
    const m = meta?.[payload.value]
    if (!m) return null
    return (
      <text x={x} y={y} dy={11} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
        {m.game}
      </text>
    )
  }

  // Rundenstarts (erstes Spiel jeder Runde). first = allererste Runde → dort keine
  // Trennlinie zeichnen (läge auf der Achse), aber die Beschriftung schon.
  const roundStarts = meta
    ? points
        .map((p, i) => ({ label: p.label, i }))
        .filter(({ label }) => meta[label]?.roundStart)
        .map(({ label, i }) => ({ label, round: meta[label].round, first: i === 0 }))
    : []

  // „Runde X" als Label unten IM Diagramm, linksbündig direkt rechts der Trennlinie,
  // im selben gedämpften Grau wie die übrige Achsenbeschriftung.
  const roundLabel = (round) => ({ viewBox }) => (
    <text
      x={viewBox.x + 3}
      y={viewBox.y + viewBox.height - 6}
      textAnchor="start"
      fontSize={10}
      fill="var(--muted-foreground)"
    >
      Runde {round}
    </text>
  )

  // Tooltip: Stand am überfahrenen Datum, nach Wert absteigend (= Rangfolge),
  // jede Zeile in ihrer Linienfarbe.
  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null
    const rows = [...payload].sort((a, b) => b.value - a.value)
    return (
      <div style={{
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 12,
        padding: '6px 8px',
        minWidth: 130,
      }}>
        <div style={{ color: 'var(--foreground)', fontWeight: 600, marginBottom: 3 }}>{titleFor(label)}</div>
        {rows.map((r, i) => (
          <div key={r.dataKey} style={{ color: colorById[r.dataKey], display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span>{i + 1}. {r.name}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(r.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 w-full" style={{ height: 320 }}>
      {/* Kurve */}
      <div className="flex-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 6, bottom: 0, left: 0 }}>
            {/* Bei der Partie-Kurve keine senkrechten Gitterlinien – sonst gehen die
                durchgezogenen Rundentrenner im gestrichelten Gitter unter. */}
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={!meta} />
            <XAxis
              dataKey="label"
              tick={meta ? renderXTick : { fontSize: 11, fill: 'var(--muted-foreground)' }}
              stroke="var(--border)"
              interval={meta ? 0 : 'preserveStartEnd'}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              stroke="var(--border)"
              width={40}
              domain={yDomain}
            />
            {/* Durchgezogene senkrechte Trenner + „Runde X"-Label am ersten Spiel
                jeder Runde (nur Partie-Kurve). Die allererste Runde bekommt keine
                Linie (läge auf der Achse), aber die Beschriftung. */}
            {roundStarts.map(rs => (
              <ReferenceLine
                key={`r-${rs.label}`}
                x={rs.label}
                stroke={rs.first ? 'none' : 'var(--muted-foreground)'}
                strokeOpacity={0.4}
                label={roundLabel(rs.round)}
              />
            ))}
            {/* Nulllinie hervorheben – trennt Plus von Minus */}
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.4} />
            <Tooltip content={renderTooltip} />
            {players.map(p => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                name={p.name}
                stroke={colorById[p.id]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rechte Rangliste (Endstand): Rang · Name · Punkte in Linienfarbe */}
      <div className="shrink-0 flex flex-col justify-center gap-1.5 text-xs pr-1">
        {players.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-1.5 whitespace-nowrap"
            style={{ color: colorById[p.id] }}
          >
            <span className="tabular-nums opacity-70">{i + 1}.</span>
            <span className="font-medium">{p.name}</span>
            <span className="tabular-nums font-semibold">{fmt(lastPoint[p.id] ?? 0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
