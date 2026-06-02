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

  // Tab-Bar nur auf den drei Haupt-Tabs anzeigen, auf allen anderen Seiten ausblenden
  const showTabBar = ['/', '/statistiken', '/spieler'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/"              element={<HomePage />}        />
        <Route path="/statistiken"   element={<StatsPage />}       />
        <Route path="/spieler"       element={<PlayersPage />}     />
        <Route path="/partie/starten" element={<StartSessionPage />} />
        <Route path="/abend/:id"     element={<SessionPage />}     />
      </Routes>

      {showTabBar && <TabBar />}
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
