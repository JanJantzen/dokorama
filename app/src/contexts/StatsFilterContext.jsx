// StatsFilterContext – der globale Zeitraum-Filter für alle Statistiken (Block C, Tier 1, Phase 2)
//
// Alle Auswertungen auf der Statistik-Seite sollen sich über EINEN Umschalter
// auf einen Zeitraum eingrenzen lassen. Dieser Context hält diese eine Wahl
// zentral, damit jede künftige Kennzahl automatisch mitzieht, ohne dass wir sie
// einzeln verdrahten müssen.
//
// Vier Modi (Entscheidung Jan, 22.07.2026):
//   • 'currentYear' – das laufende Kalenderjahr. WICHTIG: gespeichert wird der
//                     Modus, NICHT die Jahreszahl. So springt die Ansicht nach
//                     dem Jahreswechsel automatisch auf das neue Jahr, statt am
//                     dann vergangenen Jahr zu kleben.
//   • 'year'        – ein fest gewähltes, vergangenes Jahr (period.year)
//   • 'range'       – ein frei gewählter Zeitraum von–bis (period.from/period.to,
//                     jeweils ISO 'YYYY-MM-DD'; eine Grenze darf offen bleiben)
//   • 'total'       – die gesamte Historie (keine Grenzen)
//
// Die Wahl wird in localStorage gemerkt (Entscheidung Jan, 22.07.2026), damit
// sie einen App-Neustart überlebt. Default beim allerersten Öffnen: 'currentYear'.

import { createContext, useContext, useEffect, useState } from 'react'

const StatsFilterContext = createContext(null)

// Unter diesem Schlüssel liegt die gemerkte Wahl im Browser.
const STORAGE_KEY = 'dokorama.statsPeriod'

// Der Ausgangszustand, wenn noch nichts gemerkt wurde: laufendes Jahr.
const DEFAULT_PERIOD = { mode: 'currentYear' }

// ── Reine Umrechnungen (kein React, leicht testbar) ──

// Modus-Objekt → Datumsgrenzen { from, to } als ISO-Strings (inklusive).
// null bedeutet "offen" (keine untere bzw. obere Grenze). Diese Grenzen füttern
// den Filter in lib/stats.js. String-Vergleich auf 'YYYY-MM-DD' funktioniert,
// weil dieses Format lexikografisch = chronologisch sortiert.
export function resolveRange(period) {
  const y = new Date().getFullYear()
  switch (period.mode) {
    case 'total':       return { from: null, to: null }
    case 'currentYear': return { from: `${y}-01-01`, to: `${y}-12-31` }
    case 'year':        return { from: `${period.year}-01-01`, to: `${period.year}-12-31` }
    case 'range':       return { from: period.from ?? null, to: period.to ?? null }
    default:            return { from: `${y}-01-01`, to: `${y}-12-31` }
  }
}

// ISO 'YYYY-MM-DD' → deutsches 'DD.MM.YYYY' (für die Kontextzeile).
function deDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

// Modus-Objekt → menschenlesbarer Zeitraum-Text für die Kontextzeile.
// Genau hier steht der Hinweis „laufendes Jahr" – nah an den Zahlen, die sich
// dadurch noch verändern (Entscheidung Jan, 22.07.2026).
export function resolveLabel(period) {
  const y = new Date().getFullYear()
  switch (period.mode) {
    case 'total':       return 'gesamte Historie'
    case 'currentYear': return `${y} (laufendes Jahr)`
    case 'year':        return String(period.year)
    case 'range': {
      const { from, to } = period
      if (from && to) return `${deDate(from)} – ${deDate(to)}`
      if (from)       return `ab ${deDate(from)}`
      if (to)         return `bis ${deDate(to)}`
      return 'gesamte Historie' // beide Grenzen leer = faktisch alles
    }
    default: return `${y} (laufendes Jahr)`
  }
}

export function StatsFilterProvider({ children }) {
  // Beim ersten Rendern versuchen, die gemerkte Wahl aus localStorage zu lesen.
  // Schlägt das fehl (privater Modus, kaputter Eintrag), nehmen wir den Default.
  const [period, setPeriod] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* localStorage nicht verfügbar → Default */ }
    return DEFAULT_PERIOD
  })

  // Jede Änderung der Wahl wieder zurückspeichern.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(period))
    } catch { /* Speichern nicht möglich → einfach nicht merken */ }
  }, [period])

  // Abgeleitete Größen einmal hier berechnen, damit alle Verbraucher dieselben
  // Werte sehen: die Datumsgrenzen (für den Filter) und den Anzeigetext.
  const range = resolveRange(period)
  const label = resolveLabel(period)

  return (
    <StatsFilterContext.Provider value={{ period, setPeriod, range, label }}>
      {children}
    </StatsFilterContext.Provider>
  )
}

// Kurzform: const { period, setPeriod, range, label } = useStatsFilter()
export function useStatsFilter() {
  return useContext(StatsFilterContext)
}
