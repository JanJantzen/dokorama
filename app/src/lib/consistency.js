// consistency.js – Zentrale Konsistenz-Engine der Spielerfassung (Teil 0: Fundament)
//
// Diese Datei ist die "Wahrheit" über zwei Dinge:
//   1. WIE sich der Spielzustand durch eine Aktion verändert  → applyAction()
//   2. WAS ein widerspruchsfreier Zustand ist                 → checkInvariants()
//
// Aus diesen beiden baut sich die Vorausschau zusammen:
//   wouldViolate() = "rechne die Aktion gedanklich durch und sage, was danach
//   verletzt wäre". Genau dieses eine Ergebnis steuert später sowohl das
//   Ausgrauen (vorher) als auch den Auflösungs-Dialog (nachher) – Prinzip P5/P8
//   der KONSISTENZREGELN.md.
//
// Bewusst REINE Funktionen (kein React, kein Zustand drumherum) – genau wie
// scoreCalculation.js. Vorteil: einzeln testbar und an EINER Stelle zentral
// (Prinzip P7: die Logik liegt beim Zustand, nicht in einer Ansicht).
//
// In Teil 0 ist hier nur das Fundament. Die konkreten Konfliktfälle und ihre
// Auflösungs-Dialoge (Teil B/C der Spec) kommen in den Teilen 1–6 dazu.

// ─────────────────────────────────────────────────────────────────────────────
// TEIL 1 – Der Simulations-Reducer: applyAction()
//
// Nimmt den aktuellen Zustand + eine geplante Aktion und gibt den NEUEN Zustand
// zurück. Ändert den alten Zustand nie (gibt immer ein neues Objekt zurück).
//
// Wichtig: Das ist dieselbe Übergangslogik, die auch die echten Eingabe-Handler
// im GameContext benutzen. Dadurch ist garantiert, dass die Simulation (für die
// Vorausschau) exakt das tut, was die echte Eingabe täte – sonst würde die App
// anders ausgrauen, als sie sich später verhält (das wäre ein Bug gegen P8).
//
// Eine "action" ist ein schlichtes Objekt: { type: '...', ...Felder }.
// ─────────────────────────────────────────────────────────────────────────────

// Kaskade (B.5.4): Sobald EINE Seite ihre Soll-Größe erreicht, fallen die übrigen
// NEUTRALEN aktiven Spieler automatisch auf die Gegenseite. Nur Neutrale werden
// gefüllt – eine bereits gesetzte Partei wird nie umgeklappt. Bei vier Aktiven
// genügt ein Durchlauf (füllt eine Seite auf, ist der Tisch komplett).
// Soll-Größen: Solo = 1 Re (Solist) + 3 Kontra, sonst 2 + 2.
//
// Wichtig: NUR bei EXAKT erreichter Soll-Größe wird gefüllt. Eine Überfüllung
// (dritte Person ins volle Team) ist KEIN Kaskaden-Fall, sondern bleibt als
// I2-Verletzung stehen und läuft als Auflösungs-Dialog C.5.6.
function cascadeParties(parties, specialRoles, participants) {
  const active   = participants.filter(p => !p.isSitting)
  const hasSolo  = Object.values(specialRoles).some(r => r === 'solist')
  const reCap    = hasSolo ? 1 : 2
  const koCap    = hasSolo ? 3 : 2
  const isParty  = v => v === 're' || v === 'kontra'
  const reCount  = active.filter(p => parties[p.player_id] === 're').length
  const koCount  = active.filter(p => parties[p.player_id] === 'kontra').length

  let fill = null
  if      (reCount === reCap && koCount < koCap) fill = 'kontra'
  else if (koCount === koCap && reCount < reCap) fill = 're'
  if (!fill) return parties

  const result = { ...parties }
  for (const p of active) if (!isParty(result[p.player_id])) result[p.player_id] = fill
  return result
}

export function applyAction(state, participants, action) {
  switch (action.type) {

    // Partei direkt setzen (Re / Kontra / neutral=null) und anschließend die
    // Kaskade laufen lassen (B.5.4 – siehe cascadeParties oben).
    //
    // KEIN stilles Entfernen einer widersprechenden Ansage mehr (Unterschied zu
    // Teil 1): Hat die Person "Re" gesagt und soll Kontra werden, bleibt der
    // Widerspruch als I7-Verletzung im simulierten Zustand stehen und löst den
    // Auflösungs-Dialog C.5.9 aus ("Re zurückziehen"), statt die Ansage
    // klammheimlich zu löschen (B.5.9).
    case 'setParty': {
      const { playerId, party } = action
      const parties = cascadeParties(
        { ...state.parties, [playerId]: party },
        state.specialRoles,
        participants,
      )
      return { ...state, parties }
    }

    // Eine An-/Absage über den Sheet-Button machen. Das ist der vollständige Klick
    // wie ihn der Schreiber auslöst: Bei Re/Kontra zieht die Ansage zuerst die
    // passende Partei nach sich (B.2.2), dann wird die An-/Absage getoggelt.
    // (Absagen ziehen keine Partei nach – B.2.4.) Damit rechnet die Vorausschau
    // die GANZE Wirkung eines Klicks durch, nicht nur den Toggle-Teil.
    case 'makeAnnouncement': {
      const { playerId, announcement } = action
      let next = state
      if (announcement === 're' && next.parties[playerId] !== 're')
        next = applyAction(next, participants, { type: 'setParty', playerId, party: 're' })
      if (announcement === 'kontra' && next.parties[playerId] !== 'kontra')
        next = applyAction(next, participants, { type: 'setParty', playerId, party: 'kontra' })
      return applyAction(next, participants, { type: 'toggleAnnouncement', playerId, announcement })
    }

    // Eine An-/Absage an-/abschalten. Re und Kontra schließen sich bei derselben
    // Person gegenseitig aus (B.2.1); die Absagen (Keine 90/60/30/Schwarz) nicht.
    case 'toggleAnnouncement': {
      const { playerId, announcement } = action
      const current = state.announcements[playerId] ?? []
      let updated
      if (current.includes(announcement)) {
        updated = current.filter(t => t !== announcement)
      } else {
        updated = announcement === 're'     ? [...current.filter(t => t !== 'kontra'), 're']
                : announcement === 'kontra' ? [...current.filter(t => t !== 're'), 'kontra']
                : [...current, announcement]
      }
      return { ...state, announcements: { ...state.announcements, [playerId]: updated } }
    }

    // Eine Sonderrolle setzen (solist / hochzeit / eingeheiratet / arm / reich).
    // Beim Solo werden zugleich die Parteien gesetzt: Solist = Re, alle anderen
    // aktiven Spieler = Kontra (B.4.3). Bei Hochzeit/Armut setzt der aufrufende
    // Flow die zweite Rolle + Parteien über weitere Aktionen.
    case 'setSpecialRole': {
      const { playerId, role, extraData } = action
      const newRoles   = { ...state.specialRoles, [playerId]: role }
      const newParties = { ...state.parties }
      if (role === 'solist') {
        for (const p of participants) {
          if (p.isSitting) continue
          newParties[p.player_id] = p.player_id === playerId ? 're' : 'kontra'
        }
      }
      return {
        ...state,
        specialRoles: newRoles,
        parties:      newParties,
        soloType:     extraData?.soloType  ?? state.soloType,
        soloColor:    extraData?.soloColor ?? state.soloColor,
      }
    }

    // Eine Sonderrolle löschen. Ein Sonderspiel ist unteilbar (B.4.5): löscht man
    // die Quelle (hochzeit/arm), verschwindet auch die abhängige Partner-Rolle.
    case 'clearSpecialRole': {
      const { playerId } = action
      const clearedRole = state.specialRoles[playerId]
      const newRoles    = { ...state.specialRoles }
      delete newRoles[playerId]
      if (clearedRole === 'hochzeit')
        for (const [pid, r] of Object.entries(newRoles)) if (r === 'eingeheiratet') delete newRoles[pid]
      if (clearedRole === 'arm')
        for (const [pid, r] of Object.entries(newRoles)) if (r === 'reich') delete newRoles[pid]
      return { ...state, specialRoles: newRoles, soloType: null, soloColor: null }
    }

    // Einen Sonderpunkt hinzufügen (Fuchs/Karlchen/Doppelkopf). loserId nur bei
    // "gefangen"-Punkten. id wird hier erzeugt – bei reiner Simulation egal.
    case 'addSpecialPoint': {
      const { earnerId, spType, loserId } = action
      return {
        ...state,
        specialPoints: [
          ...state.specialPoints,
          { id: crypto.randomUUID(), type: spType, earnerId, loserId: loserId ?? null },
        ],
      }
    }

    // Einen Sonderpunkt wieder entfernen (über seine id).
    case 'removeSpecialPoint':
      return { ...state, specialPoints: state.specialPoints.filter(sp => sp.id !== action.pointId) }

    // Augenzahl-Eingabe (Roh-String aus dem Eingabefeld).
    case 'setEyes':
      return { ...state, eyesInput: action.value }

    // Für welche Partei die Augenzahl gilt ('re' / 'kontra').
    case 'setEyesFor':
      return { ...state, eyesFor: action.party }

    // Unbekannte Aktion: Zustand unverändert lassen (defensiv).
    default:
      return state
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEIL 2 – Die Invarianten I1–I13 (A.4 der KONSISTENZREGELN.md)
//
// Jede Invariante ist eine reine Funktion, die true zurückgibt, wenn der Zustand
// sie ERFÜLLT (= ok), und false, wenn er sie VERLETZT. checkInvariants() sammelt
// die Verletzten ein.
//
// Hinweis zu I3 (Vollständigkeit): I3 verlangt, dass am Ende ALLE vier Spieler
// einer Partei zugeordnet sind. Das ist absichtlich KEINE laufende Invariante
// (während der Eingabe ist "neutral" ein erlaubter Durchgangszustand, B.5.5),
// sondern der Gate-Check beim Bestätigen. Darum lebt I3 separat in isComplete()
// und ist NICHT Teil von checkInvariants().
// ─────────────────────────────────────────────────────────────────────────────

const PARTIES = ['re', 'kontra']

// Liefert die Partei eines Spielers oder null (neutral). 'ausgesetzt' → null.
function partyOf(state, playerId) {
  const p = state.parties[playerId]
  return p === 're' || p === 'kontra' ? p : null
}

// I1 – Jede aktive Person ist genau eine Partei: Re, Kontra oder neutral.
// Strukturell durch das Datenmodell fast immer erfüllt; dient als Wächter.
function checkI1(state, active) {
  return active.every(p => ['re', 'kontra', null].includes(state.parties[p.player_id] ?? null))
}

// I2 – Team-Größen. Normalspiel/Hochzeit/Armut: max 2 Re + 2 Kontra.
// Solo: max 1 Re (der Solist) + 3 Kontra. Verletzt, wenn eine Seite ihr Soll
// überschreitet.
function checkI2(state, active) {
  const hasSolo = Object.values(state.specialRoles).some(r => r === 'solist')
  const reCap = hasSolo ? 1 : 2
  const koCap = hasSolo ? 3 : 2
  const reCount = active.filter(p => partyOf(state, p.player_id) === 're').length
  const koCount = active.filter(p => partyOf(state, p.player_id) === 'kontra').length
  return reCount <= reCap && koCount <= koCap
}

// I4 – Re und Kontra schließen sich bei DERSELBEN Person aus (eine
// Ansage-Eigenschaft). Niemand darf gleichzeitig "Re" und "Kontra" angesagt haben.
function checkI4(state, active) {
  return active.every(p => {
    const anns = state.announcements[p.player_id] ?? []
    return !(anns.includes('re') && anns.includes('kontra'))
  })
}

// I5 – Re-Ansage nur vom Re-Team, Kontra-Ansage nur vom Kontra-Team; daraus folgt
// tischweit höchstens EINE Re-Ansage und höchstens EINE Kontra-Ansage.
function checkI5(state, active) {
  const reAnnouncers = active.filter(p => (state.announcements[p.player_id] ?? []).includes('re'))
  const koAnnouncers = active.filter(p => (state.announcements[p.player_id] ?? []).includes('kontra'))
  if (reAnnouncers.length > 1 || koAnnouncers.length > 1) return false
  // Wer Re sagt, muss Re sein; wer Kontra sagt, muss Kontra sein.
  if (reAnnouncers.some(p => partyOf(state, p.player_id) !== 're'))     return false
  if (koAnnouncers.some(p => partyOf(state, p.player_id) !== 'kontra')) return false
  return true
}

// I6 – Jede Absage-Stufe (Keine 90/60/30/Schwarz) pro Partei höchstens einmal.
function checkI6(state, active) {
  const stages = ['keine_90', 'keine_60', 'keine_30', 'schwarz']
  for (const stage of stages) {
    for (const party of PARTIES) {
      const count = active.filter(p =>
        partyOf(state, p.player_id) === party && (state.announcements[p.player_id] ?? []).includes(stage)
      ).length
      if (count > 1) return false
    }
  }
  return true
}

// I7 – Eine Re/Kontra-Ansage erzwingt die passende Partei (Ansage und Partei
// dürfen nicht widersprechen).
function checkI7(state, active) {
  return active.every(p => {
    const anns  = state.announcements[p.player_id] ?? []
    const party = partyOf(state, p.player_id)
    if (anns.includes('re')     && party !== 're')     return false
    if (anns.includes('kontra') && party !== 'kontra') return false
    return true
  })
}

// I8 – Pro Spiel höchstens EIN Sonderspiel. Ein Sonderspiel wird über seine
// auslösende Rolle gezählt (solist / hochzeit / arm) – die Partner-Rollen
// (eingeheiratet / reich) gehören zum selben Sonderspiel und zählen nicht extra.
function checkI8(state, active) {
  const sources = active.filter(p => ['solist', 'hochzeit', 'arm'].includes(state.specialRoles[p.player_id]))
  return sources.length <= 1
}

// I9 – Ein Sonderspiel ist unteilbar: seine Rollen existieren vollständig oder
// gar nicht. Hochzeit braucht genau eine/n Eingeheiratete/n, Armut genau eine/n
// Reiche/n (jeweils in beide Richtungen geprüft). Solo braucht keine Partnerrolle.
function checkI9(state, active) {
  const countRole = role => active.filter(p => state.specialRoles[p.player_id] === role).length
  return countRole('hochzeit') === countRole('eingeheiratet')
      && countRole('arm')      === countRole('reich')
}

// I10 – Die durch ein Sonderspiel erzwungene Partei darf nicht überschrieben sein.
// Alle fünf Sonderrollen liegen auf der Re-Seite (Solist/Hochzeit/Eingeheiratet/
// arm/reich = Re). Hat ein Rollenträger eine andere Partei, ist die Fixierung
// verletzt.
function checkI10(state, active) {
  const sonderrollen = ['solist', 'hochzeit', 'eingeheiratet', 'arm', 'reich']
  return active.every(p => {
    const role = state.specialRoles[p.player_id]
    if (!sonderrollen.includes(role)) return true
    return partyOf(state, p.player_id) === 're'
  })
}

// I11 – Sonderpunkt-Kontingente pro Spiel (TISCHWEIT, nicht pro Person):
// Fuchs ≤ 2, Karlchen gemacht ≤ 1, Karlchen gefangen ≤ 1, Doppelkopf ≤ 4.
function checkI11(state) {
  const caps = { fuchs_gefangen: 2, karlchen_gemacht: 1, karlchen_gefangen: 1, doppelkopf: 4 }
  const counts = {}
  for (const sp of state.specialPoints) counts[sp.type] = (counts[sp.type] ?? 0) + 1
  for (const [type, cap] of Object.entries(caps)) if ((counts[type] ?? 0) > cap) return false
  return true
}

// I12 – "gefangen"-Sonderpunkte (Fuchs/Karlchen) nur gültig, wenn Fänger und
// Bestohlene/r in VERSCHIEDENEN Teams sind. Solange eine Seite noch neutral ist,
// liegt (noch) keine Verletzung vor – erst wenn beide eine Partei haben und sie
// gleich ist.
function checkI12(state) {
  const caught = state.specialPoints.filter(sp =>
    (sp.type === 'fuchs_gefangen' || sp.type === 'karlchen_gefangen') && sp.loserId)
  for (const sp of caught) {
    const ep = partyOf(state, sp.earnerId)
    const lp = partyOf(state, sp.loserId)
    if (ep && lp && ep === lp) return false
  }
  return true
}

// I13 – Augen der Re-Partei liegen im Bereich 0–240. Leeres Feld oder noch keine
// Zahl ist "unvollständig", nicht "verletzt" – nur eine Zahl außerhalb 0–240 ist
// eine echte Verletzung.
function checkI13(state) {
  if (state.eyesInput === '' || state.eyesInput == null) return true
  const n = parseInt(state.eyesInput, 10)
  if (isNaN(n)) return true
  return n >= 0 && n <= 240
}

// Die Liste in fester Reihenfolge. Jede Invariante kennt ihre Nummer (fürs Log
// und für die Resolver-Zuordnung in den späteren Teilen).
const INVARIANTS = [
  { id: 'I1',  ok: checkI1  },
  { id: 'I2',  ok: checkI2  },
  { id: 'I4',  ok: checkI4  },
  { id: 'I5',  ok: checkI5  },
  { id: 'I6',  ok: checkI6  },
  { id: 'I7',  ok: checkI7  },
  { id: 'I8',  ok: checkI8  },
  { id: 'I9',  ok: checkI9  },
  { id: 'I10', ok: checkI10 },
  { id: 'I11', ok: checkI11 },
  { id: 'I12', ok: checkI12 },
  { id: 'I13', ok: checkI13 },
]

// Prüft alle laufenden Invarianten und gibt die IDs der VERLETZTEN zurück
// (leeres Array = alles konsistent). I3 (Vollständigkeit) ist absichtlich nicht
// dabei – siehe isComplete().
export function checkInvariants(state, participants) {
  const active = participants.filter(p => !p.isSitting)
  const violated = []
  for (const inv of INVARIANTS) {
    if (!inv.ok(state, active)) violated.push(inv.id)
  }
  return violated
}

// I3 – Vollständigkeits-Gate fürs Bestätigen: alle vier aktiven Spieler haben
// eine Partei (Normalspiel/Hochzeit/Armut 2+2, Solo 1+3), kein "neutral" mehr.
// Bewusst getrennt von checkInvariants(), weil "neutral" während der Eingabe
// erlaubt ist und sonst dauernd als Verletzung gälte.
export function isComplete(state, participants) {
  const active   = participants.filter(p => !p.isSitting)
  const hasSolo  = Object.values(state.specialRoles).some(r => r === 'solist')
  const reCount  = active.filter(p => partyOf(state, p.player_id) === 're').length
  const koCount  = active.filter(p => partyOf(state, p.player_id) === 'kontra').length
  return hasSolo ? reCount === 1 && koCount === 3 : reCount === 2 && koCount === 2
}

// ─────────────────────────────────────────────────────────────────────────────
// TEIL 3 – Die Vorausschau: wouldViolate()
//
// Das Herzstück von P5/P8: "Welche Invarianten wären verletzt, WENN diese Aktion
// jetzt ausgeführt würde?" – ohne sie wirklich auszuführen. Gibt die Liste der
// verletzten Invarianten-IDs zurück (leer = die Aktion wäre konsistent).
//
// Dasselbe Ergebnis steuert später beides: das Ausgrauen eines Buttons VORHER
// (nicht leer = grau) und den Auflösungs-Dialog NACHHER (bei trotzdem erfolgtem
// Klick). Eine Prüfung, zwei Wirkungen.
// ─────────────────────────────────────────────────────────────────────────────

export function wouldViolate(state, participants, action) {
  const nextState = applyAction(state, participants, action)
  return checkInvariants(nextState, participants)
}
