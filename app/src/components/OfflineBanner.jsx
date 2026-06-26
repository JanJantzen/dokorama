// OfflineBanner.jsx – zeigt einen Hinweis wenn das Gerät offline ist
// Reagiert auf die Browser-Events "offline" und "online" in Echtzeit.
// Kein State-Management nötig: window.navigator.onLine ist der Startpunkt,
// danach hören wir auf die Events und aktualisieren den lokalen State.

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine)

  useEffect(() => {
    const handleOffline = () => setIsOffline(true)
    const handleOnline  = () => setIsOffline(false)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-[500px] bg-amber-500 text-white px-4 py-2 flex items-center gap-2 text-sm font-medium pointer-events-auto">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>Kein Internet – neue Spiele können nicht gespeichert werden.</span>
      </div>
    </div>
  )
}
