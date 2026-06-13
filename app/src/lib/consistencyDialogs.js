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
