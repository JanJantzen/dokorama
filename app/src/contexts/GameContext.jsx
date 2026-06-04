// GameContext – Zustand eines einzelnen Spiels während der Erfassung
//
// Lebt nur für ein Spiel: wird nach Bestätigung via resetForNextGame() zurückgesetzt.
// Alle Mutations-Handler (Parteien, Ansagen, Sonderpunkte etc.) leben hier.
// Wird innerhalb von SessionProvider gemountet, sobald die Teilnehmer geladen sind.

import { createContext, useContext, useRef, useState, useCallback } from 'react'
import { deriveGameType } from '@/lib/scoreCalculation'

const GameContext = createContext(null)

// ─── Reine Hilfsfunktionen (kein React-State) ─────────────────────────────────

function initGameState(participants) {
  const parties = {}
  const announcements = {}
  for (const p of participants) {
    parties[p.player_id] = p.isSitting ? 'ausgesetzt' : null
    announcements[p.player_id] = []
  }
  return {
    parties, announcements,
    specialRoles: {}, soloType: null, soloColor: null,
    specialPoints: [], eyesInput: '', eyesFor: null,
  }
}

// Gibt true wenn Teams vollständig zugeordnet UND Augen eingegeben sind
export function isGameValid(gameState, participants) {
  const active  = participants.filter(p => !p.isSitting)
  const reCount = active.filter(p => gameState.parties[p.player_id] === 're').length
  const koCount = active.filter(p => gameState.parties[p.player_id] === 'kontra').length
  const hasSolo = Object.values(gameState.specialRoles).some(r => r === 'solist')
  const teamsOk = hasSolo ? reCount === 1 && koCount === 3 : reCount === 2 && koCount === 2
  const eyesOk  = gameState.eyesInput !== '' && !isNaN(parseInt(gameState.eyesInput)) && gameState.eyesFor !== null
  return teamsOk && eyesOk
}

// Baut das Eingabe-Objekt für calculateGameResult() auf
export function buildCalculationInput(gameState, participants) {
  const eyesNum       = parseInt(gameState.eyesInput)
  const reEyes        = gameState.eyesFor === 're' ? eyesNum : 240 - eyesNum
  const announcements = []
  for (const [playerId, types] of Object.entries(gameState.announcements)) {
    const party = gameState.parties[playerId]
    if (!party || party === 'ausgesetzt') continue
    for (const type of types) announcements.push({ party, type })
  }
  const specialPoints = gameState.specialPoints.map(sp => ({
    ...sp, earnerParty: gameState.parties[sp.earnerId],
  }))
  const playerResults = participants.map(p => ({
    playerId:    p.player_id,
    party:       gameState.parties[p.player_id] ?? 'ausgesetzt',
    specialRole: gameState.specialRoles[p.player_id] ?? null,
  }))
  return {
    reEyes,
    gameType: deriveGameType(gameState.specialRoles, gameState.soloType),
    announcements, specialPoints, playerResults,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GameProvider({ children, initialParticipants }) {
  // Ref statt State für participants: wird in Mutation-Callbacks gebraucht ohne
  // stale-closure-Probleme. Wird von resetForNextGame() synchron aktualisiert.
  const participantsRef = useRef(initialParticipants)
  const [gameState, setGameState] = useState(() => initGameState(initialParticipants))

  // Setzt Spielzustand für das nächste Spiel zurück (neuer Geber, neue Aussetzer)
  const resetForNextGame = useCallback((newParticipants) => {
    participantsRef.current = newParticipants
    setGameState(initGameState(newParticipants))
  }, [])

  const handlePartyChange = useCallback((playerId, party) => {
    setGameState(prev => {
      const newAnns = { ...prev.announcements }
      if (party === 'kontra' && newAnns[playerId]?.includes('re'))
        newAnns[playerId] = newAnns[playerId].filter(t => t !== 're')
      if (party === 're' && newAnns[playerId]?.includes('kontra'))
        newAnns[playerId] = newAnns[playerId].filter(t => t !== 'kontra')
      return { ...prev, parties: { ...prev.parties, [playerId]: party }, announcements: newAnns }
    })
  }, [])

  const handleAnnouncementToggle = useCallback((playerId, type) => {
    setGameState(prev => {
      const current = prev.announcements[playerId] ?? []
      let updated
      if (current.includes(type)) {
        updated = current.filter(t => t !== type)
      } else {
        updated = type === 're'     ? [...current.filter(t => t !== 'kontra'), 're']
                : type === 'kontra' ? [...current.filter(t => t !== 're'), 'kontra']
                : [...current, type]
      }
      return { ...prev, announcements: { ...prev.announcements, [playerId]: updated } }
    })
  }, [])

  const handleSpecialRoleSet = useCallback((playerId, role, extraData) => {
    setGameState(prev => {
      const pts        = participantsRef.current
      const newRoles   = { ...prev.specialRoles, [playerId]: role }
      const newParties = { ...prev.parties }
      // Bei Solo: Parteien automatisch setzen (Solist = Re, alle anderen = Kontra)
      if (role === 'solist') {
        for (const p of pts) {
          if (p.isSitting) continue
          newParties[p.player_id] = p.player_id === playerId ? 're' : 'kontra'
        }
      }
      return {
        ...prev,
        specialRoles: newRoles,
        parties:      newParties,
        soloType:     extraData?.soloType  ?? prev.soloType,
        soloColor:    extraData?.soloColor ?? prev.soloColor,
      }
    })
  }, [])

  const handleSpecialRoleClear = useCallback((playerId) => {
    setGameState(prev => {
      const clearedRole = prev.specialRoles[playerId]
      const newRoles    = { ...prev.specialRoles }
      delete newRoles[playerId]
      // Abhängige Rollen mitlöschen
      if (clearedRole === 'hochzeit') {
        for (const [pid, r] of Object.entries(newRoles)) if (r === 'eingeheiratet') delete newRoles[pid]
      }
      if (clearedRole === 'arm') {
        for (const [pid, r] of Object.entries(newRoles)) if (r === 'reich') delete newRoles[pid]
      }
      return { ...prev, specialRoles: newRoles, soloType: null, soloColor: null }
    })
  }, [])

  const handleSpecialPointAdd = useCallback((earnerId, type, loserId) => {
    setGameState(prev => ({
      ...prev,
      specialPoints: [
        ...prev.specialPoints,
        { id: crypto.randomUUID(), type, earnerId, loserId: loserId ?? null },
      ],
    }))
  }, [])

  const handleSpecialPointRemove = useCallback((pointId) => {
    setGameState(prev => ({
      ...prev,
      specialPoints: prev.specialPoints.filter(sp => sp.id !== pointId),
    }))
  }, [])

  const updateEyes    = useCallback((val)   => setGameState(prev => ({ ...prev, eyesInput: val })),   [])
  const updateEyesFor = useCallback((party) => setGameState(prev => ({ ...prev, eyesFor: party })), [])

  return (
    <GameContext.Provider value={{
      gameState,
      resetForNextGame,
      handlePartyChange,
      handleAnnouncementToggle,
      handleSpecialRoleSet,
      handleSpecialRoleClear,
      handleSpecialPointAdd,
      handleSpecialPointRemove,
      updateEyes,
      updateEyesFor,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame muss innerhalb von GameProvider verwendet werden')
  return ctx
}
