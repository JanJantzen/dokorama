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

// announce (optional): kam der Konflikt von einer Re/Kontra-Ansage (B.2.2/C.2.2),
// wird die Ansage nach dem Partei-Tausch mitgesetzt – sonst (reiner Partei-Toggle) leer.
export function buildFullTeamDialog({ action, state, participants, commit, announce }) {
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
    // Aktions-Achse (C.2.2): vom Ansage-Einstieg "… kann nicht Re sagen",
    // vom reinen Partei-Toggle "… kann nicht einfach Re sein".
    was:   announce ? `${clicker} kann nicht ${targetLabel} sagen.`
                    : `${clicker} kann nicht einfach ${targetLabel} sein.`,
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
          onSelect: () => {
            swap.forEach(commit)
            // Kam der Konflikt von einer Ansage: nach dem Tausch die Ansage mitsetzen.
            if (announce) commit({ type: 'toggleAnnouncement', playerId, announcement: announce })
          },
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

export function buildSpecialGameConflictDialog({ action, state, participants, commit, ownAnnouncement, announce }) {
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
  const verb        = announce ? 'sagen' : 'sein'   // Aktions-Achse (C.2.2): Ansage → "sagen"
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
    // Kam der Konflikt von einer Ansage (B.2.2/C.2.2): nach dem Auflösen die Ansage mitsetzen.
    ...(announce ? [{ type: 'toggleAnnouncement', playerId, announcement: announce }] : []),
  ]
  if (!resolvesCleanly(state, participants, resolveActions)) return null

  // C.5.8: durch die Auflösung ungültig werdende gefangene Sonderpunkte als letzte
  // Konsequenz-Zeile(n).
  const c58 = c58Lines(state, afterActions(state, participants, resolveActions), nameOf)

  if (multiCause) {
    const annLabel = PARTY_LABELS[conflictingAnn]
    return {
      was:   `${clicker} kann nicht ${targetLabel} ${verb}.`,
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

// ─────────────────────────────────────────────────────────────────────────────
// C.5.10 – Wisch-Geste: zwei Spieler zu einem Team verbinden (Teil 5)
//
// Die Geste lässt die RICHTUNG offen ("die zwei zusammen", ohne Re/Kontra). Logisch
// ist sie nur eine weitere Eintrittstür in den Partei-Block und nutzt die bekannten
// Mechaniken (Voll-Team-Tausch B.5.6 / Sonderspiel annullieren B.5.7 / Ansage
// zurückziehen B.5.9). Kernprinzip (Jan): die Zuordnung von zweien ist die Zuordnung
// von vieren – darum darf die Auflösung auch Ansagen DRITTER Personen zurückziehen
// und ein Sonderspiel annullieren, wenn die Kaskade sie sonst ins Schleudern bringt.
// ─────────────────────────────────────────────────────────────────────────────

// Liefert das aktive Sonderspiel als { type, members[], soloType? } oder null.
function specialGameInfo(state, active) {
  const find = role => active.find(p => state.specialRoles[p.player_id] === role)?.player_id ?? null
  const solist = find('solist')
  if (solist != null) return { type: 'solo', members: [solist], soloType: state.soloType }
  const hz = find('hochzeit')
  if (hz != null) return { type: 'hochzeit', members: [hz, find('eingeheiratet')].filter(x => x != null) }
  const arm = find('arm')
  if (arm != null) return { type: 'armut', members: [arm, find('reich')].filter(x => x != null) }
  return null
}

// Annul-Zeile für die Konsequenz-Liste (wie C.5.10-Beispiel: "As und Bs Hochzeit …").
function annulLineForSwipe(state, active, nameOf, seatOf) {
  const info = specialGameInfo(state, active)
  if (!info) return null
  if (info.type === 'solo')
    return `${nameOf(info.members[0])}s ${SOLO_LABELS[info.soloType] ?? 'Solo'} wird annulliert`
  const m = [...info.members].sort((x, y) => seatOf(x) - seatOf(y)).map(nameOf)
  return `${m[0]}s und ${m[1]}s ${info.type === 'hochzeit' ? 'Hochzeit' : 'Armut'} wird annulliert`
}

// "Warum?"-Satz für den Konflikt-Dialog (e): benennt die im Weg stehenden Ursachen.
function swipeWarum(state, active, aId, bId, nameOf, seatOf) {
  const parts = []
  const info = specialGameInfo(state, active)
  if (info) {
    if (info.type === 'solo') {
      parts.push(`${nameOf(info.members[0])} spielt ein ${SOLO_LABELS[info.soloType] ?? 'Solo'}`)
    } else {
      const m = [...info.members].sort((x, y) => seatOf(x) - seatOf(y)).map(nameOf)
      parts.push(`${m[0]} und ${m[1]} spielen ${info.type === 'hochzeit' ? 'Hochzeit' : 'die Armut'}`)
    }
  }
  for (const p of [...active].sort((x, y) => seatOf(x.player_id) - seatOf(y.player_id))) {
    const anns = state.announcements[p.player_id] ?? []
    if (anns.includes('re'))     parts.push(`${p.players.name} hat Re gesagt`)
    if (anns.includes('kontra')) parts.push(`${p.players.name} hat Kontra gesagt`)
  }
  if (parts.length === 0)
    parts.push(`${nameOf(aId)} und ${nameOf(bId)} sind aktuell verschiedene Parteien`)
  return parts.join(', ') + '. Wie soll die Situation aufgelöst werden?'
}

// Plant die Aktionsfolge, um a UND b in Partei `direction` zu bringen (die anderen
// beiden Aktiven fallen auf die Gegenseite – bei vier Aktiven IST die Zuordnung von
// zweien die ganze Tafel). Vorgehen in Spec-Reihenfolge: (1) ein im Weg stehendes
// Sonderspiel annullieren, (2) widersprechende Re/Kontra-Ansagen zurückziehen (auch
// dritter Personen), (3) alle vier in EINEM Zug setzen (setAllParties). Endet das
// nicht widerspruchsfrei (z.B. doppelte Absage durch die Vereinigung, von der Spec
// nicht erfasst) → null → der Aufrufer blockt sicher (Fallback, P8).
export function uniteInDirection(state, participants, aId, bId, direction) {
  const opp      = direction === 're' ? 'kontra' : 're'
  const active   = participants.filter(p => !p.isSitting)
  const targetOf = id => (id === aId || id === bId) ? direction : opp

  let s = state
  const actions = []
  const doAct = a => { actions.push(a); s = applyAction(s, participants, a) }

  // 1. Sonderspiel annullieren, falls seine fixierte Re-Seite NICHT der Ziel-Re-Seite
  //    entspricht (B.4.3/B.5.7). Trifft die Zielverteilung das Sonderspiel exakt, bleibt
  //    es (dann wäre die Geste ohnehin ein No-op und käme nicht hierher).
  const roleHolders = active.filter(p => RE_SIDE_ROLES.includes(state.specialRoles[p.player_id]))
  if (roleHolders.length > 0) {
    const targetReSet  = new Set(active.filter(p => targetOf(p.player_id) === 're').map(p => p.player_id))
    const sameAsSpecial = roleHolders.length === targetReSet.size
      && roleHolders.every(p => targetReSet.has(p.player_id))
    if (!sameAsSpecial) doAct({ type: 'clearSpecialGame' })
  }

  // 2. Widersprechende Re/Kontra-Ansagen zurückziehen – für ALLE Aktiven gegen ihre
  //    Zielpartei (auch dritte, nicht gewischte Personen).
  for (const p of active) {
    const id = p.player_id
    const wrong = targetOf(id) === 're' ? 'kontra' : 're'
    if ((s.announcements[id] ?? []).includes(wrong))
      doAct({ type: 'toggleAnnouncement', playerId: id, announcement: wrong })
  }

  // 3. Alle vier Aktiven in einem Zug auf ihre Zielpartei setzen.
  const partyMap = {}
  for (const p of active) partyMap[p.player_id] = targetOf(p.player_id)
  doAct({ type: 'setAllParties', parties: partyMap })

  // I6 (Absage-Doppelung, zwei gleiche Absagen im selben Team) wird NICHT hier gelöst,
  // sondern als C.2.6-Folge-Dialog ("wer behält die Absage?", resolveSwipe im
  // GameContext). Jede ANDERE Restverletzung ist eine echte Regel-Lücke → null →
  // sicherer Fallback (P8). Die finalState trägt die evtl. offene I6-Doppelung; sie
  // wird vor dem Commit über den Folge-Dialog aufgelöst, nie inkonsistent committet.
  if (checkInvariants(s, participants).some(v => v !== 'I6')) return null
  return { actions, finalState: s }
}

// Findet Absage-Doppelungen in einem Zustand: dieselbe Absage-Stufe (K90/K60/K30/
// Schwarz) bei zwei Personen DESSELBEN Teams (I6). Reihenfolge der Träger = Sitzfolge.
export function absageDoublings(state, participants) {
  const active = participants.filter(p => !p.isSitting)
  const stages = ['keine_90', 'keine_60', 'keine_30', 'schwarz']
  const out = []
  for (const stage of stages) {
    for (const party of ['re', 'kontra']) {
      const holders = active
        .filter(p => state.parties[p.player_id] === party && (state.announcements[p.player_id] ?? []).includes(stage))
        .map(p => p.player_id)
      if (holders.length >= 2) out.push({ party, stage, holders })
    }
  }
  return out
}

// C.2.6-Folge-Dialog nach einem Wisch: die Vereinigung hat zwei gleiche Absagen ins
// selbe Team gebracht (I6). Wie C.2.6 sind beide Ansagen "gleich alt" → beide
// Richtungen ("wer behält") werden angeboten. Jede Option committet die Team-Setzung
// (swipeActions) UND den Absage-Rückzug ATOMAR zusammen – so wird der inkonsistente
// Zwischenzustand nie committet (P8). Lösen die Optionen den Rest nicht sauber auf
// (mehrere Doppelungen) → null → Fallback.
export function buildAbsageKeepDialog({ state, participants, swipeActions, doubling, commit }) {
  const active = participants.filter(p => !p.isSitting)
  const nameOf = id => active.find(p => p.player_id === id)?.players.name ?? '?'
  const { stage, holders: [h1, h2] } = doubling
  const label = ANN_LABELS[stage]

  const optionFor = (keepId, dropId) => {
    const acts = [...swipeActions, { type: 'toggleAnnouncement', playerId: dropId, announcement: stage }]
    if (!resolvesCleanly(state, participants, acts)) return null
    return {
      label: `${nameOf(keepId)} behält „${label}"`,
      subtitle: [`${nameOf(dropId)}s „${label}" Ansage wird zurückgezogen`],
      onSelect: () => acts.forEach(commit),
    }
  }
  const o1 = optionFor(h1, h2)
  const o2 = optionFor(h2, h1)
  if (!o1 || !o2) return null

  return {
    was:   `${nameOf(h1)} und ${nameOf(h2)} können nicht beide „${label}" sagen.`,
    warum: `${nameOf(h1)} und ${nameOf(h2)} sind jetzt im selben Team – „${label}" gilt pro Team nur einmal. Wer behält die Ansage?`,
    options: [
      { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
      o1,
      o2,
    ],
  }
}

// Baut den Wisch-Dialog (Verhaltensweisen d/e aus C.5.10). Die dialoglosen Fälle
// (a/b/c) erledigt der Aufrufer (GameContext) vorab. Gibt null zurück, wenn eine
// Richtung nicht sauber auflösbar ist → Fallback (P8).
export function buildSwipeDialog({ state, participants, aId, bId, resolve }) {
  const active = participants.filter(p => !p.isSitting)
  const nameOf = id => active.find(p => p.player_id === id)?.players.name ?? '?'
  const seatOf = id => active.find(p => p.player_id === id)?.seat_position ?? 0

  const reRes = uniteInDirection(state, participants, aId, bId, 're')
  const koRes = uniteInDirection(state, participants, aId, bId, 'kontra')
  if (!reRes || !koRes) return null

  const otherTwo = active
    .filter(p => p.player_id !== aId && p.player_id !== bId)
    .sort((x, y) => seatOf(x.player_id) - seatOf(y.player_id))
  const pairNames  = `${nameOf(aId)} und ${nameOf(bId)}`
  const otherNames = otherTwo.map(p => p.players.name).join(' und ')

  // Konsequenz-Liste je Richtung: erst entfernte Ursachen (Annul, Rückzüge in
  // Aktionsreihenfolge), dann das Ergebnis, dann ggf. die C.5.8-Zeile(n).
  const consequenceLines = (res, D) => {
    const out = []
    for (const a of res.actions) {
      if (a.type === 'clearSpecialGame') out.push(annulLineForSwipe(state, active, nameOf, seatOf))
      if (a.type === 'toggleAnnouncement')
        out.push(`${nameOf(a.playerId)}s ${PARTY_LABELS[a.announcement]}-Ansage wird zurückgezogen`)
    }
    out.push(`${pairNames} sind ${PARTY_LABELS[D]}`)
    out.push(`${otherNames} sind ${PARTY_LABELS[D === 're' ? 'kontra' : 're']}`)
    out.push(...c58Lines(state, res.finalState, nameOf))
    return out.filter(Boolean)
  }

  const isParty    = v => v === 're' || v === 'kontra'
  const bothNeutral = !isParty(state.parties[aId]) && !isParty(state.parties[bId])
  // (d) reine Richtungswahl: beide gewischten neutral UND keine Richtung braucht eine
  //     Ursachen-Auflösung (beide Aktionslisten nur setAllParties). Sonst (e) Konflikt.
  const pureChoice = bothNeutral
    && [...reRes.actions, ...koRes.actions].every(a => a.type === 'setAllParties')

  if (pureChoice) {
    // (d) – kein Konflikt → Abbrechen UNTEN (Richtungswahl-Konvention).
    return {
      was:   `${pairNames} bilden ein Team.`,
      warum: 'Sind die beiden Re oder Kontra?',
      options: [
        // keepOpen: resolve() entscheidet, ob committet (dann schließt es selbst) oder
        // ob noch der C.2.6-Absage-Folgedialog geöffnet wird – darum nicht auto-schließen.
        { label: 'Re',     subtitle: [`${pairNames} sind Re`,     `${otherNames} sind Kontra`], keepOpen: true, onSelect: () => resolve(reRes.actions) },
        { label: 'Kontra', subtitle: [`${pairNames} sind Kontra`, `${otherNames} sind Re`],     keepOpen: true, onSelect: () => resolve(koRes.actions) },
        { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
      ],
    }
  }

  // (e) – Konflikt → Abbrechen ZUERST, volle Konsequenz-Listen je Richtung.
  return {
    was:   `${pairNames} können aktuell kein Team bilden.`,
    warum: swipeWarum(state, active, aId, bId, nameOf, seatOf),
    options: [
      { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
      { label: 'Beide Re',     subtitle: consequenceLines(reRes, 're'),     keepOpen: true, onSelect: () => resolve(reRes.actions) },
      { label: 'Beide Kontra', subtitle: consequenceLines(koRes, 'kontra'), keepOpen: true, onSelect: () => resolve(koRes.actions) },
    ],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C.3.2 – Sonderpunkt-Obergrenze erreicht (Spiel-Kontingent erschöpft, Teil 4)
//
// Die Sonderpunkt-Kontingente sind TISCHWEIT (Invariante I11, B.3.1): Fuchs ≤ 2,
// Karlchen gemacht ≤ 1, Karlchen gefangen ≤ 2, Doppelkopf ≤ 4. Zusätzliches
// kombiniertes Limit: Karlchen gemacht + Karlchen gefangen ≤ 2 (nur 2 Kreuz-Buben).
// Ist das Kontingent voll und jemand will denselben Typ noch eintragen, greift
// dieser Dialog (P5). Vier Fälle, ein Grundmuster (Abbrechen + Verdrängungs-
// Optionen), aber verschieden in Optionenzahl und Identifikation:
//   • Fuchs             – je gefangenem Fuchs eine „Statt"-Option (Fänger + Bestohlene/r)
//   • Karlchen gemacht  – „Korrektur" (kein Bestohlener) + Fall D (2× gefangen → kombiniertes Limit)
//   • Karlchen gefangen – 3 Unterfälle: B (2× gefangen), C (kombiniertes Limit 1+1)
//   • Doppelkopf        – je Spieler mit ≥1 eine „Statt"-Option (Person + Anzahl)
//
// Gefangene Punkte (Fuchs / Karlchen gefangen): die gewählte Option LÖSCHT den alten
// Fang komplett und stößt danach – wie bei der Ersterfassung – die Bestohlenen-
// Auswahl für die neue Fängerin an (requestLoserSelection). Der eigentliche Add
// passiert erst nach dieser Auswahl (dann ist im Kontingent wieder Platz). Reihen-
// folge mehrerer „Statt"-Optionen: Tischposition (seat_position).
// ─────────────────────────────────────────────────────────────────────────────

export function buildSpecialPointQuotaDialog({ action, state, participants, commit, requestLoserSelection }) {
  const { earnerId, spType } = action
  const active  = participants.filter(p => !p.isSitting)
  const nameOf  = id => active.find(p => p.player_id === id)?.players.name ?? '?'
  const seatOf  = id => active.find(p => p.player_id === id)?.seat_position ?? 0
  const clicker = nameOf(earnerId)
  const cancel  = { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' }

  // ── Fuchs (max. 2) – je Fang eine „Statt"-Option, identifiziert über Fänger +
  //    Bestohlene/r (funktioniert auch, wenn eine Person beide gefangen hat). ──
  if (spType === 'fuchs_gefangen') {
    const caught = state.specialPoints
      .filter(sp => sp.type === 'fuchs_gefangen')
      .sort((a, b) => seatOf(a.earnerId) - seatOf(b.earnerId))
    const list = caught.map(sp => `${nameOf(sp.earnerId)} von ${nameOf(sp.loserId)}`).join(', ')
    return {
      was:   `${clicker} kann keinen Fuchs fangen.`,
      warum: `Beide Füchse sind schon gefangen (${list}).`,
      options: [
        cancel,
        ...caught.map(sp => ({
          label: `Statt ${nameOf(sp.earnerId)}s Fuchs von ${nameOf(sp.loserId)}`,
          subtitle: [
            `${nameOf(sp.earnerId)} hat den Fuchs von ${nameOf(sp.loserId)} nicht gefangen`,
            `${clicker} hat einen Fuchs gefangen (von wem, wird gleich ausgewählt)`,
          ],
          onSelect: () => {
            commit({ type: 'removeSpecialPoint', pointId: sp.id })
            requestLoserSelection(earnerId, 'fuchs_gefangen')
          },
        })),
      ],
    }
  }

  // ── Karlchen gemacht (max. 1) – zwei mögliche Auslöser:
  //    Fall A: ein anderer hat bereits das Karlchen gemacht → Korrektur
  //    Fall D: kombiniertes Limit erschöpft (2× gefangen, kein Platz mehr für gemacht)
  if (spType === 'karlchen_gemacht') {
    const old    = state.specialPoints.find(sp => sp.type === 'karlchen_gemacht')
    const caught = state.specialPoints
      .filter(sp => sp.type === 'karlchen_gefangen')
      .sort((a, b) => seatOf(a.earnerId) - seatOf(b.earnerId))

    // Fall A: anderer hat Karlchen gemacht → einzelne Korrektur-Option
    if (old) {
      return {
        was:   `${clicker} kann kein Karlchen machen.`,
        warum: `${nameOf(old.earnerId)} hat das Karlchen bereits gemacht.`,
        options: [
          cancel,
          {
            label: 'Korrektur',
            subtitle: [
              `${nameOf(old.earnerId)} hat kein Karlchen gemacht`,
              `${clicker} hat das Karlchen gemacht`,
            ],
            onSelect: () => {
              commit({ type: 'removeSpecialPoint', pointId: old.id })
              commit({ type: 'addSpecialPoint', earnerId, spType: 'karlchen_gemacht', loserId: null })
            },
          },
        ],
      }
    }

    // Fall D: 2× gefangen → kombiniertes Limit (gemacht + gefangen ≤ 2) erschöpft
    if (caught.length >= 2) {
      const list = caught.map(sp => `${nameOf(sp.earnerId)} von ${nameOf(sp.loserId)}`).join(', ')
      return {
        was:   `${clicker} kann kein Karlchen machen.`,
        warum: `Das Karlchen-Limit ist erreicht: Beide Karlchen wurden bereits gefangen (${list}).`,
        options: [
          cancel,
          ...caught.map(sp => ({
            label: `Statt ${nameOf(sp.earnerId)}s Karlchen von ${nameOf(sp.loserId)}`,
            subtitle: [
              `${nameOf(sp.earnerId)} hat das Karlchen von ${nameOf(sp.loserId)} nicht gefangen`,
              `${clicker} hat das Karlchen gemacht`,
            ],
            onSelect: () => {
              commit({ type: 'removeSpecialPoint', pointId: sp.id })
              commit({ type: 'addSpecialPoint', earnerId, spType: 'karlchen_gemacht', loserId: null })
            },
          })),
        ],
      }
    }

    return null
  }

  // ── Karlchen gefangen (max. 2) – drei mögliche Auslöser:
  //    Fall B: Einzelkap erschöpft (2× gefangen bereits, kein dritter möglich)
  //    Fall C: Kombiniertes Limit erschöpft (1× gemacht + 1× gefangen = 2 total)
  if (spType === 'karlchen_gefangen') {
    const caught = state.specialPoints
      .filter(sp => sp.type === 'karlchen_gefangen')
      .sort((a, b) => seatOf(a.earnerId) - seatOf(b.earnerId))
    const made = state.specialPoints.filter(sp => sp.type === 'karlchen_gemacht')

    // Fall B: Einzelkap für gefangen erschöpft (2 Fänge bereits eingetragen)
    if (caught.length >= 2) {
      const list = caught.map(sp => `${nameOf(sp.earnerId)} von ${nameOf(sp.loserId)}`).join(', ')
      return {
        was:   `${clicker} kann kein Karlchen fangen.`,
        warum: `Beide Karlchen sind schon gefangen (${list}).`,
        options: [
          cancel,
          ...caught.map(sp => ({
            label: `Statt ${nameOf(sp.earnerId)}s Karlchen von ${nameOf(sp.loserId)}`,
            subtitle: [
              `${nameOf(sp.earnerId)} hat das Karlchen von ${nameOf(sp.loserId)} nicht gefangen`,
              `${clicker} hat das Karlchen gefangen (von wem, wird gleich ausgewählt)`,
            ],
            onSelect: () => {
              commit({ type: 'removeSpecialPoint', pointId: sp.id })
              requestLoserSelection(earnerId, 'karlchen_gefangen')
            },
          })),
        ],
      }
    }

    // Fall C: Kombiniertes Limit erschöpft (1× gemacht + 1× gefangen = max. 2 total)
    if (made.length >= 1 && caught.length >= 1) {
      const madeEntry   = made[0]
      const caughtEntry = caught[0]
      return {
        was:   `${clicker} kann kein Karlchen fangen.`,
        warum: `Das Karlchen-Limit ist erreicht: ${nameOf(madeEntry.earnerId)} hat das Karlchen gemacht, ${nameOf(caughtEntry.earnerId)} hat es gefangen (von ${nameOf(caughtEntry.loserId)}). Mehr als 2 Karlchen-Ereignisse sind nicht möglich.`,
        options: [
          cancel,
          {
            label: `Korrektur: Nicht ${nameOf(caughtEntry.earnerId)}, sondern ${clicker}`,
            subtitle: [
              `${nameOf(caughtEntry.earnerId)} hat das Karlchen nicht gefangen`,
              `${clicker} hat das Karlchen gefangen (von wem, wird gleich ausgewählt)`,
            ],
            onSelect: () => {
              commit({ type: 'removeSpecialPoint', pointId: caughtEntry.id })
              requestLoserSelection(earnerId, 'karlchen_gefangen')
            },
          },
        ],
      }
    }

    return null
  }

  // ── Doppelkopf (max. 4) – je Spieler mit ≥1 eine „Statt"-Option (Person +
  //    Anzahl; Doppelköpfe sind ununterscheidbar, daher kein Bestohlener). ──────
  if (spType === 'doppelkopf') {
    const byEarner = []
    for (const sp of state.specialPoints) {
      if (sp.type !== 'doppelkopf') continue
      let e = byEarner.find(x => x.earnerId === sp.earnerId)
      if (!e) { e = { earnerId: sp.earnerId, count: 0, firstId: sp.id }; byEarner.push(e) }
      e.count++
    }
    byEarner.sort((a, b) => seatOf(a.earnerId) - seatOf(b.earnerId))
    const list = byEarner.map(e => `${nameOf(e.earnerId)} (${e.count})`).join(', ')
    return {
      was:   `${clicker} kann keinen Doppelkopf eintragen.`,
      warum: `Es sind schon vier Doppelköpfe eingetragen: ${list}.`,
      options: [
        cancel,
        ...byEarner.map(e => ({
          label: `Statt ${nameOf(e.earnerId)}`,
          subtitle: [
            `${clicker} macht einen Doppelkopf`,
            // Mengen-Fallunterscheidung (C.3.2 Fall D): N>1 → „(statt N)", N=1 → „keinen mehr".
            e.count > 1
              ? `${nameOf(e.earnerId)} hat dann einen Doppelkopf (statt ${e.count})`
              : `${nameOf(e.earnerId)} hat dann keinen Doppelkopf mehr`,
          ],
          onSelect: () => {
            commit({ type: 'removeSpecialPoint', pointId: e.firstId })
            commit({ type: 'addSpecialPoint', earnerId, spType: 'doppelkopf', loserId: null })
          },
        })),
      ],
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// C.3.4 – Gefangener Sonderpunkt im eigenen Team (Bestohlenen-Auswahl, Teil 4)
//
// Reiner HINWEIS-Dialog, kein Auflösungsweg (B.3.4 / Invariante I12): im „von wem?"-
// Picker wurde eine Person aus dem eigenen Team angetippt – aus dem eigenen Team kann
// man niemandem etwas abnehmen. Nur „Abbrechen"; danach steht der Picker wieder offen,
// der Schreiber wählt eine andere Person. (Bei noch neutralen Teams erscheint der
// Dialog gar nicht – dann ist niemand ausgegraut, B.5.8.)
// ─────────────────────────────────────────────────────────────────────────────

export function buildSameTeamCatchDialog({ action, participants }) {
  const { earnerId, spType, loserId } = action
  const active = participants.filter(p => !p.isSitting)
  const nameOf = id => active.find(p => p.player_id === id)?.players.name ?? '?'
  // „der Fuchs" (maskulin) → „keinen", „das Karlchen" (neutrum) → „kein".
  const tier   = spType === 'fuchs_gefangen' ? 'Fuchs' : 'Karlchen'
  const negArt = spType === 'fuchs_gefangen' ? 'keinen' : 'kein'
  return {
    was:   `${nameOf(earnerId)} kann von ${nameOf(loserId)} ${negArt} ${tier} fangen.`,
    warum: `${nameOf(loserId)} ist im selben Team wie ${nameOf(earnerId)}.`,
    options: [
      { label: 'Abbrechen', subtitle: 'Ohne Änderung zurück.' },
    ],
  }
}
