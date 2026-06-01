// TabBar – die untere Navigation der App
// Wird nur angezeigt wenn kein aktiver Abend läuft (Vollbild-Erfassung).
// "pb-safe" sorgt dafür dass die Bar nicht hinter dem iPhone-Home-Balken verschwindet.

import { NavLink } from 'react-router-dom'
import { Home, BarChart2, Users } from 'lucide-react'

const tabs = [
  { to: '/',             icon: Home,     label: 'Übersicht'   },
  { to: '/statistiken',  icon: BarChart2, label: 'Statistiken' },
  { to: '/spieler',      icon: Users,    label: 'Spieler'     },
]

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              // Aktiver Tab bekommt die Primärfarbe, inaktive bleiben gedimmt
              `flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
