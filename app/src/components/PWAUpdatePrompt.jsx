// PWAUpdatePrompt.jsx – kümmert sich darum, dass installierte App-Versionen
// (Homescreen-PWA) tatsächlich neue Deploys mitbekommen.
//
// HINTERGRUND: Der Service Worker bedient die App aus einem Cache. Eine neue
// Version kommt nur an, wenn der Browser (a) die neue sw.js bemerkt und
// (b) die Seite neu lädt. Am Desktop prüft Chrome das bei jedem Aufruf – eine
// auf dem iPhone-Homescreen installierte PWA prüft aber von selbst so gut wie
// nie. Deshalb machen wir das hier AKTIV:
//
//   1. useRegisterSW registriert den Service Worker und ruft onRegisteredSW auf,
//      sobald er bereit ist.
//   2. Dort prüfen wir aktiv auf neue Versionen: sofort, dann stündlich, und –
//      am wichtigsten für iOS – jedes Mal, wenn die App wieder in den
//      Vordergrund kommt (visibilitychange). registration.update() lädt die
//      sw.js frisch (am Browser-Cache vorbei) und erkennt so neue Deploys.
//   3. Findet der Service Worker eine neue Version, wartet er (registerType
//      'prompt' → kein automatisches Neuladen). needRefresh wird true, und wir
//      zeigen ein Banner. Erst ein Tipp darauf lädt die neue Version (via
//      updateServiceWorker(true)) – so nie ein Neuladen mitten in der Erfassung.

import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// Wie oft (in ms) soll die geöffnete App nach einer neuen Version schauen?
const CHECK_INTERVAL = 60 * 60 * 1000 // stündlich

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      // Aktiv nach neuen Versionen suchen: periodisch …
      setInterval(() => registration.update(), CHECK_INTERVAL)

      // … und immer, wenn die App wieder sichtbar wird (App-Wechsel, Entsperren).
      // Genau das fehlt iOS-PWAs von Haus aus.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update()
      })
    },
  })

  // Kein Update bereit → nichts anzeigen.
  if (!needRefresh) return null

  // Update-Banner (gleiche Position/Breite wie das OfflineBanner, aber tippbar).
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <button
        onClick={() => updateServiceWorker(true)}
        className="w-full max-w-[500px] bg-primary text-primary-foreground px-4 py-2 flex items-center gap-2 text-sm font-medium pointer-events-auto"
      >
        <RefreshCw className="h-4 w-4 shrink-0" />
        <span>Neue Version verfügbar – tippen zum Aktualisieren</span>
      </button>
    </div>
  )
}
