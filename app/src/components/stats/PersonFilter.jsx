// PersonFilter – der globale Personen-Umschalter für die Statistiken (Tier 2, Phase 9)
//
// Zwilling zum PeriodFilter, nur nach "wer" statt "wann". Angezeigt werden dann
// NUR die gewählten Personen (nie unbeteiligte Dritte). Bei MEHREREN Gewählten
// gibt es zwei Lesarten (Modus-Umschalter, erst ab 2 Personen sichtbar):
//   • Gemeinsame Spiele – nur Spiele, in denen ALLE dabei waren (Head-to-Head am
//                         selben Tisch). Default.
//   • Ganze Historie    – jede Person über ihr gesamtes Spiel-Konto.
// Die eigentliche Filterlogik steckt in filterByPersons / der Anzeige-Auswahl in
// StatsPage; diese Komponente ist nur die Bedienung.
//
// Layout (Entscheidung Jan): AUSKLAPPBAR, damit es bei 10–15 Personen nicht
// überfrachtet. Ist kein Filter aktiv, steht nur eine schlanke Auslöser-Zeile;
// beim Antippen klappt das volle, umbrechende Avatar-Raster auf.
//
// Die wählbaren Personen kommen als Prop `players` von der Seite (aus den vollen,
// ungefilterten Daten, vorsortiert nach „meiste Partien"), damit die häufig
// gewählten Stammspieler:innen zuerst stehen.

import { useState } from 'react'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'
import { useStatsFilter } from '@/contexts/StatsFilterContext'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// Baut den menschenlesbaren Auswahl-Text für die Kontextzeile.
function personNames(players, personIds) {
  return players.filter(p => personIds.includes(p.id)).map(p => p.name)
}

// Ein Segment des Modus-Umschalters (aktiv = gefüllt).
function ModeButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${
        active
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

export default function PersonFilter({ players }) {
  const { personIds, togglePerson, clearPersons, personMode, setPersonMode } = useStatsFilter()
  const active = personIds.length > 0

  // Auf beim ersten Rendern nur, wenn bereits ein Filter aktiv ist (sonst schlank).
  const [open, setOpen] = useState(active)

  const names = personNames(players, personIds)

  // ── Zugeklappt: schlanke Auslöser-Zeile ──
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        <Users size={16} className="shrink-0" />
        {active ? (
          <span className="text-foreground font-medium truncate">
            Personen: {names.join(' + ')}
          </span>
        ) : (
          <span>Nach Personen filtern</span>
        )}
        <ChevronDown size={16} className="ml-auto shrink-0" />
      </button>
    )
  }

  // ── Aufgeklappt: volles Avatar-Raster + Modus + Kontextzeile ──
  return (
    <div className="rounded-lg border border-border p-3">
      {/* Kopfzeile mit Zuklapp-Pfeil */}
      <button
        onClick={() => setOpen(false)}
        className="w-full flex items-center gap-2 text-sm text-muted-foreground mb-3"
      >
        <Users size={16} className="shrink-0" />
        <span>Nach Personen filtern</span>
        <ChevronUp size={16} className="ml-auto shrink-0" />
      </button>

      {/* Umbrechendes Avatar-Raster – nichts versteckt, alle sichtbar */}
      <div className="flex flex-wrap gap-3">
        {players.map(p => {
          const on = personIds.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => togglePerson(p.id)}
              className="flex flex-col items-center gap-1 w-14"
              aria-pressed={on}
            >
              <div
                className={`rounded-full transition-all ${
                  on
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'opacity-45'
                }`}
              >
                <PlayerAvatar player={{ name: p.name, avatar_url: p.avatarUrl }} size="sm" />
              </div>
              <span
                className={`text-xs truncate max-w-full ${
                  on ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {p.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Modus-Umschalter – erst ab 2 Personen (bei einer Person identisch) */}
      {personIds.length >= 2 && (
        <div className="flex mt-3 p-0.5 rounded-lg bg-muted">
          <ModeButton active={personMode === 'common'} onClick={() => setPersonMode('common')}>
            Gemeinsame Spiele
          </ModeButton>
          <ModeButton active={personMode === 'total'} onClick={() => setPersonMode('total')}>
            Ganze Historie
          </ModeButton>
        </div>
      )}

      {/* Kontextzeile: die aktive Auswahl in Worten (+ „leeren") */}
      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
        <span>
          Personen:{' '}
          {names.length === 0
            ? 'alle'
            : names.length === 1
              ? `nur ${names[0]}`
              : `nur ${names.join(' + ')} (${personMode === 'common' ? 'gemeinsame Spiele' : 'je ganze Historie'})`}
        </span>
        {active && (
          <button onClick={clearPersons} className="underline hover:text-foreground whitespace-nowrap">
            Alle Personen
          </button>
        )}
      </p>
    </div>
  )
}
