// EyesBar – Fixe untere Leiste für die Augeneingabe
// Immer sichtbar auf dem Tischscreen: Zahlenfeld + Re/Ko-Toggle + Auswerten-Button
// Der Auswerten-Button ist erst aktiv wenn Teams vollständig und Augen eingegeben sind.

import { ChevronRight } from 'lucide-react'

export default function EyesBar({
  eyesInput,       // string (rohe Eingabe)
  eyesFor,         // 're' | 'kontra' | null
  onEyesChange,    // (value: string) → void
  onEyesForChange, // (party: 're' | 'kontra') → void
  onEvaluate,      // () → void – öffnet den Auswertungs-Screen
  isValid,         // boolean – ob Auswerten aktivierbar ist
}) {
  // Zeige den abgeleiteten Gegenwert wenn Augen eingegeben
  const eyesNum = parseInt(eyesInput)
  const isNumeric = !isNaN(eyesNum) && eyesInput !== ''
  const otherEyes = isNumeric ? 240 - eyesNum : null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 pt-3 pb-5">
      <div className="flex items-center gap-2">
        {/* Augeneingabe */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={240}
            value={eyesInput}
            onChange={e => onEyesChange(e.target.value)}
            placeholder="Augen"
            className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-base font-medium text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />

          {/* Re/Kontra-Toggle für die Augenzahl */}
          <div className="flex rounded-xl border border-border overflow-hidden h-10">
            {['re', 'kontra'].map(party => (
              <button
                key={party}
                onClick={() => onEyesForChange(party)}
                className={`px-3 h-full text-sm font-medium transition-colors ${
                  eyesFor === party
                    ? party === 're'
                      ? 'bg-green-700 text-white'
                      : 'bg-amber-500 text-white'
                    : 'bg-background text-muted-foreground'
                }`}
              >
                {party === 're' ? 'Re' : 'Ko'}
              </button>
            ))}
          </div>
        </div>

        {/* Auswerten-Button */}
        <button
          onClick={isValid ? onEvaluate : undefined}
          disabled={!isValid}
          className={`flex items-center gap-1 h-10 px-4 rounded-xl font-medium text-sm transition-colors ${
            isValid
              ? 'bg-primary text-primary-foreground active:bg-primary/80'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Auswerten
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
