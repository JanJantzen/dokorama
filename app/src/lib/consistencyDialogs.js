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

// Anzeige-Texte der An-/Absagen (Teil 1).
const ANN_LABELS = {
  re: 'Re', kontra: 'Kontra',
  keine_90: 'Keine 90', keine_60: 'Keine 60', keine_30: 'Keine 30', schwarz: 'Schwarz',
}

// Anzeige-Texte der Parteien (Teil 2).
const PARTY_LABELS = { re: 'Re', kontra: 'Kontra' }
const otherParty = party => (party === 're' ? 'kontra' : 're')

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
      ...members.map(m => ({
        label: `Statt ${m.players.name}`,
        subtitle: [
          `${clicker} ist ${targetLabel}`,
          `${m.players.name} ist ${otherLabel}`,
        ],
        // Tausch: den Verdrängten auf die Gegenseite, dann den Klickenden ins
        // Ziel-Team. Reihenfolge egal – der Endzustand ist konsistent (2+2).
        onSelect: () => {
          commit({ type: 'setParty', playerId: m.player_id, party: otherParty(party) })
          commit({ type: 'setParty', playerId, party })
        },
      })),
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
