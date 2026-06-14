// consistencyDialogs.js – die Bauer der Auflösungs-Dialoge (Teil C der Spec)
//
// Hier entstehen die konkreten Dialog-Deskriptoren aus dem Meldungs-Katalog
// (KONSISTENZREGELN.md, Teil C). Jeder Bauer ist eine REINE Funktion: er bekommt
// den Zustand + die Daten und gibt einen Deskriptor zurück, den ConsistencyDialog
// anzeigt. Die "onSelect"-Aktionen rufen die übergebenen Callbacks (commit/close)
// auf – so bleibt diese Datei frei von React.
//
// Deskriptor-Form:
//   { was, warum, options: [{ label, subtitle, onSelect?, keepOpen? }] }
//
// Über die Teile 1–6 wächst diese Datei um je einen Bauer pro Konfliktfall.

import { applyAction, checkInvariants } from './consistency.js'

// Anzeige-Texte der An-/Absagen (Teil 1).
const ANN_LABELS = {
  re: 'Re', kontra: 'Kontra',
  keine_90: 'Keine 90', keine_60: 'Keine 60', keine_30: 'Keine 30', schwarz: 'Schwarz',
}

// Anzeige-Texte der Parteien (Teil 2).
const PARTY_LABELS = { re: 'Re', kontra: 'Kontra' }
const otherParty = party => (party === 're' ? 'kontra' : 're')

// Anzeige-Texte der Solo-Typen (Teil 2b). Wird in den Sonderspiel-Dialogen
// konkret genannt ("Buben-Solo", "Damen-Solo" …), wie es C.5.7 verlangt.
const SOLO_LABELS = {
  fleischlos: 'Fleischlos', buben_solo: 'Buben-Solo', damen_solo: 'Damen-Solo',
  farb_solo: 'Farb-Solo', stilles_solo: 'Stilles Solo',
}

// Sonderrollen, die auf der Re-Seite eines Sonderspiels liegen (B.4.3).
const RE_SIDE_ROLES = ['solist', 'hochzeit', 'eingeheiratet', 'arm', 'reich']

// Prüft, ob eine gedachte Auflösungs-Sequenz wirklich in einem widerspruchsfreien
// Zustand endet. Liefert sie false, greift der Dialog NICHT (→ null → sicherer
// Fallback, P8) – so verschleppt kein Resolver einen Rest-Konflikt, den Teil 2b
// noch nicht abdeckt (z.B. ein zusätzlich betroffener dritter Spieler → Teil 2c).
function resolvesCleanly(state, participants, actions) {
  let next = state
  for (const a of actions) next = applyAction(next, participants, a)
  return checkInvariants(next, participants).length === 0
}

// Wendet eine Aktions-Sequenz an und gibt den Endzustand zurück (für die Vorschau,
// welche Folgen eine ausführende Option hat).
function afterActions(state, participants, actions) {
  let next = state
  for (const a of actions) next = applyAction(next, participants, a)
  return next
}

// C.5.8 – Zusatz-Subtitle-Zeile(n): Welche gefangenen Fuchs/Karlchen werden durch
// die Auflösung ungültig (Fänger + Bestohlene/r landen im selben Team)? Vergleicht
// die Sonderpunkte vor/nach der Auflösung; pro weggefallenem Fang eine Zeile.
// (Kein eigener Dialog – die Zeile hängt an die AUSFÜHRENDE Option von C.5.6/C.5.7.)
function c58Lines(beforeState, afterState, nameOf) {
  const surviving = new Set(afterState.specialPoints.map(s => s.id))
  return beforeState.specialPoints
    .filter(sp => !surviving.has(sp.id) &&
      (sp.type === 'fuchs_gefangen' || sp.type === 'karlchen_gefangen') && sp.loserId)
    .map(sp => {
      const tier = sp.type === 'fuchs_gefangen' ? 'Fuchs' : 'Karlchen'
      const pron = sp.type === 'fuchs_gefangen' ? 'ihn' : 'es'
      return `${nameOf(sp.earnerId)} hat ${nameOf(sp.loserId)}s ${tier} damit nicht gefangen `
           + `(und ${nameOf(sp.loserId)} ${pron} nicht verloren)`
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// C.2.3 / C.2.5 – Zweite Person im Team will dieselbe An-/Absage machen
//
// Eine An-/Absage hängt an einer konkreten Person (statistisch wird ausgewertet,
// WER ansagt). Macht eine zweite Person im selben Team dieselbe An-/Absage, ist
// das eine Doppelung (Invariante I5 für Re/Kontra, I6 für die Absagen). Auflösung:
// "Korrektur" – die An-/Absage wandert vom bisherigen Ansager zur klickenden
// Person (B.2.3 / B.2.5).
//
// Re/Kontra (C.2.3) und Absagen (C.2.5) teilen sich dieselbe Mechanik; einziger
// Wording-Unterschied: Absagen stehen in Anführungszeichen, mit dem Wort "Ansage"
// dahinter ("… „Keine 90" Ansage …"), Re/Kontra dagegen "…-Ansage".
// ─────────────────────────────────────────────────────────────────────────────

export function buildAnnouncementConflictDialog({ action, state, participants, commit }) {
  const { playerId: clickerId, announcement } = action
  const isReKo  = announcement === 're' || announcement === 'kontra'
  const active  = participants.filter(p => !p.isSitting)
  const nameOf  = id => active.find(p => p.player_id === id)?.players.name ?? '?'

  // Team, in dem die klickende Person nach der Aktion ist: bei Re/Kontra das
  // angesagte Team selbst, bei einer Absage die bereits gesetzte Partei.
  const clickerParty = isReKo ? announcement : state.parties[clickerId]

  // Die Person im selben Team, die diese An-/Absage schon hat (= der Partner,
  // bei dem die Doppelung entsteht).
  const partner = active.find(p =>
    p.player_id !== clickerId &&
    state.parties[p.player_id] === clickerParty &&
    (state.announcements[p.player_id] ?? []).includes(announcement)
  )
  // Defensiv: ohne Partner gibt es nichts zu korrigieren (sollte nicht vorkommen,
  // wenn I5/I6 wirklich verletzt sind).
  if (!partner) return null

  const clicker      = nameOf(clickerId)
  const partnerName  = partner.players.name
  const label        = ANN_LABELS[announcement]
  const phrase       = isReKo ? label : `„${label}"`            // Wording-Unterschied
  const retractWord  = isReKo ? `${label}-Ansage` : `„${label}" Ansage`

  return {
    // Meldung in zwei Teilen: Was geht nicht? / Warum nicht?
    was:   `${clicker} kann nicht ${phrase} sagen.`,
    warum: `${clicker}s Partner ${partnerName} hat bereits ${phrase} gesagt.`,
    options: [
      // Abbrechen zuerst (Konflikt-Dialog, keine Richtungswahl).
      { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
      {
        label: 'Korrektur',
        subtitle: [
          `${clicker} sagt ${phrase}`,
          `${partnerName}s ${retractWord} wird zurückgezogen`,
        ],
        // Wirkung: die An-/Absage der klickenden Person setzen UND die des
        // Partners zurückziehen (toggleAnnouncement entfernt sie, da vorhanden).
        onSelect: () => {
          commit({ type: 'makeAnnouncement',    playerId: clickerId,        announcement })
          commit({ type: 'toggleAnnouncement',  playerId: partner.player_id, announcement })
        },
      },
    ],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C.5.6 – Partei-Zuordnung: Tisch voll / Teams stehen fest (Teil 2)
//
// Tritt nur bei vollständig zugeordnetem Tisch auf (die Kaskade B.5.4 lässt keinen
// Zwischenzustand "drei zugeordnet, einer offen" zu). Die klickende Person will in
// ein bereits volles Team – die Teams stehen fest und werden NICHT beiläufig
// aufgelöst (B.5.6, "direkt gesetzte Zuordnung wird respektiert"). Auflösung =
// Tausch: eine der beiden Gegenüber wird verdrängt und rutscht per Kaskade auf die
// Gegenseite. Reihenfolge der "Statt"-Optionen: Tischreihenfolge (seat_position).
// ─────────────────────────────────────────────────────────────────────────────

export function buildFullTeamDialog({ action, state, participants, commit }) {
  const { playerId, party } = action            // party = das volle Ziel-Team
  const active = participants.filter(p => !p.isSitting)
  const nameOf = id => active.find(p => p.player_id === id)?.players.name ?? '?'

  const clicker     = nameOf(playerId)
  const targetLabel = PARTY_LABELS[party]
  const otherLabel  = PARTY_LABELS[otherParty(party)]

  // Die beiden Personen, die das Ziel-Team aktuell belegen (nach Tischposition).
  const members = active
    .filter(p => p.player_id !== playerId && state.parties[p.player_id] === party)
    .sort((a, b) => a.seat_position - b.seat_position)
  // Defensiv: ohne belegtes Ziel-Team gibt es nichts zu verdrängen.
  if (members.length === 0) return null

  return {
    was:   `${clicker} kann nicht einfach ${targetLabel} sein.`,
    warum: `Die Teams stehen schon fest – ${members.map(m => m.players.name).join(' und ')} sind ${targetLabel}.`,
    options: [
      { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
      ...members.map(m => {
        // Tausch: den Verdrängten auf die Gegenseite, dann den Klickenden ins
        // Ziel-Team. Reihenfolge egal – der Endzustand ist konsistent (2+2).
        const swap = [
          { type: 'setParty', playerId: m.player_id, party: otherParty(party) },
          { type: 'setParty', playerId, party },
        ]
        // C.5.8: bringt der Tausch einen gefangenen Fuchs/Karlchen ins selbe Team,
        // hängt die entsprechende Zeile als letzte Konsequenz an.
        const after = afterActions(state, participants, swap)
        return {
          label: `Statt ${m.players.name}`,
          subtitle: [
            `${clicker} ist ${targetLabel}`,
            `${m.players.name} ist ${otherLabel}`,
            ...c58Lines(state, after, nameOf),
          ],
          onSelect: () => swap.forEach(commit),
        }
      }),
    ],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C.5.9 – Partei-Aktion scheitert an der eigenen bestehenden Ansage (Teil 2)
//
// Die klickende Person hat selbst Re/Kontra gesagt und gehört damit zu einer
// Partei; der Toggle würde sie auf die Gegenseite bringen (I7). Aufgelöst wird die
// ANSAGE (Button "zurückziehen") – es wird nichts umgetragen, die Ansage
// verschwindet, danach wird die gewünschte Partei gesetzt (B.5.9).
//
// Hier: reine Partei-Aktion (Toggle) → "Was geht nicht?" benennt die ZIELPARTEI
// ("… kann nicht Re sein", Aktions-Achse aus C.Konventionen). Andere Eintrittstüren
// (Sonderspiel-Setzen, Ansage) bekommen ihre aktionsnahe Formulierung in Teil 2b.
// ─────────────────────────────────────────────────────────────────────────────

export function buildPartyAnnouncementConflictDialog({ action, state, participants, commit }) {
  const { playerId, party } = action            // party = gewünschte Zielpartei
  const active = participants.filter(p => !p.isSitting)
  const nameOf = id => active.find(p => p.player_id === id)?.players.name ?? '?'

  const anns = state.announcements[playerId] ?? []
  // Die der Zielpartei widersprechende eigene Ansage (Re bei Ziel Kontra etc.).
  const conflicting = party === 're'     && anns.includes('kontra') ? 'kontra'
                    : party === 'kontra' && anns.includes('re')     ? 're'
                    : null
  // Defensiv: ohne widersprechende eigene Ansage greift dieser Dialog nicht.
  if (!conflicting) return null

  const clicker     = nameOf(playerId)
  const targetLabel = PARTY_LABELS[party]
  const conflLabel  = PARTY_LABELS[conflicting]

  return {
    was:   `${clicker} kann nicht ${targetLabel} sein.`,
    warum: `${clicker} hat ${conflLabel} gesagt und gehört damit zur ${conflLabel}-Partei.`,
    options: [
      { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
      {
        label: `${conflLabel} zurückziehen`,
        subtitle: [
          `${clicker}s ${conflLabel}-Ansage wird zurückgezogen`,
          `${clicker} ist ${targetLabel}`,
          'Die übrigen Partei-Zuordnungen werden, soweit möglich, neu bestimmt',
        ],
        // Erst die widersprechende Ansage wegnehmen, dann die gewünschte Partei
        // setzen (jetzt ohne I7-Konflikt) – die Kaskade füllt den Rest.
        onSelect: () => {
          commit({ type: 'toggleAnnouncement', playerId, announcement: conflicting })
          commit({ type: 'setParty', playerId, party })
        },
      },
    ],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C.5.7 – Partei-Wechsel gegen ein Sonderspiel: "Sonderspiel annullieren" (Teil 2b)
//
// Eine Person gehört wegen eines Sonderspiels zu einer Partei (I10 fixiert alle
// Rollenträger auf Re) und soll auf die Gegenseite. Aufgelöst wird nicht die
// Zuordnung, sondern die URSACHE: das ganze Sonderspiel wird annulliert (B.4.5,
// unteilbar), danach wird die gewünschte Aktion AUSGEFÜHRT (nicht nur freigeräumt).
// Der Konflikt kommt aus zwei Richtungen (Sonderspiel-Seite → Kontra / Gegner →
// Re); beide löst dasselbe Annullieren.
//
// Mehrursachen (P2): Ist die Person ZUSÄTZLICH durch ihre eigene Re/Kontra-Ansage
// gebunden (I10 + I7), entfernt EINE Option beide auf einmal ("Ursachen
// annullieren") – halbes Auflösen wäre nutzlos.
// ─────────────────────────────────────────────────────────────────────────────

export function buildSpecialGameConflictDialog({ action, state, participants, commit, ownAnnouncement }) {
  const { playerId, party } = action
  const active = participants.filter(p => !p.isSitting)
  const nameOf = id => active.find(p => p.player_id === id)?.players.name ?? '?'
  const roleOf = id => state.specialRoles[id]

  // Welches Sonderspiel liegt vor + wer sind die Beteiligten? (P6: zur Laufzeit
  // aus dem Zustand gelesen, nicht mitgeschrieben.)
  const sourceOf = role => active.find(p => roleOf(p.player_id) === role)?.player_id ?? null
  let spType, sourceId, partnerId
  if      (sourceOf('solist')   != null) { spType = 'solo';     sourceId = sourceOf('solist')   }
  else if (sourceOf('hochzeit') != null) { spType = 'hochzeit'; sourceId = sourceOf('hochzeit'); partnerId = sourceOf('eingeheiratet') }
  else if (sourceOf('arm')      != null) { spType = 'armut';    sourceId = sourceOf('arm');      partnerId = sourceOf('reich') }
  else return null                       // kein Sonderspiel → falscher Resolver

  const clicker     = nameOf(playerId)
  const targetLabel = PARTY_LABELS[party]
  const onSpecialSide = RE_SIDE_ROLES.includes(roleOf(playerId))   // Rollenträger → soll Kontra
  const soloLabel   = SOLO_LABELS[state.soloType] ?? 'Solo'

  // Begründung in zwei Formen, weil die deutsche Verbstellung sich unterscheidet:
  //   warumSingle      – ganzer Satz (Nebensatz, Verb am Ende: "… Hochzeit spielt.")
  //   warumMultiClause – Hauptsatz-Klausel nach "… und " (Verb vorn: "spielt … Hochzeit")
  let warumSingle, warumMultiClause
  if (spType === 'solo') {
    if (onSpecialSide) {
      warumSingle      = `${clicker} spielt ein ${soloLabel} und ist deshalb die Re-Partei.`
      warumMultiClause = `spielt ein ${soloLabel}`
    } else {
      warumSingle      = `${clicker} ist in der Kontra-Partei, weil ${clicker} gegen ${nameOf(sourceId)}s ${soloLabel} spielt.`
      warumMultiClause = `spielt gegen ${nameOf(sourceId)}s ${soloLabel}`
    }
  } else {
    const other     = playerId === sourceId ? partnerId : sourceId
    const verbNoun  = spType === 'hochzeit' ? 'Hochzeit'     : 'die Armut'      // "… Hochzeit spielt" / "… die Armut spielt"
    const gegenNoun = spType === 'hochzeit' ? 'die Hochzeit' : 'die Armut'      // "gegen die Hochzeit/Armut von …"
    if (onSpecialSide) {
      warumSingle      = `${clicker} ist in der Re-Partei, weil ${clicker} mit ${nameOf(other)} zusammen ${verbNoun} spielt.`
      warumMultiClause = `spielt mit ${nameOf(other)} zusammen ${verbNoun}`
    } else {
      warumSingle      = `${clicker} ist in der Kontra-Partei, weil ${clicker} gegen ${gegenNoun} von ${nameOf(sourceId)} und ${nameOf(partnerId)} spielt.`
      warumMultiClause = `spielt gegen ${gegenNoun} von ${nameOf(sourceId)} und ${nameOf(partnerId)}`
    }
  }

  // Annullieren-Texte je Spieltyp.
  const annulLabel = spType === 'hochzeit' ? 'Hochzeit annullieren'
                   : spType === 'armut'    ? 'Armut annullieren'
                   : 'Solo annullieren'
  const annulLine  = spType === 'hochzeit' ? `Die Hochzeit zwischen ${nameOf(sourceId)} und ${nameOf(partnerId)} wird annulliert`
                   : spType === 'armut'    ? `Die Armut von ${nameOf(sourceId)} und ${nameOf(partnerId)} wird annulliert`
                   : `${nameOf(sourceId)}s ${soloLabel} wird annulliert`

  const resultLine  = `${clicker} ist ${targetLabel}`
  const cascadeLine = 'Die übrigen Partei-Zuordnungen werden, soweit möglich, neu bestimmt'

  // Mehrursachen: liegt zusätzlich eine eigene, der Zielpartei widersprechende
  // Ansage an? (Die der Resolver via ownAnnouncement angekündigt hat.)
  const anns = state.announcements[playerId] ?? []
  const conflictingAnn = party === 're'     && anns.includes('kontra') ? 'kontra'
                       : party === 'kontra' && anns.includes('re')     ? 're'
                       : null
  const multiCause = ownAnnouncement && conflictingAnn

  // Auflösung gedanklich durchrechnen: führt sie zu einem sauberen Zustand?
  // Wenn nicht (z.B. ein dritter Spieler bleibt im Konflikt), greift dieser Dialog
  // nicht → Fallback (Teil 2c schließt die Lücke).
  const resolveActions = [
    ...(multiCause ? [{ type: 'toggleAnnouncement', playerId, announcement: conflictingAnn }] : []),
    { type: 'clearSpecialGame' },
    { type: 'setParty', playerId, party },
  ]
  if (!resolvesCleanly(state, participants, resolveActions)) return null

  // C.5.8: durch die Auflösung ungültig werdende gefangene Sonderpunkte als letzte
  // Konsequenz-Zeile(n).
  const c58 = c58Lines(state, afterActions(state, participants, resolveActions), nameOf)

  if (multiCause) {
    const annLabel = PARTY_LABELS[conflictingAnn]
    return {
      was:   `${clicker} kann nicht ${targetLabel} sein.`,
      warum: `${clicker} hat ${annLabel} gesagt und ${warumMultiClause}.`,
      options: [
        { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
        {
          label: 'Ursachen annullieren',
          subtitle: [
            `${clicker}s ${annLabel}-Ansage wird zurückgezogen`,
            annulLine,
            resultLine,
            cascadeLine,
            ...c58,
          ],
          onSelect: () => resolveActions.forEach(commit),
        },
      ],
    }
  }

  return {
    was:   `${clicker} kann nicht ${targetLabel} sein.`,
    warum: warumSingle,
    options: [
      { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
      {
        label: annulLabel,
        subtitle: [annulLine, resultLine, cascadeLine, ...c58],
        onSelect: () => resolveActions.forEach(commit),
      },
    ],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C.5.9 (aus der Sonderspiel-Tür) – Sonderspiel-Setzen scheitert an bestehenden
// Ansagen (Teil 2b: direkt benannte Person; Teil 2c: + kaskaden-induzierte Dritte)
//
// Ein Sonderspiel ist ein massiver Partei-Setzakt (B.4.7): es zwingt jedem Spieler
// eine Partei auf. Widerspricht das einer bestehenden Re/Kontra-Ansage (I7), wird
// die ANSAGE zurückgezogen, danach das Sonderspiel gesetzt. Zwei Quellen:
//   - die direkt benannte Re-Seiten-Person (Solist / Hochzeits-Partner / Reiche/r)
//     hat Kontra gesagt – aktionsnahe Meldung (Teil 2b),
//   - ein per Kaskade auf die Gegenseite gedrückter DRITTER (Gegner) hat die andere
//     Ansage gesagt – B.5.9 "vorausschauend" im selben Dialog (Teil 2c).
// Es können tischweit höchstens zwei solche Ansagen zugleich anliegen (I5).
//
// Meldung AKTIONSNAH (C.Konventionen): "Was?" benennt die Handlung. Für Solo wie im
// Katalog ("… kann nicht das Solo spielen"); für Hochzeit/Armut bei reinem
// Partner-Konflikt die Katalogform ("… kann nicht bei … einheiraten"), bei
// Dritt-Beteiligung die hergeleitete Team-Form ("… und … können nicht zusammen …").
// ─────────────────────────────────────────────────────────────────────────────

export function buildSpecialGameSetConflictDialog({ action, state, participants, commit }) {
  const active = participants.filter(p => !p.isSitting)
  const nameOf = id => active.find(p => p.player_id === id)?.players.name ?? '?'

  // Welche Partei zwingt die Aktion jedem auf? → Konflikte = wessen Ansage dem
  // widerspricht (genau die I7-Verletzer im gedachten Zustand).
  const after = applyAction(state, participants, action)
  const conflicts = active
    .filter(p => {
      const anns  = state.announcements[p.player_id] ?? []
      const party = after.parties[p.player_id]
      return (anns.includes('re') && party === 'kontra') || (anns.includes('kontra') && party === 're')
    })
    .map(p => {
      const anns = state.announcements[p.player_id] ?? []
      return { id: p.player_id, ann: anns.includes('re') ? 're' : 'kontra' }
    })
  if (conflicts.length === 0) return null

  // Auflösung: alle widersprechenden Ansagen zurückziehen, dann das Sonderspiel
  // setzen. Nur anbieten, wenn das sauber endet (sonst Fallback, P8).
  const resolveActions = [
    ...conflicts.map(c => ({ type: 'toggleAnnouncement', playerId: c.id, announcement: c.ann })),
    action,
  ]
  if (!resolvesCleanly(state, participants, resolveActions)) return null

  // "Was?" + Ergebnis-Zeile je Spieltyp.
  const partnerOnly = conflicts.length === 1 &&
    (action.type === 'setHochzeit' || action.type === 'setArmut') &&
    conflicts[0].id === action.partnerId
  let wasText, doneText
  if (action.type === 'setSolo') {
    const typLabel = SOLO_LABELS[action.soloType] ?? 'Solo'
    wasText  = `${nameOf(action.playerId)} kann nicht das ${typLabel} spielen.`
    doneText = `${nameOf(action.playerId)} spielt das ${typLabel} (Re)`
  } else if (action.type === 'setHochzeit') {
    wasText  = partnerOnly
      ? `${nameOf(action.partnerId)} kann nicht bei ${nameOf(action.playerId)} einheiraten.`
      : `${nameOf(action.playerId)} und ${nameOf(action.partnerId)} können nicht zusammen Hochzeit spielen.`
    doneText = partnerOnly
      ? `${nameOf(action.partnerId)} heiratet bei ${nameOf(action.playerId)} ein (Re)`
      : `${nameOf(action.playerId)} und ${nameOf(action.partnerId)} spielen zusammen Hochzeit (Re)`
  } else { // setArmut
    wasText  = partnerOnly
      ? `${nameOf(action.partnerId)} kann nicht ${nameOf(action.playerId)}s Armut übernehmen.`
      : `${nameOf(action.playerId)} und ${nameOf(action.partnerId)} können nicht zusammen die Armut spielen.`
    doneText = partnerOnly
      ? `${nameOf(action.partnerId)} übernimmt ${nameOf(action.playerId)}s Armut (Re)`
      : `${nameOf(action.playerId)} und ${nameOf(action.partnerId)} spielen zusammen die Armut (Re)`
  }

  // "Warum?" – die widersprechende(n) Ansage(n).
  const sagt = c => `${nameOf(c.id)} hat ${PARTY_LABELS[c.ann]} gesagt`
  const warum = conflicts.length === 1
    ? `${sagt(conflicts[0])} und gehört damit zur ${PARTY_LABELS[conflicts[0].ann]}-Partei.`
    : conflicts.map(sagt).join(' und ') + '.'

  const label = conflicts.length === 1
    ? `${PARTY_LABELS[conflicts[0].ann]} zurückziehen`
    : 'Ansagen zurückziehen'
  const retractLines = conflicts.map(c => `${nameOf(c.id)}s ${PARTY_LABELS[c.ann]}-Ansage wird zurückgezogen`)
  const c58 = c58Lines(state, afterActions(state, participants, resolveActions), nameOf)

  return {
    was:   wasText,
    warum,
    options: [
      { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
      {
        label,
        subtitle: [
          ...retractLines,
          doneText,
          'Die übrigen Partei-Zuordnungen werden, soweit möglich, neu bestimmt',
          ...c58,
        ],
        onSelect: () => resolveActions.forEach(commit),
      },
    ],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C.2.5 (verspätet, B.2.6) – Partei-Zuordnung verdoppelt eine Absage im Team
//
// Zwei Spieler hatten (neutral) dieselbe Absage gesagt – erlaubt, weil sie auf
// verschiedenen Teams landen könnten. Eine Partei-Zuordnung vereint sie nun im
// selben Team → die Absage wäre doppelt (I6; bei Re/Kontra I5). Aufgelöst wie der
// Zweite-gleiche-Absage-Fall (C.2.5): einer behält sie, beim anderen wird sie
// zurückgezogen. Da beide Ansagen gleich alt sind, bietet der Dialog BEIDE
// Richtungen an (Jan-Entscheid 14.6.) – keine willkürliche Vorauswahl.
// ─────────────────────────────────────────────────────────────────────────────

export function buildLateDoublingDialog({ action, state, participants, commit }) {
  const { playerId: movedId, party } = action
  const active = participants.filter(p => !p.isSitting)
  const nameOf = id => active.find(p => p.player_id === id)?.players.name ?? '?'

  // Welche An-/Absage ist im Zielteam nach dem Zug doppelt – und wer ist der zweite
  // Träger neben dem bewegten Spieler?
  const after  = applyAction(state, participants, action)
  const stages = ['re', 'kontra', 'keine_90', 'keine_60', 'keine_30', 'schwarz']
  let dup = null
  for (const ann of stages) {
    const holders = active.filter(p =>
      after.parties[p.player_id] === party && (state.announcements[p.player_id] ?? []).includes(ann))
    if (holders.length >= 2 && holders.some(h => h.player_id === movedId)) {
      dup = { ann, otherId: holders.find(h => h.player_id !== movedId).player_id }
      break
    }
  }
  if (!dup) return null

  const isReKo      = dup.ann === 're' || dup.ann === 'kontra'
  const label       = ANN_LABELS[dup.ann]
  const phrase      = isReKo ? label : `„${label}"`
  const retractWord = isReKo ? `${label}-Ansage` : `„${label}" Ansage`
  const movedName   = nameOf(movedId)
  const otherName   = nameOf(dup.otherId)
  const targetLabel = PARTY_LABELS[party]

  // Beide Richtungen müssen sauber enden (sollten sie hier immer).
  const keep = (loserId) => [action, { type: 'toggleAnnouncement', playerId: loserId, announcement: dup.ann }]
  if (!resolvesCleanly(state, participants, keep(dup.otherId))) return null

  return {
    was:   `${movedName} und ${otherName} können nicht beide ${phrase} sagen.`,
    warum: `${movedName} und ${otherName} sind beide ${targetLabel} – ${phrase} gilt pro Team nur einmal.`,
    options: [
      { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
      {
        label: `${movedName} behält ${phrase}`,
        subtitle: [`${otherName}s ${retractWord} wird zurückgezogen`, `${movedName} ist ${targetLabel}`],
        onSelect: () => keep(dup.otherId).forEach(commit),
      },
      {
        label: `${otherName} behält ${phrase}`,
        subtitle: [`${movedName}s ${retractWord} wird zurückgezogen`, `${movedName} ist ${targetLabel}`],
        onSelect: () => keep(movedId).forEach(commit),
      },
    ],
  }
}
