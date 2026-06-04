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
    // Äußerer Wrapper: füllt den Screen, zentriert die App-Spalte, bg-muted als Hintergrund
    // auf Tablets/Desktop wo die App-Spalte schmaler als der Screen ist
    <div className="min-h-screen bg-muted flex justify-center">
      <div className="w-full max-w-[500px] bg-background relative min-h-screen">
        <Routes>
          <Route path="/"               element={<HomePage />}         />
          <Route path="/statistiken"    element={<StatsPage />}        />
          <Route path="/spieler"        element={<PlayersPage />}      />
          <Route path="/partie/starten" element={<StartSessionPage />} />
          <Route path="/partie/:id"     element={<SessionPage />}      />
        </Routes>
        {showTabBar && <TabBar />}
      </div>
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
