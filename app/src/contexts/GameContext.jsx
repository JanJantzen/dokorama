// GameContext – Zustand eines einzelnen Spiels während der Erfassung
//
// Lebt nur für ein Spiel: wird nach Bestätigung via resetForNextGame() zurückgesetzt.
// Alle Mutations-Handler (Parteien, Ansagen, Sonderpunkte etc.) leben hier.
// Wird innerhalb von SessionProvider gemountet, sobald die Teilnehmer geladen sind.
//
// Konsistenz-Engine (Teil 0): Die WIE-ändert-sich-der-Zustand-Logik liegt zentral
// in lib/consistency.js (applyAction). Die Handler hier rufen sie nur auf – dadurch
// ist die Simulation für die Vorausschau immer identisch mit der echten Eingabe.
// Dazu kommt die Dialog-Infrastruktur (dialog/openDialog/closeDialog) und die
// generische Eintrittstür requestAction(), die Konflikte erkennt und entweder den
// passenden Auflösungs-Dialog öffnet oder – wenn keiner definiert ist – sicher
// blockt (Fallback, Prinzip P8).

import { createContext, useContext, useRef, useState, useCallback } from 'react'
import { deriveGameType } from '@/lib/scoreCalculation'
import { applyAction, wouldViolate, isComplete } from '@/lib/consistency'
import {
  buildAnnouncementConflictDialog,
  buildFullTeamDialog,
  buildPartyAnnouncementConflictDialog,
} from '@/lib/consistencyDialogs'

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

// Gibt true wenn Teams vollständig zugeordnet UND Augen eingegeben sind.
// Die Team-Vollständigkeit (= Invariante I3) kommt aus isComplete() – eine
// gemeinsame Quelle für die Regel, statt sie hier zu duplizieren.
export function isGameValid(gameState, participants) {
  const teamsOk = isComplete(gameState, participants)
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

// ─── Fallback-Dialog (Prinzip P8) ─────────────────────────────────────────────
//
// Sicherheitsnetz, das NIE sichtbar werden sollte (C.Fallback der Spec). Greift,
// wenn eine Aktion eine Invariante verletzen würde, für die noch kein spezifischer
// Auflösungs-Dialog existiert. Die Aktion wird geblockt, der letzte stimmige
// Zustand bleibt.
function buildFallbackDialog(closeDialog) {
  return {
    was:   'Das geht gerade nicht.',
    warum: 'Diese Eingabe würde zu einem widersprüchlichen Stand führen und wurde nicht '
         + 'übernommen. Ein Hinweis an die Entwickler wurde gespeichert. Bitte merke dir, '
         + 'was du gerade gemacht hast, und gib uns Bescheid.',
    options: [
      { label: 'Zurück', subtitle: 'Ohne Änderung zurück (der letzte stimmige Stand bleibt).', onSelect: closeDialog },
    ],
  }
}

// Loggt einen Fallback-Vorgang. In Teil 0 nur in die Konsole – die persistente
// DB-Tabelle consistency_logs ist Teil 6. Die Schreiber-ID bleibt bis zum
// Login-Bau NULL (CLAUDE.md "Irgendwann"-Liste).
function logConsistencyFallback({ violations, action, state }) {
  console.warn('[Konsistenz-Fallback] geblockte Aktion', {
    violatedInvariants: violations,
    attemptedAction:    action,
    stateBefore:        state,
    writerId:           null,
    timestamp:          new Date().toISOString(),
  })
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GameProvider({ children, initialParticipants }) {
  // Ref statt State für participants: wird in Mutation-Callbacks gebraucht ohne
  // stale-closure-Probleme. Wird von resetForNextGame() synchron aktualisiert.
  const participantsRef = useRef(initialParticipants)
  const [gameState, setGameState] = useState(() => initGameState(initialParticipants))

  // Zentraler Auflösungs-Dialog: null = keiner offen. Liegt hier (nicht in einer
  // Ansicht), damit Tisch- und Block-Ansicht denselben Dialog teilen (P7).
  const [dialog, setDialog] = useState(null)
  const openDialog  = useCallback((d) => setDialog(d), [])
  const closeDialog = useCallback(() => setDialog(null), [])

  // Setzt Spielzustand für das nächste Spiel zurück (neuer Geber, neue Aussetzer)
  const resetForNextGame = useCallback((newParticipants) => {
    participantsRef.current = newParticipants
    setGameState(initGameState(newParticipants))
    setDialog(null)
  }, [])

  // Setzt das aktuelle Spiel auf Leerstand zurück – ohne Participants zu ändern
  const resetCurrentGame = useCallback(() => {
    setGameState(initGameState(participantsRef.current))
    setDialog(null)
  }, [])

  // Führt eine Aktion ungeprüft aus (über den zentralen Reducer). Die einzelnen
  // Handler unten nutzen das – so läuft jede Zustandsänderung durch dieselbe
  // Übergangslogik wie die Vorausschau-Simulation.
  const commitAction = useCallback((action) => {
    setGameState(prev => applyAction(prev, participantsRef.current, action))
  }, [])

  // ── Resolver-Dispatch (wird in den Teilen 1–6 gefüllt) ──────────────────────
  // Bekommt die auslösende Aktion + die verletzten Invarianten + den Zustand und
  // gibt einen Dialog-Deskriptor zurück – oder null, wenn für diesen Fall (noch)
  // kein spezifischer Dialog definiert ist (→ sicherer Fallback, P8).
  const resolveConflict = useCallback((action, violations, state) => {
    // Teil 1 – zweite gleiche An-/Absage im Team (B.2.3/B.2.5, C.2.3/C.2.5).
    // Greift nur, wenn die EINZIGE Verletzung die An-/Absage-Doppelung ist
    // (I5 = Re/Kontra, I6 = Absage). Sind zusätzlich Partei-Invarianten verletzt
    // (z.B. Team schon voll), gehört der Fall zum Partei-Knoten (Teil 2) und
    // läuft bis dahin in den Fallback.
    if (action.type === 'makeAnnouncement'
        && violations.every(v => v === 'I5' || v === 'I6')) {
      return buildAnnouncementConflictDialog({
        action, state, participants: participantsRef.current,
        commit: commitAction,
      })
    }

    // Teil 2a – reiner Partei-Toggle (setParty). Zwei Konfliktarten werden hier
    // aufgelöst; alles andere (Sonderspiel-Bindung I10, Mehrursachen, verspätete
    // Dritt-Konflikte) folgt in Teil 2b/2c und läuft bis dahin in den Fallback.
    if (action.type === 'setParty') {
      const anns = state.announcements[action.playerId] ?? []
      const ownAnnouncementConflict =
        (action.party === 're'     && anns.includes('kontra')) ||
        (action.party === 'kontra' && anns.includes('re'))

      // C.5.9 – die klickende Person ist durch ihre EIGENE Ansage gebunden
      // (Vorrang vor "Team voll", weil die Ansage die bindende Ursache ist, P1).
      // Solange keine Sonderspiel-Bindung (I10) dazukommt – das ist Teil 2b.
      if (ownAnnouncementConflict && !violations.includes('I10')) {
        return buildPartyAnnouncementConflictDialog({
          action, state, participants: participantsRef.current,
          commit: commitAction,
        })
      }

      // C.5.6 – Ziel-Team voll / Teams stehen fest (I2), ohne bindende Ursache.
      if (violations.includes('I2')
          && !violations.includes('I10')
          && !ownAnnouncementConflict) {
        return buildFullTeamDialog({
          action, state, participants: participantsRef.current,
          commit: commitAction,
        })
      }
    }

    return null
  }, [commitAction])

  // Generische Eintrittstür für JEDE potenziell konflikt-behaftete Aktion (P5/P8):
  //   1. Vorausschau: würde die Aktion eine Invariante verletzen?
  //   2. Nein  → ausführen.
  //   3. Ja, mit definiertem Resolver → Auflösungs-Dialog öffnen.
  //   4. Ja, ohne Resolver → blocken + Fallback-Meldung + loggen (P8).
  // In Teil 0 noch nicht an die Buttons gehängt – das übernimmt Teil 1 mit dem
  // ersten echten Konfliktfall.
  const requestAction = useCallback((action) => {
    const participants = participantsRef.current
    const violations   = wouldViolate(gameState, participants, action)
    if (violations.length === 0) {
      commitAction(action)
      return
    }
    const resolver = resolveConflict(action, violations, gameState)
    if (resolver) {
      openDialog(resolver)
      return
    }
    logConsistencyFallback({ violations, action, state: gameState })
    openDialog(buildFallbackDialog(closeDialog))
  }, [gameState, commitAction, resolveConflict, openDialog, closeDialog])

  // ── Konkrete Eingabe-Handler ────────────────────────────────────────────────
  // Behalten ihre bisherige Signatur (TableView/PlayerSheet rufen sie unverändert
  // auf), delegieren die Zustandsänderung aber an den zentralen Reducer.

  // Direktes (ungeprüftes) Partei-Setzen. Wird noch von den Sonderspiel-Flows im
  // PlayerSheet benutzt – die werden erst in Teil 2b über die Konsistenzprüfung
  // geführt. Läuft trotzdem schon durch applyAction (inkl. Kaskade B.5.4).
  const handlePartyChange = useCallback((playerId, party) => {
    commitAction({ type: 'setParty', playerId, party })
  }, [commitAction])

  // Geprüfter Partei-Toggle (Teil 2a): läuft durch die Konsistenz-Engine.
  // Sauber → wird ausgeführt; Team voll → C.5.6, eigene widersprechende Ansage
  // → C.5.9; alles andere bis Teil 2b/2c → sicherer Fallback (P8).
  const changeParty = useCallback((playerId, party) => {
    requestAction({ type: 'setParty', playerId, party })
  }, [requestAction])

  // Vorausschau fürs Ausgrauen des Toggles (P5): Würde dieser Partei-Klick gerade
  // einen Konflikt auslösen?
  const previewParty = useCallback((playerId, party) => {
    return wouldViolate(gameState, participantsRef.current,
      { type: 'setParty', playerId, party }).length > 0
  }, [gameState])

  const handleAnnouncementToggle = useCallback((playerId, type) => {
    commitAction({ type: 'toggleAnnouncement', playerId, announcement: type })
  }, [commitAction])

  // An-/Absage über den Sheet-Button (Teil 1): läuft durch die Konsistenzprüfung.
  // Sauber → wird ausgeführt; Doppelung im Team → Auflösungs-Dialog (C.2.3/C.2.5).
  const makeAnnouncement = useCallback((playerId, type) => {
    requestAction({ type: 'makeAnnouncement', playerId, announcement: type })
  }, [requestAction])

  // Vorausschau für die Ansicht (P5): Würde dieser An-/Absage-Klick gerade einen
  // Konflikt auslösen? Steuert das Ausgrauen des Buttons (grau, aber klickbar).
  const previewAnnouncement = useCallback((playerId, type) => {
    return wouldViolate(gameState, participantsRef.current,
      { type: 'makeAnnouncement', playerId, announcement: type }).length > 0
  }, [gameState])

  const handleSpecialRoleSet = useCallback((playerId, role, extraData) => {
    commitAction({ type: 'setSpecialRole', playerId, role, extraData })
  }, [commitAction])

  const handleSpecialRoleClear = useCallback((playerId) => {
    commitAction({ type: 'clearSpecialRole', playerId })
  }, [commitAction])

  const handleSpecialPointAdd = useCallback((earnerId, type, loserId) => {
    commitAction({ type: 'addSpecialPoint', earnerId, spType: type, loserId })
  }, [commitAction])

  const handleSpecialPointRemove = useCallback((pointId) => {
    commitAction({ type: 'removeSpecialPoint', pointId })
  }, [commitAction])

  const updateEyes    = useCallback((val)   => commitAction({ type: 'setEyes', value: val }),    [commitAction])
  const updateEyesFor = useCallback((party) => commitAction({ type: 'setEyesFor', party }),      [commitAction])

  return (
    <GameContext.Provider value={{
      gameState,
      resetForNextGame,
      resetCurrentGame,
      handlePartyChange,
      changeParty,
      previewParty,
      handleAnnouncementToggle,
      makeAnnouncement,
      previewAnnouncement,
      handleSpecialRoleSet,
      handleSpecialRoleClear,
      handleSpecialPointAdd,
      handleSpecialPointRemove,
      updateEyes,
      updateEyesFor,
      // Konsistenz-Engine (Teil 0)
      dialog,
      openDialog,
      closeDialog,
      requestAction,
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
