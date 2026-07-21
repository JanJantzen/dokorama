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

export default function ScoreCurve({ points, players }) {
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
        <div style={{ color: 'var(--foreground)', fontWeight: 600, marginBottom: 3 }}>{label}</div>
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              stroke="var(--border)"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              stroke="var(--border)"
              width={40}
            />
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
