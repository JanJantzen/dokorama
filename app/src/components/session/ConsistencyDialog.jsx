// ConsistencyDialog – die generische Anzeige für jeden Auflösungs-Dialog
//
// Diese Komponente enthält KEINE Logik – sie zeigt nur, was die zentrale
// Konsistenz-Engine (GameContext) gerade als offenen Dialog hinterlegt hat
// (Trennung nach Prinzip P7: zentral = was/welche Optionen, Ansicht = nur zeigen).
//
// Festes Format aus Teil C der KONSISTENZREGELN.md:
//   • Meldung in ZWEI Teilen:  "Was geht nicht?" (fett) / "Warum nicht?" (darunter)
//   • eine Optionen-Liste: jede Option hat einen Knopftext und einen Subtitle,
//     der die Konsequenz beschreibt – einzeilig oder als Liste mehrerer Zeilen.
//
// Dialog-Deskriptor (so liefert ihn die Engine):
//   {
//     was:    'Kathrin kann nicht Re sagen.',
//     warum:  'Kathrins Partner Robert hat bereits Re gesagt.',
//     options: [
//       { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.', onSelect, keepOpen? },
//       { label: 'Korrektur', subtitle: ['Kathrin sagt Re', 'Roberts …'], onSelect },
//     ],
//   }
//
// Die Reihenfolge der Optionen im Array ist die Anzeige-Reihenfolge (Konvention
// "Abbrechen zuerst", bei Richtungswahl-Dialogen "Abbrechen zuletzt" – das
// entscheidet die Engine beim Bauen der Liste, nicht diese Komponente).

import { useGame } from '@/contexts/GameContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export default function ConsistencyDialog() {
  const { dialog, closeDialog } = useGame()

  // Klick auf eine Option: ihre Wirkung ausführen, dann schließen – außer die
  // Option will offen bleiben (keepOpen, z.B. wenn ein Folge-Schritt wie eine
  // "von wem?"-Auswahl direkt anschließt; kommt erst in späteren Teilen vor).
  function handleSelect(option) {
    option.onSelect?.()
    if (!option.keepOpen) closeDialog()
  }

  return (
    <Dialog
      open={!!dialog}
      // Schließen über Backdrop/Escape = folgenloser Abbruch (wie "Abbrechen").
      onOpenChange={(open) => { if (!open) closeDialog() }}
    >
      {dialog && (
        // showCloseButton aus: der Abbruch läuft ausschließlich über die Optionen.
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            {/* Teil 1 der Meldung: Was geht nicht? */}
            <DialogTitle>{dialog.was}</DialogTitle>
            {/* Teil 2 der Meldung: Warum nicht? */}
            {dialog.warum && <DialogDescription>{dialog.warum}</DialogDescription>}
          </DialogHeader>

          {/* Optionen-Liste */}
          <div className="flex flex-col gap-2">
            {dialog.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                className="w-full text-left rounded-xl border border-border bg-background px-4 py-3 active:bg-muted"
              >
                <span className="block text-sm font-semibold text-foreground">
                  {option.label}
                </span>
                {option.subtitle && (
                  Array.isArray(option.subtitle) ? (
                    <ul className="mt-1 space-y-0.5">
                      {option.subtitle.map((line, j) => (
                        <li key={j} className="text-xs text-muted-foreground">{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {option.subtitle}
                    </span>
                  )
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
