// useWakeLock – verhindert, dass der Bildschirm sich sperrt
//
// Nutzt die Screen Wake Lock API (https://w3c.github.io/screen-wake-lock/).
// Wird in der Komponente so aufgerufen: useWakeLock()
// Kein Rückgabewert nötig – der Hook verwaltet alles selbst.
//
// Wichtig: Das Wake Lock wird vom Browser freigegeben, wenn der Nutzer die
// App in den Hintergrund schiebt. Deshalb hört der Hook auf das
// visibilitychange-Event und fordert es beim Zurückkehren neu an.

import { useEffect, useRef } from 'react'

export function useWakeLock() {
  // Ref statt State – wir brauchen kein Re-Render, nur die Referenz auf das Lock-Objekt
  const wakeLockRef = useRef(null)

  useEffect(() => {
    // Ältere Browser (z.B. Firefox Desktop) unterstützen die API nicht
    if (!('wakeLock' in navigator)) return

    async function acquire() {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // Kann fehlschlagen wenn z.B. der Akku sehr niedrig ist – kein Absturz
      }
    }

    // Wenn der Nutzer zurück zur App kommt, muss das Lock neu angefordert werden
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        acquire()
      }
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      // Lock freigeben wenn die Komponente verlassen wird (z.B. Partie beendet)
      wakeLockRef.current?.release()
      wakeLockRef.current = null
    }
  }, [])
}
