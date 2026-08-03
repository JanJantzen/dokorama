// PlayerProfile – der Spieler-Steckbrief (Block C, Tier 2, Phase 10)
//
// Der „Konvergenzpunkt": egal von wo man auf einen Namen tippt (Verzeichnis,
// Rangliste, Partie-Steckbrief …), man landet immer auf dieser einen Seite.
//
// Aufbau (Konzept, Abschnitte A–F):
//   A Kopf        – Avatar, Name, „X Partien"                    ← Phase 10.1 (hier)
//   B Gesamtscore – Gesamt/Schnitt + eigener Rang                ← Phase 10.2
//   C Meine Werte – je Kennzahl Wert + Rang (Medaille bei 1–3)   ← Phase 10.2
//   D Spielstil   – Reizhöhe/Lieblings-Solo/Mut-vs-Können        ← Phase 11/12
//   E Teamplay    – beste:r Partner:in, härteste:r Gegner:in     ← Tier 4
//   F Hall of Fame– Rekordhalter                                 ← Tier 3
//
// Stand Phase 10.1: nur der Kopf (A) ist echt; die restlichen Abschnitte kommen in
// 10.2 (B/C) bzw. mit ihren Quell-Blöcken. Die Ränge werden später intern über das
// ganze Feld (im gewählten Zeitraum) gerechnet – der Personen-Filter bleibt hier
// bewusst außen vor, nur der Zeitraum-Filter gilt.

import { ChevronLeft } from 'lucide-react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'

// player: { id, name, avatarUrl }; partien: A1-Zähler im Zeitraum; onBack: zurück
// zum Verzeichnis.
export default function PlayerProfile({ player, partien, onBack }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Zurück aufs Verzeichnis (Ebene: Übersicht / Personen / Name) */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground -mb-2"
      >
        <ChevronLeft size={18} />
        <span>Personen</span>
        <span className="mx-1 text-border">/</span>
        <span className="text-foreground font-medium">{player.name}</span>
      </button>

      {/* ── A – Kopf/Identität ── */}
      <div className="flex items-center gap-4">
        <PlayerAvatar player={{ name: player.name, avatar_url: player.avatarUrl }} size="xl" />
        <div>
          <h2 className="text-xl font-bold tracking-tight">{player.name}</h2>
          <p className="text-sm text-muted-foreground">
            {partien} {partien === 1 ? 'Partie' : 'Partien'}
          </p>
        </div>
      </div>

      {/* Platzhalter für die noch folgenden Abschnitte (B/C in Phase 10.2). */}
      <p className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
        Gesamtscore, eigene Werte und Ränge folgen im nächsten Schritt (Phase 10.2).
      </p>
    </div>
  )
}
