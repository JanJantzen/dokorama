// AttendanceGrid – „Anwesenheit" (A4) als Präsenz-Streifen.
//
// Pro Person EIN durchgehender Balken: von links (ältester Abend) nach rechts
// (jüngster) ein schmales Segment je Spielabend – grün = dabei, grau = gefehlt.
// Weil die Segmente direkt aneinanderstoßen, liest man die „Spielerbiografie"
// als Muster: durchgehend grün = treuer Stammgast; erst grün, dann grau =
// intensive Phase, danach abgeflacht.
//
// Der Balken füllt immer die volle Breite (die Segmente teilen sich den Platz
// per flex-1) – es wird also NICHT gescrollt, die Tage werden bei vielen
// Abenden einfach schmaler. Oben trägt nur jeder k-te Abend ein festes
// Datumslabel, damit sich die Beschriftungen nicht überlappen.
//
// Zwei sich ergänzende Interaktionen:
//   • TAP auf eine Zeile   → Detailzeile mit der Anwesenheits-Biografie dieser Person.
//   • WISCHEN / MAUS drüber → ein senkrechter Fadenkreuz-Strich über alle Balken
//     an der Fingerposition, oben das GENAUE Datum dieser Spalte. So liest man
//     ab, welcher Abend ein bestimmtes Segment ist, ohne dass jeder Tag ein
//     eigenes Label bräuchte. Ein Wisch schaltet KEINE Detailzeile um (nur ein
//     sauberer Tap ohne nennenswerte Bewegung tut das).
//
// Reine Anwesenheit ist immer exakt → keine P6-Dämpfung, alle Zeilen sichtbar
// (gerade die „Gelegenheitsgast"-Zeilen sind hier das Interessante).

import { useRef, useState } from 'react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// Breite der linken Namensspalte (fix), damit alle Balken bündig starten.
const NAME_W = '5.25rem'

// Kurzes Datumslabel „T.M." ohne führende Nullen (z. B. „4.3.").
const shortDay = (iso) => {
  const [, m, d] = iso.split('-')
  return `${Number(d)}.${Number(m)}.`
}
// Volles Kurzdatum „TT.MM.JJ" (Detailzeile und Fadenkreuz-Datum).
const fullDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y.slice(2)}`
}

// timeline: { sessions: [{ id, date }], rows: [{ id, name, avatarUrl, present:[bool], total, firstDate, lastDate }] }
export default function AttendanceGrid({ timeline }) {
  const [openId, setOpenId] = useState(null)     // welche Person ist aufgeklappt (Detailzeile)
  const [scrub, setScrub] = useState(null)       // { idx, left } – Fadenkreuz-Position (null = aus)

  const plotRef = useRef(null)   // umschließt Kopf + Balken (Bezug für die senkrechte Linie)
  const barsRef = useRef(null)   // die Balken-Region (flex-1, ohne Namensspalte) → liefert Breite/links
  const startXRef = useRef(0)    // x bei Fingerauflage – um Tap von Wisch zu unterscheiden
  const movedRef = useRef(false) // wurde nennenswert bewegt? → dann kein Detail-Toggle

  if (timeline == null) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Lädt…</p>
  }
  const { sessions, rows } = timeline
  if (rows.length === 0 || sessions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center mt-8">Noch keine Daten im Zeitraum.</p>
  }

  const n = sessions.length
  // Nur jeder step-te Abend bekommt oben ein festes Label (Ziel: ~6, nie überlappend).
  const step = Math.max(1, Math.ceil(n / 6))
  const sel = rows.find(r => r.id === openId)

  // Fadenkreuz aus der Zeiger-x-Position berechnen: welche Spalte (idx) liegt
  // unter dem Finger, wo steht die Linie, und wo das Datums-Label?
  // Beides in px relativ zu plotRef.
  //   left     = echte Spaltenmitte → Position der senkrechten Linie.
  //   badgeLeft = dito, ABER am Balken-Rand festgeklemmt, damit das Label nicht
  //     über die Balken hinausragt. Am rechten Rand rutscht die Label-Mitte nach
  //     links, während die Linie an ihrer echten Position bleibt → die Linie
  //     sitzt dann am rechten Ende des Labels statt mittig darunter.
  const BADGE_HALF = 26 // grobe halbe Label-Breite in px (Datum ist stets „TT.MM.JJ")
  const updateScrub = (e) => {
    const bars = barsRef.current, plot = plotRef.current
    if (!bars || !plot) return
    const b = bars.getBoundingClientRect()
    const p = plot.getBoundingClientRect()
    let idx = Math.floor(((e.clientX - b.left) / b.width) * n)
    idx = Math.max(0, Math.min(n - 1, idx))
    const barsLeft = b.left - p.left
    const centerX = barsLeft + ((idx + 0.5) / n) * b.width
    const badgeLeft = Math.max(barsLeft + BADGE_HALF, Math.min(barsLeft + b.width - BADGE_HALF, centerX))
    setScrub({ idx, left: centerX, badgeLeft })
  }

  const onPointerDown = (e) => { startXRef.current = e.clientX; movedRef.current = false; updateScrub(e) }
  const onPointerMove = (e) => {
    updateScrub(e)
    if (Math.abs(e.clientX - startXRef.current) > 8) movedRef.current = true
  }
  const endScrub = () => setScrub(null)

  return (
    <div>
      {/* Legende: was bedeutet grün vs. grau */}
      <div className="flex items-center gap-4 mb-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary" /> dabei
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-neutral-300 dark:bg-neutral-600" /> nicht dabei
        </span>
      </div>

      {/* Plot-Bereich: Kopf + Balken. Fängt die Zeiger-Bewegung fürs Fadenkreuz ab.
          touch-action: pan-y → senkrechtes Seiten-Scrollen bleibt möglich, das
          waagerechte Wischen gehört uns. */}
      <div
        ref={plotRef}
        className="relative"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') endScrub() }}
        onPointerUp={(e) => { if (e.pointerType !== 'mouse') endScrub() }}
        onPointerCancel={endScrub}
      >
        {/* Kopfzeile: Spacer über der Namensspalte + feste Datumslabels an jeder
            k-ten Position (absolut per Prozent, mittig über „ihrem" Segment). */}
        <div className="flex mb-1">
          <div style={{ width: NAME_W }} className="shrink-0" />
          <div ref={barsRef} className="relative flex-1 h-3.5">
            {sessions.map((s, i) =>
              i % step === 0 ? (
                <span
                  key={s.id}
                  className="absolute -translate-x-1/2 text-[9px] leading-none text-muted-foreground whitespace-nowrap tabular-nums"
                  style={{ left: `${((i + 0.5) / n) * 100}%` }}
                >
                  {shortDay(s.date)}
                </span>
              ) : null,
            )}
          </div>
        </div>

        {/* Eine Zeile je Person: Name links, durchgehender Präsenz-Balken rechts. */}
        <div className="space-y-1.5">
          {rows.map(row => {
            const open = openId === row.id
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => { if (!movedRef.current) setOpenId(open ? null : row.id) }}
                aria-expanded={open}
                className="flex items-center w-full text-left"
              >
                <div style={{ width: NAME_W }} className="shrink-0 flex items-center gap-1.5 pr-2">
                  <PlayerAvatar player={{ name: row.name, avatar_url: row.avatarUrl }} size="xs" style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span className="text-xs font-medium truncate">{row.name}</span>
                </div>
                {/* Der Balken: ein Segment je Abend, direkt aneinander, gemeinsame
                    runde Enden über overflow-hidden. */}
                <div className={`flex-1 flex h-5 rounded-sm overflow-hidden ${open ? 'ring-2 ring-primary/40' : ''}`}>
                  {row.present.map((p, i) => (
                    <span
                      key={i}
                      className={`flex-1 min-w-0 ${p ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Beim Wischen: das genaue Datum der aktiven Spalte, hervorgehoben – am
            Balken-Rand festgeklemmt (badgeLeft), damit es nicht übersteht. */}
        {scrub && (
          <span
            className="absolute top-0 -translate-x-1/2 px-1 rounded bg-foreground text-background text-[9px] leading-tight font-medium whitespace-nowrap tabular-nums z-20 pointer-events-none"
            style={{ left: scrub.badgeLeft }}
          >
            {fullDate(sessions[scrub.idx].date)}
          </span>
        )}

        {/* Senkrechter Fadenkreuz-Strich über Kopf + alle Balken (nicht über die
            Namensspalte, weil er in der Balken-Region liegt). Fängt keine Klicks ab. */}
        {scrub && (
          <div
            className="absolute top-0 bottom-0 w-px bg-foreground/60 pointer-events-none z-10"
            style={{ left: scrub.left }}
          />
        )}
      </div>

      {/* Detailzeile (Tap): kompakte Anwesenheits-Biografie der getippten Person */}
      {sel && (
        <div className="mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/70">{sel.name}</span>{' '}
          war an <span className="tabular-nums">{sel.total}</span> von{' '}
          <span className="tabular-nums">{n}</span> Abenden dabei
          {sel.firstDate && (
            <> · von {fullDate(sel.firstDate)} bis {fullDate(sel.lastDate)}</>
          )}
        </div>
      )}
    </div>
  )
}
