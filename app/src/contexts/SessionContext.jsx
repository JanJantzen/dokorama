// SessionContext – Zustand der laufenden Partie
//
// Läuft die gesamte Partie durch (mehrere Runden, viele Spiele).
// Hält: Partie-Daten, Teilnehmer, aktuelle Spielnummer, View-Steuerung.
// GameContext ist innerhalb dieses Contexts verschachtelt.

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { calcSeatStatus } from '@/lib/seatUtils'
import { loadRoundProgress } from '@/lib/rounds'

// Exportiert, damit der Edit-Modus (EditGamePage) einen schlanken eigenen Context-Wert
// bereitstellen kann (nur participants + showEvaluation, mehr braucht TableView nicht).
export const SessionContext = createContext(null)

export function SessionProvider({ children, sessionId }) {
  const [sessionData,    setSessionData]    = useState(null)
  const [roundData,      setRoundData]      = useState(null)
  const [participants,   setParticipants]   = useState([])
  const [gameNumber,     setGameNumber]     = useState(1)
  const [loading,        setLoading]        = useState(true)
  const [noActiveRound,  setNoActiveRound]  = useState(false) // Partie ohne laufende Runde (nicht spielbar)

  // erfassungsView: welche Erfassungs-Ansicht der Nutzer zuletzt gewählt hat ('table' | 'block')
  // activeView: was gerade angezeigt wird – kann auch 'evaluate' sein
  const [erfassungsView, setErfassungsView] = useState('table')
  const [activeView,     setActiveView]     = useState('table')

  const [evalResult,     setEvalResult]     = useState(null)
  const [saving,         setSaving]         = useState(false)
  const [showMenu,       setShowMenu]       = useState(false)

  // Partie-Daten und erste Spielnummer laden
  useEffect(() => {
    async function load() {
      const { data: session } = await supabase
        .from('sessions').select('*, venues(name)').eq('id', sessionId).single()
      const { data: round } = await supabase
        .from('rounds').select('*').eq('session_id', sessionId).eq('status', 'laufend')
        .order('number', { ascending: false }).limit(1).maybeSingle()

      // Keine laufende Runde (abgeschlossene/inkonsistente Partie) → nicht spielbar,
      // statt mit round.id abzustürzen sauber abfangen.
      if (!round) {
        setSessionData(session)
        setNoActiveRound(true)
        setLoading(false)
        return
      }

      const { data: parts } = await supabase
        .from('round_participations').select('*, players(id, name, avatar_url)')
        .eq('round_id', round.id).order('seat_position')

      // played = bereits gespeicherte Spiele, announcedSolos = davon angesagte Solos
      // (halten die Geber-Rotation an). Beide aus der DB, überlebt Reload mitten in der Runde.
      const { played, announcedSolos } = await loadRoundProgress(round.id, parts.length)

      const nextGameNum = played + 1
      setSessionData(session)
      setRoundData(round)
      setParticipants(calcSeatStatus(parts, nextGameNum, announcedSolos))
      setGameNumber(nextGameNum)
      setLoading(false)
    }
    load()
  }, [sessionId])

  // Sitzstatus neu berechnen (nach jedem gespeicherten Spiel) – gibt neue Teilnehmer zurück.
  // solosBefore = angesagte Solos in den bisherigen Spielen der Runde (halten den Geber an).
  const refreshSeatStatus = useCallback((num, rawParts, solosBefore = 0) => {
    const updated = calcSeatStatus(rawParts, num, solosBefore)
    setParticipants(updated)
    return updated
  }, [])

  // Nächste Runde starten: aktuelle Runde abschließen, neue Runde + Teilnahmen anlegen
  // (gleiche Spieler:innen & Sitzpositionen), Context auf Spiel 1 der neuen Runde setzen.
  // Gibt die neuen Teilnehmer (mit Sitzstatus) zurück, damit der/die Aufrufer:in den
  // GameContext zurücksetzen kann.
  const advanceToNextRound = useCallback(async () => {
    // 1) Aktuelle Runde abschließen
    await supabase.from('rounds').update({ status: 'abgeschlossen' }).eq('id', roundData.id)

    // 2) Neue Runde anlegen
    const { data: newRound } = await supabase
      .from('rounds')
      .insert({ session_id: sessionData.id, number: roundData.number + 1, status: 'laufend' })
      .select().single()

    // 3) Teilnahmen übernehmen (gleiche Spieler:innen & Sitzpositionen)
    const { data: newParts } = await supabase
      .from('round_participations')
      .insert(participants.map(p => ({
        round_id: newRound.id, player_id: p.player_id, seat_position: p.seat_position,
      })))
      .select('*, players(id, name, avatar_url)')
    newParts.sort((a, b) => a.seat_position - b.seat_position)

    // 4) Context auf Spiel 1 der neuen Runde setzen
    const seated = calcSeatStatus(newParts, 1)
    setRoundData(newRound)
    setParticipants(seated)
    setGameNumber(1)
    return seated
  }, [roundData, sessionData, participants])

  // Wechselt zwischen Tisch- und Block-Ansicht (nur wenn nicht im Auswertungs-Screen)
  const switchErfassungsView = useCallback(() => {
    setErfassungsView(prev => {
      const next = prev === 'table' ? 'block' : 'table'
      setActiveView(next)
      return next
    })
  }, [])

  // Öffnet den Auswertungs-Screen mit dem berechneten Ergebnis
  const showEvaluation = useCallback((result) => {
    setEvalResult(result)
    setActiveView('evaluate')
  }, [])

  // Schließt Auswertungs-Screen und kehrt zur zuletzt aktiven Erfassungs-Ansicht zurück
  const backToErfassung = useCallback(() => {
    setEvalResult(null)
    setActiveView(erfassungsView)
  }, [erfassungsView])

  return (
    <SessionContext.Provider value={{
      sessionData, roundData, participants, gameNumber, loading, noActiveRound,
      erfassungsView, activeView,
      switchErfassungsView, showEvaluation, backToErfassung,
      evalResult, saving, setSaving,
      showMenu, setShowMenu,
      setGameNumber, refreshSeatStatus, advanceToNextRound,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession muss innerhalb von SessionProvider verwendet werden')
  return ctx
}
