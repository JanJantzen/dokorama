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
import { supabase } from '@/lib/supabase'
import { deriveGameType } from '@/lib/scoreCalculation'
import { applyAction, wouldViolate, isComplete, checkInvariants } from '@/lib/consistency'
import {
  buildAnnouncementConflictDialog,
  buildFullTeamDialog,
  buildPartyAnnouncementConflictDialog,
  buildSpecialGameConflictDialog,
  buildSpecialGameSetConflictDialog,
  buildLateDoublingDialog,
  buildSpecialPointQuotaDialog,
  buildSameTeamCatchDialog,
  buildSwipeDialog,
  uniteInDirection,
  buildAbsageKeepDialog,
  absageDoublings,
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
  // Finaler Gate-Check vor dem Speichern (Spec A.4 / B.6.1): der Zustand muss ALLE
  // laufenden Invarianten erfüllen. Im Normalfall ist er das ohnehin (jede Eingabe
  // läuft über requestAction, P8) – fängt aber Eingaben ab, die NICHT durch die
  // Engine laufen, v.a. die Augenzahl außerhalb 0–240 (I13, updateEyes committet direkt).
  const consistent = checkInvariants(gameState, participants).length === 0
  return teamsOk && eyesOk && consistent
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

// Loggt einen Fallback-Vorgang (Teil 6, C.Fallback der Spec).
//
// Zwei Wege gleichzeitig:
//  1. console.warn – sofort sichtbar in der Entwickler-Konsole, hilft beim
//     Debuggen direkt im Browser.
//  2. Persistente Zeile in der DB-Tabelle consistency_logs – damit der Vorfall
//     nicht mit dem Browser-Tab verschwindet, sondern später auffindbar bleibt.
//
// Bewusst "fire-and-forget": der DB-Schreibvorgang wird NICHT abgewartet und sein
// Fehler NIE nach oben geworfen. Das Logging darf die Eingabe nie blockieren oder
// abstürzen lassen – sonst würde das Sicherheitsnetz selbst zum Problem. Schlägt
// das Schreiben fehl (z.B. offline), bleibt wenigstens die Konsolen-Ausgabe.
//
// writer_id bleibt NULL, bis es einen Login gibt (CLAUDE.md "Irgendwann"-Liste:
// dann wird hier die eingeloggte Schreiber-Identität eingesetzt).
function logConsistencyFallback({ violations, action, state }) {
  console.warn('[Konsistenz-Fallback] geblockte Aktion', {
    violatedInvariants: violations,
    attemptedAction:    action,
    stateBefore:        state,
    writerId:           null,
    timestamp:          new Date().toISOString(),
  })

  supabase
    .from('consistency_logs')
    .insert({
      violated_invariants: violations,
      attempted_action:    action,
      state_before:        state,
      writer_id:           null,
    })
    .then(({ error }) => {
      if (error) console.error('[Konsistenz-Fallback] DB-Log fehlgeschlagen', error)
    })
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GameProvider({ children, initialParticipants, initialGameState }) {
  // Ref statt State für participants: wird in Mutation-Callbacks gebraucht ohne
  // stale-closure-Probleme. Wird von resetForNextGame() synchron aktualisiert.
  const participantsRef = useRef(initialParticipants)
  // initialGameState befüllt den Edit-Modus mit einem gespeicherten Spiel; sonst leer.
  const [gameState, setGameState] = useState(() => initialGameState ?? initGameState(initialParticipants))

  // Zentraler Auflösungs-Dialog: null = keiner offen. Liegt hier (nicht in einer
  // Ansicht), damit Tisch- und Block-Ansicht denselben Dialog teilen (P7).
  const [dialog, setDialog] = useState(null)
  const openDialog  = useCallback((d) => setDialog(d), [])
  const closeDialog = useCallback(() => setDialog(null), [])

  // „von wem"-Nachfassen (Teil 4): Nach einer C.3.2-Auflösung bei gefangenen Punkten
  // muss die neue Fängerin noch die/den Bestohlene/n wählen. Der zentrale Dialog kann
  // den Picker im PlayerSheet nicht direkt öffnen (P7: Logik zentral, Anzeige in der
  // Sicht), darum dieser geteilte „Auftrag" { earnerId, type }. Das Sheet der Fängerin
  // reagiert darauf und öffnet den passenden Bestohlenen-Picker.
  const [pendingLoserSelection, setPendingLoserSelection] = useState(null)
  const clearPendingLoserSelection = useCallback(() => setPendingLoserSelection(null), [])

  // Setzt Spielzustand für das nächste Spiel zurück (neuer Geber, neue Aussetzer)
  const resetForNextGame = useCallback((newParticipants) => {
    participantsRef.current = newParticipants
    setGameState(initGameState(newParticipants))
    setDialog(null)
    setPendingLoserSelection(null)
  }, [])

  // Setzt das aktuelle Spiel auf Leerstand zurück – ohne Participants zu ändern
  const resetCurrentGame = useCallback(() => {
    setGameState(initGameState(participantsRef.current))
    setDialog(null)
    setPendingLoserSelection(null)
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

    // Teil 2 – Partei-Knoten (setParty). Reihenfolge der Prüfung folgt P1: zuerst
    // die bindende Ursache "Sonderspiel" (fixiert beide Seiten, B.4.3), dann die
    // eigene Ansage, zuletzt der reine Voll-Tisch ohne bindende Ursache.
    if (action.type === 'setParty') {
      const anns = state.announcements[action.playerId] ?? []
      const ownAnnouncementConflict =
        (action.party === 're'     && anns.includes('kontra')) ||
        (action.party === 'kontra' && anns.includes('re'))
      // Liegt überhaupt ein Sonderspiel auf dem Tisch? (P6: zur Laufzeit erkannt.)
      const specialActive = participantsRef.current.some(p =>
        !p.isSitting &&
        ['solist', 'hochzeit', 'eingeheiratet', 'arm', 'reich'].includes(state.specialRoles[p.player_id]))

      // C.5.7 – ein Sonderspiel fixiert beide Seiten. Jede Partei-Änderung am
      // (durch das Sonderspiel) vollen Tisch läuft übers Annullieren, nicht über
      // den Voll-Team-Tausch C.5.6. ownAnnouncementConflict steuert die
      // Mehrursachen-Variante (I10 + I7 → "Ursachen annullieren", P2).
      if (specialActive && (violations.includes('I10') || violations.includes('I2'))) {
        return buildSpecialGameConflictDialog({
          action, state, participants: participantsRef.current,
          commit: commitAction, ownAnnouncement: ownAnnouncementConflict,
        })
      }

      // C.5.9 – die klickende Person ist durch ihre EIGENE Ansage gebunden (ohne
      // Sonderspiel). Vorrang vor "Team voll", weil die Ansage die Ursache ist (P1).
      if (ownAnnouncementConflict) {
        return buildPartyAnnouncementConflictDialog({
          action, state, participants: participantsRef.current,
          commit: commitAction,
        })
      }

      // C.5.6 – Ziel-Team voll / Teams stehen fest (I2), ohne bindende Ursache.
      if (violations.includes('I2')) {
        return buildFullTeamDialog({
          action, state, participants: participantsRef.current,
          commit: commitAction,
        })
      }

      // C.2.5 verspätet (B.2.6, Teil 2c) – die Zuordnung vereint zwei Spieler mit
      // derselben An-/Absage im Team (I6 / bei Re/Kontra I5). Auflösung: einer
      // behält sie (beide Richtungen angeboten).
      if (violations.includes('I6') || violations.includes('I5')) {
        return buildLateDoublingDialog({
          action, state, participants: participantsRef.current,
          commit: commitAction,
        })
      }
    }

    // Teil 2b – Sonderspiel als Eintrittstür (B.4.7). Das Setzen erbt die Konflikte
    // eines Partei-Setzakts. Behandelt wird der direkte Fall: die benannte Person
    // (Solist / Hochzeits-Partner / Reiche/r) hat selbst Kontra gesagt → C.5.9
    // aktionsnah. Andere Lagen (Gegner-Ansage per Kaskade, Doppelungen) deckt der
    // Bauer per resolvesCleanly NICHT ab → null → Fallback (Teil 2c).
    if (action.type === 'setSolo' || action.type === 'setHochzeit' || action.type === 'setArmut') {
      return buildSpecialGameSetConflictDialog({
        action, state, participants: participantsRef.current,
        commit: commitAction,
      })
    }

    // Teil 4 – Sonderpunkte (B.3 / C.3.2, C.3.4). Das Hinzufügen läuft jetzt durch
    // die Engine. Zwei Konfliktarten, je nach verletzter Invariante:
    //   • Kontingent erschöpft (I11, tischweit) → C.3.2: „Statt"/„Korrektur", bei
    //     gefangenen Punkten mit „von wem"-Nachfassen (requestLoserSelection).
    //   • gefangener Punkt im eigenen Team (I12) → C.3.4: reiner Hinweis-Dialog.
    if (action.type === 'addSpecialPoint') {
      if (violations.every(v => v === 'I11')) {
        return buildSpecialPointQuotaDialog({
          action, state, participants: participantsRef.current,
          commit: commitAction,
          requestLoserSelection: (earnerId, type) => setPendingLoserSelection({ earnerId, type }),
        })
      }
      if (violations.every(v => v === 'I12')) {
        return buildSameTeamCatchDialog({ action, participants: participantsRef.current })
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

  // Wisch-Geste (Teil 5, B.5.10/C.5.10): zwei Spieler zu einem Team verbinden, mit
  // OFFENER Richtung. Nur eine weitere Eintrittstür in den Partei-Block. Die fünf
  // Verhaltensweisen:
  //   (a) ungültig (gleicher Spieler / nicht aktiv) → nichts (die View filtert schon
  //       Geste-im-Leeren/auf-Aussetzer).
  //   (b) beide schon gleiche Partei → No-op.
  //   (c) eine Seite gesetzt, andere neutral, sauber → dialoglos zuordnen.
  //   (d)/(e) → Richtungswahl-Dialog (buildSwipeDialog).
  // Führt eine gewählte Wisch-Richtung aus. Berechnet den Endzustand der Team-Setzung
  // (ohne zu committen) und prüft, ob dabei eine Absage-Doppelung entstünde (I6):
  //   • keine → die Team-Setzung committen, Dialog (falls offen) schließen.
  //   • genau eine → C.2.6-Folge-Dialog "wer behält die Absage?" öffnen; dessen
  //     Optionen committen Team-Setzung + Rückzug ATOMAR (nie inkonsistenter Commit, P8).
  //   • mehrere/unlösbar → sicherer Fallback.
  const resolveSwipe = useCallback((actions) => {
    const participants = participantsRef.current
    let finalState = gameState
    for (const a of actions) finalState = applyAction(finalState, participants, a)
    const doublings = absageDoublings(finalState, participants)
    if (doublings.length === 0) { actions.forEach(commitAction); closeDialog(); return }
    if (doublings.length === 1) {
      const dlg = buildAbsageKeepDialog({
        state: gameState, participants, swipeActions: actions, doubling: doublings[0], commit: commitAction,
      })
      if (dlg) { openDialog(dlg); return }
    }
    logConsistencyFallback({ violations: ['I6'], action: { type: 'swipe-absage', actions }, state: gameState })
    openDialog(buildFallbackDialog(closeDialog))
  }, [gameState, commitAction, openDialog, closeDialog])

  const requestSwipe = useCallback((aId, bId) => {
    const participants = participantsRef.current
    const active = participants.filter(p => !p.isSitting)
    // (a) ungültig: gleicher Spieler oder einer ist nicht aktiv.
    if (aId === bId) return
    if (!active.some(p => p.player_id === aId) || !active.some(p => p.player_id === bId)) return

    const isParty = v => v === 're' || v === 'kontra'
    const pa = gameState.parties[aId]
    const pb = gameState.parties[bId]

    // (b) beide schon dieselbe Partei → nichts zu tun.
    if (isParty(pa) && pa === pb) return

    // (c) genau eine Seite gesetzt, andere neutral → in die gesetzte Richtung vereinen
    //     (immer eindeutig, Jan-Regel). uniteInDirection ist dabei stets "pure"
    //     (nur setAllParties); eine evtl. Absage-Doppelung klärt resolveSwipe.
    if (isParty(pa) !== isParty(pb)) {
      const D = isParty(pa) ? pa : pb
      const res = uniteInDirection(gameState, participants, aId, bId, D)
      if (res && res.actions.every(a => a.type === 'setAllParties')) {
        resolveSwipe(res.actions)
        return
      }
    }

    // (d)/(e) → Richtungswahl-Dialog; nicht auflösbar (Spec-Lücke) → sicherer Fallback (P8).
    const dlg = buildSwipeDialog({ state: gameState, participants, aId, bId, resolve: resolveSwipe })
    if (dlg) { openDialog(dlg); return }
    logConsistencyFallback({ violations: ['swipe'], action: { type: 'swipe', aId, bId }, state: gameState })
    openDialog(buildFallbackDialog(closeDialog))
  }, [gameState, commitAction, openDialog, closeDialog, resolveSwipe])

  // ── Konkrete Eingabe-Handler ────────────────────────────────────────────────
  // Behalten ihre bisherige Signatur (TableView/PlayerSheet rufen sie unverändert
  // auf), delegieren die Zustandsänderung aber an den zentralen Reducer.

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

  // Geprüftes Sonderspiel-Setzen (Teil 2b): Solo / Hochzeit / Armut laufen als EINE
  // zusammengesetzte Aktion durch die Konsistenz-Engine (Rollen + Parteien in einem
  // Zug, B.4.3/B.4.7). Sauber → ausgeführt; eigene Gegen-Ansage der benannten Person
  // → C.5.9 aktionsnah; alles Weitere bis Teil 2c → sicherer Fallback (P8).
  const setSolo = useCallback((playerId, soloType, soloColor) => {
    requestAction({ type: 'setSolo', playerId, soloType, soloColor })
  }, [requestAction])

  const setHochzeit = useCallback((playerId, partnerId) => {
    requestAction({ type: 'setHochzeit', playerId, partnerId })
  }, [requestAction])

  const setArmut = useCallback((playerId, partnerId) => {
    requestAction({ type: 'setArmut', playerId, partnerId })
  }, [requestAction])

  // Vorausschau fürs Ausgrauen im Picker (P5): Würde dieser Pick gerade einen
  // Konflikt auslösen? Solo hat keinen Partner – geprüft wird der Solist selbst.
  const previewSolo = useCallback((playerId, soloType, soloColor) => {
    return wouldViolate(gameState, participantsRef.current,
      { type: 'setSolo', playerId, soloType, soloColor }).length > 0
  }, [gameState])

  const previewHochzeit = useCallback((playerId, partnerId) => {
    return wouldViolate(gameState, participantsRef.current,
      { type: 'setHochzeit', playerId, partnerId }).length > 0
  }, [gameState])

  const previewArmut = useCallback((playerId, partnerId) => {
    return wouldViolate(gameState, participantsRef.current,
      { type: 'setArmut', playerId, partnerId }).length > 0
  }, [gameState])

  const handleSpecialRoleClear = useCallback((playerId) => {
    commitAction({ type: 'clearSpecialRole', playerId })
  }, [commitAction])

  // Geprüftes Sonderpunkt-Hinzufügen (Teil 4): läuft jetzt durch die Konsistenz-
  // Engine. Sauber → committet; Kontingent voll (I11) → C.3.2; gefangener Punkt im
  // eigenen Team (I12) → C.3.4. (Entfernen kann nie eine Invariante verletzen und
  // bleibt direkt.)
  const handleSpecialPointAdd = useCallback((earnerId, type, loserId) => {
    requestAction({ type: 'addSpecialPoint', earnerId, spType: type, loserId })
  }, [requestAction])

  const handleSpecialPointRemove = useCallback((pointId) => {
    commitAction({ type: 'removeSpecialPoint', pointId })
  }, [commitAction])

  // Vorausschau fürs Ausgrauen (P5): Würde dieser Sonderpunkt gerade einen Konflikt
  // auslösen? Ohne Bestohlene/n (loserId=null) ist es die reine Kontingent-Prüfung
  // (I11, tischweit) für die Viererreihe; mit loserId zusätzlich die Team-Prüfung
  // (I12) für den „von wem?"-Picker.
  const previewSpecialPoint = useCallback((earnerId, type, loserId = null) => {
    return wouldViolate(gameState, participantsRef.current,
      { type: 'addSpecialPoint', earnerId, spType: type, loserId }).length > 0
  }, [gameState])

  const updateEyes    = useCallback((val)   => commitAction({ type: 'setEyes', value: val }),    [commitAction])
  const updateEyesFor = useCallback((party) => commitAction({ type: 'setEyesFor', party }),      [commitAction])

  return (
    <GameContext.Provider value={{
      gameState,
      resetForNextGame,
      resetCurrentGame,
      changeParty,
      previewParty,
      handleAnnouncementToggle,
      makeAnnouncement,
      previewAnnouncement,
      setSolo,
      setHochzeit,
      setArmut,
      previewSolo,
      previewHochzeit,
      previewArmut,
      handleSpecialRoleClear,
      handleSpecialPointAdd,
      handleSpecialPointRemove,
      previewSpecialPoint,
      updateEyes,
      updateEyesFor,
      // Konsistenz-Engine (Teil 0)
      dialog,
      openDialog,
      closeDialog,
      requestAction,
      requestSwipe,
      // „von wem"-Nachfassen (Teil 4)
      pendingLoserSelection,
      clearPendingLoserSelection,
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
