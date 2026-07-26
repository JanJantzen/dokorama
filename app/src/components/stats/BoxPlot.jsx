// BoxPlot – „Streuung / Konstanz" (L8) als waagerechter Box-Plot je Spieler:in.
//
// Ein Box-Plot zeigt nicht EINEN Wert, sondern die ganze VERTEILUNG der Ergebnisse
// einer Person auf der gewählten Ebene (Spiel/Runde/Partie):
//   • Kasten          = mittlere 50 % der Ergebnisse (Q1 bis Q3)
//   • Strich im Kasten = Median (der typische Wert)
//   • Linien (Whisker) = bestes und schlechtestes Einzelergebnis
// Schmaler Kasten = konstante:r Spieler:in, breiter Kasten = Zocker:in.
//
// Alle Zeilen teilen sich EINE gemeinsame Skala (globales Min/Max über alle
// Spieler:innen), damit die Kästen direkt vergleichbar sind. Eine feine 0-Linie
// läuft an derselben x-Position durch jede Zeile (Salden sind + wie −).
// Sortierung: nach Median absteigend (bester typischer Wert oben); dünne
// Stichprobe (P6, < 8 Werte) wird gedämpft und ans Ende gerückt, nie versteckt.
// Nerd-Modus (Prop `nerd`): blendet zusätzlich die Standardabweichung σ ein.
//
// Tippen auf den Balken klappt die Fünf-Zahlen-Aufschlüsselung auf – fürs Handy,
// wo man die exakten Werte nicht aus den Positionen ablesen kann.

import { useState } from 'react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// Zahl mit Vorzeichen und einer Nachkommastelle, deutsches Komma: +2,5 / −8,0.
const fmtVal = (n) => {
  if (n == null) return '–'
  const s = n.toFixed(1).replace('.', ',')
  return n > 0 ? `+${s}` : s // negative Zahl trägt ihr Minus selbst
}
// σ ist nie negativ → ohne Vorzeichen, eine Nachkommastelle.
const fmtSigma = (n) => n.toFixed(1).replace('.', ',')

// entries: [{ id, name, avatarUrl, n, min, q1, median, q3, max, sigma, weak }]
export default function BoxPlot({ entries, nerd = false, topN = 3 }) {
  const [expanded, setExpanded] = useState(false)
  const [openId, setOpenId] = useState(null) // welcher Balken ist aufgeklappt (Handy-Detailzeile)

  if (entries == null) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Lädt…</p>
  }
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Noch keine Daten im Zeitraum.</p>
  }

  // Gemeinsame Skala aus ALLEN Einträgen (nicht nur den sichtbaren), damit sie
  // beim Auf-/Zuklappen stabil bleibt. Guard gegen Null-Breite (alle gleich).
  let gmin = Math.min(...entries.map(e => e.min))
  let gmax = Math.max(...entries.map(e => e.max))
  if (gmin === gmax) { gmin -= 1; gmax += 1 }
  const span = gmax - gmin
  const pos = (v) => ((v - gmin) / span) * 100 // Wert → Prozent-Position auf der Skala
  const zeroInside = gmin < 0 && gmax > 0

  // Nach Median absteigend; dünne Stichprobe (P6) rutscht ans Ende.
  const sorted = [...entries].sort((a, b) => {
    if (a.weak !== b.weak) return a.weak ? 1 : -1
    return b.median - a.median
  })
  const collapsible = sorted.length > topN
  const visible = expanded || !collapsible ? sorted : sorted.slice(0, topN)

  return (
    <div>
      {/* Kopfzeile: Skala-Enden über dem Balkenbereich, „Median" über der Wertspalte.
          Die Spacer richten alles exakt über die Zeilen darunter aus. */}
      <div className="flex items-center gap-3 px-3 pb-1.5">
        <span className="w-5" />
        <span className="w-10" />
        <span className="w-14 sm:w-20" />
        <div className="flex-1 relative text-[10px] text-muted-foreground tabular-nums h-3">
          <span className="absolute left-0">{fmtVal(gmin)}</span>
          {zeroInside && (
            <span className="absolute -translate-x-1/2" style={{ left: `${pos(0)}%` }}>0</span>
          )}
          <span className="absolute right-0">{fmtVal(gmax)}</span>
        </div>
        <span className="w-16 text-right text-[10px] leading-tight text-muted-foreground uppercase tracking-wide">
          Median
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

                {/* Box-Plot-Strip – tippbar: klappt die Zahlen-Detailzeile auf/zu */}
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : e.id)}
                  aria-expanded={open}
                  aria-label={`${e.name}: Zahlen zur Verteilung ${open ? 'ausblenden' : 'anzeigen'}`}
                  className="flex-1 relative h-8"
                >
                  {/* feine 0-Linie (nur wenn 0 in der Skala liegt) */}
                  {zeroInside && (
                    <span className="absolute top-0 bottom-0 w-px bg-border" style={{ left: `${pos(0)}%` }} />
                  )}
                  {/* Whisker: Linie von min bis max, mittig */}
                  <span
                    className="absolute top-1/2 -translate-y-1/2 h-px bg-muted-foreground"
                    style={{ left: `${pos(e.min)}%`, width: `${pos(e.max) - pos(e.min)}%` }}
                  />
                  {/* Whisker-Endkappen (kleine senkrechte Striche an min/max) */}
                  <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-px h-3 bg-muted-foreground" style={{ left: `${pos(e.min)}%` }} />
                  <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-px h-3 bg-muted-foreground" style={{ left: `${pos(e.max)}%` }} />
                  {/* Kasten: Q1 bis Q3 (mittlere 50 %) */}
                  <span
                    className="absolute top-1.5 bottom-1.5 rounded-sm border border-primary bg-primary/20"
                    style={{ left: `${pos(e.q1)}%`, width: `${pos(e.q3) - pos(e.q1)}%` }}
                  />
                  {/* Median-Strich */}
                  <span
                    className="absolute top-1 bottom-1 -translate-x-1/2 w-0.5 bg-foreground rounded-full"
                    style={{ left: `${pos(e.median)}%` }}
                  />
                </button>

                {/* Wertspalte: Median groß; darunter n (Ehrlichkeits-Anker) und – im
                    Nerd-Modus – σ. Bei dünner Stichprobe Median grau + kursiv. */}
                <div className="w-16 flex flex-col items-end leading-tight">
                  <span className={`text-sm tabular-nums ${e.weak ? 'text-muted-foreground italic' : 'text-foreground font-semibold'}`}>
                    {fmtVal(e.median)}
                  </span>
                  <span className={`text-[10px] text-muted-foreground tabular-nums ${e.weak ? 'italic' : ''}`}>
                    n={e.n}
                  </span>
                  {nerd && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">σ={fmtSigma(e.sigma)}</span>
                  )}
                </div>
              </div>

              {/* Detailzeile (Tap): die Fünf-Zahlen-Zusammenfassung + σ (im Nerd-Modus) */}
              {open && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground tabular-nums">
                  <span>Min {fmtVal(e.min)}</span>
                  <span>Q1 {fmtVal(e.q1)}</span>
                  <span className="text-foreground/70 font-medium">Median {fmtVal(e.median)}</span>
                  <span>Q3 {fmtVal(e.q3)}</span>
                  <span>Max {fmtVal(e.max)}</span>
                  <span>n={e.n}</span>
                  {nerd && <span>σ={fmtSigma(e.sigma)}</span>}
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
