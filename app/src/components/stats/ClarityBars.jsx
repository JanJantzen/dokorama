// ClarityBars – „Deutlichkeit der Siege" (L9) als gestapelter Verteilungs-Balken.
//
// Grundgedanke: zwei Fässer. Ein Sieg ist entweder „knapp/normal" (gerade so über
// 120, keine Absage geschafft) ODER „deutlich" (Keine 90 / 60 / 30 / Schwarz
// erreicht). Der Balken macht das sichtbar: das normale Fass ist HELLGRAU, die
// deutlichen Stufen laufen als HITZE-Rampe (gelb → dunkelrot) von knapp-deutlich
// zu vernichtend. So sieht man auf einen Blick grau (knapp) gegen warm (deutlich) –
// und der graue Anteil ist genau das Gegenstück zur Prozentzahl rechts.
//
// Segmentbreite = Anteil der Siege in dieser Stufe. Rechts: Anteil „deutlicher"
// Siege (danach sortiert). Gesamtzahl der Siege steckt im Tooltip (Desktop) bzw. in
// der Detailzeile, die ein Tap auf den Balken aufklappt (Handy, wo kein Hover geht).
// Zwischen den Segmenten liegt eine 2px-Lücke (Karten-Hintergrund).

import { useState } from 'react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// Reihenfolge = Stapel-Reihenfolge (LINKS→RECHTS). Bewusst umgekehrt: das
// Deutlichste zuerst (links), abklingend zum knappen „normal" ganz rechts – so
// liegt das Interessante vorn und läuft parallel zur Sortierung. „Schwarz" ist
// (fast) schwarz, dann die Hitze-Rampe rot→gelb, dann normal = hellgrau (eigenes
// Fass gegenüber den vier deutlichen Stufen).
const STAGES = [
  { key: 'schwarz', label: 'Schwarz',  color: '#171717' }, // ~schwarz   – vernichtend
  { key: 'k30',     label: 'Keine 30', color: '#dc2626' }, // red-600    ┐
  { key: 'k60',     label: 'Keine 60', color: '#f97316' }, // orange-500 │ „deutlich"
  { key: 'k90',     label: 'Keine 90', color: '#facc15' }, // yellow-400 ┘
  { key: 'normal',  label: 'Normal',   color: '#d1d5db' }, // gray-300   – knapp gewonnen
]
const DEUTLICH = STAGES.filter(s => s.key !== 'normal')

// entries: [{ id, name, avatarUrl, total, counts: {normal,k90,k60,k30,schwarz},
//            clearShare: 0..1, weak: boolean }]
export default function ClarityBars({ entries, topN = 3 }) {
  const [expanded, setExpanded] = useState(false)
  const [openId, setOpenId] = useState(null) // welcher Balken ist aufgeklappt (Handy-Detailzeile)

  if (entries == null) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Lädt…</p>
  }
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Noch keine Siege im Zeitraum.</p>
  }

  // Nach Anteil deutlicher Siege absteigend; dünne Stichprobe (P6) rutscht ans Ende.
  const sorted = [...entries].sort((a, b) => {
    if (a.weak !== b.weak) return a.weak ? 1 : -1
    return b.clearShare - a.clearShare
  })
  const collapsible = sorted.length > topN
  const visible = expanded || !collapsible ? sorted : sorted.slice(0, topN)

  return (
    <div>
      {/* Legende, zweigeteilt (gleiche Reihenfolge wie der Balken): deutlich │ normal */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-3 px-3 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground/70">deutlich:</span>
        {DEUTLICH.map(s => (
          <span key={s.key} className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="text-border" aria-hidden>│</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#d1d5db' }} />
          normal
        </span>
      </div>

      {/* Kopfzeile: Überschrift über der %-Spalte (rechtsbündig, wie die Ranglisten) */}
      <div className="flex items-center gap-3 px-3 pb-1.5">
        <span className="w-5" />
        <span className="w-10" />
        <span className="w-14 sm:w-20" />
        <span className="flex-1" />
        <span className="w-16 text-right text-[10px] leading-tight text-muted-foreground uppercase tracking-wide">
          deutliche Siege
        </span>
      </div>

      <div className="space-y-2">
        {visible.map((e, i) => {
          const open = openId === e.id
          return (
            <div
              key={e.id}
              className={`px-3 py-2.5 rounded-xl border border-border bg-card ${e.weak ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}.</span>
                <PlayerAvatar player={{ name: e.name, avatar_url: e.avatarUrl }} size="sm" />
                <span className="w-14 sm:w-20 font-medium text-sm truncate">{e.name}</span>

                {/* Gestapelter Balken – tippbar: klappt die Detailzeile auf/zu */}
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : e.id)}
                  aria-expanded={open}
                  aria-label={`${e.name}: Aufschlüsselung der ${e.total} Siege ${open ? 'ausblenden' : 'anzeigen'}`}
                  className="flex-1 flex items-stretch h-4 gap-[2px]"
                >
                  {STAGES.map(s => {
                    const c = e.counts[s.key]
                    if (!c) return null
                    const pct = (c / e.total) * 100
                    return (
                      <span
                        key={s.key}
                        title={`${s.label}: ${c} (${Math.round(pct)} %)`}
                        className="first:rounded-l-sm last:rounded-r-sm"
                        style={{ width: `${pct}%`, background: s.color }}
                      />
                    )
                  })}
                </button>

                {/* Nur der %-Wert (Überschrift labelt die Spalte); Gesamtzahl im Tooltip / in der Detailzeile */}
                <div
                  className="w-16 flex justify-end"
                  title={`${e.total} Siege gesamt`}
                >
                  <span className={`text-sm tabular-nums ${e.weak ? 'text-muted-foreground italic' : 'text-foreground font-semibold'}`}>
                    {Math.round(e.clearShare * 100)} %
                  </span>
                </div>
              </div>

              {/* Detailzeile (Tap): Anzahl + % je Stufe + Gesamt – fürs Handy ohne Hover */}
              {open && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
                  {STAGES.map(s => {
                    const c = e.counts[s.key] ?? 0
                    if (!c) return null
                    const pct = Math.round((c / e.total) * 100)
                    return (
                      <span key={s.key} className="inline-flex items-center gap-1 tabular-nums">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                        {s.label}: {c} ({pct} %)
                      </span>
                    )
                  })}
                  <span className="tabular-nums font-medium text-foreground/70">gesamt: {e.total}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

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
