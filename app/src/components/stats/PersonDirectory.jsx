// PersonDirectory – das Personen-Verzeichnis (Block C, Tier 2, Phase 10.1)
//
// Einer der Top-Level-Einstiege der Statistik-Navigation: eine schlichte Liste
// ALLER Spieler:innen, die im gewählten Zeitraum dabei waren. Sie hat selbst
// keine eigene Kennzahl – als Sortier- und Anzeigewert wird A1 (Anzahl gespielter
// Partien) wiederverwendet (Konzept: „Robert – 87 Partien"), absteigend, damit
// Stammspieler:innen oben und Gelegenheitsgäste unten stehen.
//
// Jede Zeile ist tappbar und führt zum Spieler-Steckbrief dieser Person – das ist
// der „Konvergenzpunkt": von hier (und von jedem Namen in den Statistiken) landet
// man immer auf derselben einen Steckbrief-Seite.

import { ChevronRight } from 'lucide-react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// entries: [{ id, name, avatarUrl, partien }], bereits sortiert (Partien absteigend).
// onOpen(id): öffnet den Steckbrief der angetippten Person.
export default function PersonDirectory({ entries, onOpen }) {
  if (!entries || entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center mt-4">
        In diesem Zeitraum hat niemand gespielt.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {entries.map(p => (
        <li key={p.id}>
          <button
            onClick={() => onOpen(p.id)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors text-left"
          >
            <PlayerAvatar player={{ name: p.name, avatar_url: p.avatarUrl }} size="sm" />
            <span className="font-medium truncate">{p.name}</span>
            {/* A1 als Sortier-/Anzeigewert – rechtsbündig, in gedämpfter Schrift */}
            <span className="ml-auto text-sm text-muted-foreground tabular-nums whitespace-nowrap">
              {p.partien} {p.partien === 1 ? 'Partie' : 'Partien'}
            </span>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </button>
        </li>
      ))}
    </ul>
  )
}
