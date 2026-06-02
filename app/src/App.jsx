// App.jsx – Einstiegspunkt der React-App
// Hier wird das Routing definiert: welche URL zeigt welche Seite?
// Die Tab-Bar wird ausgeblendet wenn ein Abend aktiv ist (Vollbild-Erfassung).

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import TabBar from '@/components/layout/TabBar'
import HomePage from '@/pages/HomePage'
import StatsPage from '@/pages/StatsPage'
import PlayersPage from '@/pages/PlayersPage'
import SessionPage from '@/pages/SessionPage'
import StartSessionPage from '@/pages/StartSessionPage'

// AppLayout liest die aktuelle URL und entscheidet ob die Tab-Bar sichtbar ist
function AppLayout() {
  const location = useLocation()

  // Auf allen /abend-Seiten (Setup + Erfassung) wird die Tab-Bar ausgeblendet
  const isSessionActive = location.pathname.startsWith('/abend')

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/"              element={<HomePage />}        />
        <Route path="/statistiken"   element={<StatsPage />}       />
        <Route path="/spieler"       element={<PlayersPage />}     />
        <Route path="/abend/starten" element={<StartSessionPage />} />
        <Route path="/abend/:id"     element={<SessionPage />}     />
      </Routes>

      {/* Tab-Bar nur außerhalb der Spielerfassung anzeigen */}
      {!isSessionActive && <TabBar />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
