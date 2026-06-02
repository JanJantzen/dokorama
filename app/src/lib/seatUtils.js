// seatUtils.js – Berechnung von Sitzpositionen, Geber-Rotation, Aussetzern und Tischpositionen

// Tischpositionen als Prozentwerte (x, y) für absolute Positionierung im Tischbereich.
// Position 1 = unten links, dann im Uhrzeigersinn.
// x/y zeigen auf den MITTELPUNKT des Avatar-Elements (transform: translate(-50%,-50%)).
const TABLE_POSITIONS = {
  4: [
    { x: 14, y: 76 },  // Pos 1: unten links   (Ecke)
    { x: 82, y: 76 },  // Pos 2: unten rechts  (Ecke)
    { x: 82, y: 16 },  // Pos 3: oben rechts   (Ecke)
    { x: 14, y: 16 },  // Pos 4: oben links    (Ecke)
  ],
  5: [
    { x: 14, y: 76 },  // Pos 1: unten links   (Ecke)
    { x: 82, y: 76 },  // Pos 2: unten rechts  (Ecke)
    { x: 82, y: 16 },  // Pos 3: oben rechts   (Ecke)
    { x: 48, y:  6 },  // Pos 4: oben mitte    (zwischen Ecken)
    { x: 14, y: 16 },  // Pos 5: oben links    (Ecke)
  ],
  6: [
    { x: 14, y: 76 },  // Pos 1: unten links   (Ecke)
    { x: 48, y: 89 },  // Pos 2: unten mitte   (zwischen Ecken)
    { x: 82, y: 76 },  // Pos 3: unten rechts  (Ecke)
    { x: 82, y: 16 },  // Pos 4: oben rechts   (Ecke)
    { x: 48, y:  6 },  // Pos 5: oben mitte    (zwischen Ecken)
    { x: 14, y: 16 },  // Pos 6: oben links    (Ecke)
  ],
  7: [
    { x: 14, y: 76 },  // Pos 1: unten links   (Ecke)
    { x: 48, y: 89 },  // Pos 2: unten mitte   (zwischen Ecken)
    { x: 82, y: 76 },  // Pos 3: unten rechts  (Ecke)
    { x: 93, y: 46 },  // Pos 4: rechts mitte  (zwischen Ecken)
    { x: 82, y: 16 },  // Pos 5: oben rechts   (Ecke)
    { x: 48, y:  6 },  // Pos 6: oben mitte    (zwischen Ecken)
    { x: 14, y: 16 },  // Pos 7: oben links    (Ecke)
  ],
}

// Gibt die Tischposition für eine Sitzposition zurück
export function getTablePosition(seatPosition, totalPlayers) {
  const positions = TABLE_POSITIONS[totalPlayers] ?? TABLE_POSITIONS[4]
  return positions[seatPosition - 1] // Sitzposition ist 1-basiert
}

// Berechnet für ein bestimmtes Spiel einer Runde:
// - wer der Geber ist (Sitzposition rotiert)
// - wer aussetzt (abhängig von Spielerzahl)
//
// Gibt das participants-Array zurück, erweitert um isDealer und isSitting
export function calcSeatStatus(participants, gameNumber) {
  const n = participants.length

  // Der Geber rotiert: Spiel 1 → Sitzpos 1, Spiel 2 → Sitzpos 2, etc.
  const dealerSeatPos = ((gameNumber - 1) % n) + 1

  // Aussetzer-Positionen abhängig von Spielerzahl (aus CLAUDE.md Abschnitt 5)
  let sittingPositions = []
  if (n === 5) {
    // Bei 5 Spieler:innen sitzt der/die Geber:in aus
    sittingPositions = [dealerSeatPos]
  } else if (n === 6) {
    // Bei 6: Geber:in und übernächste Position
    sittingPositions = [
      dealerSeatPos,
      ((dealerSeatPos - 1 + 2) % n) + 1,
    ]
  } else if (n === 7) {
    // Bei 7: drei Positionen gleichmäßig verteilt
    sittingPositions = [
      dealerSeatPos,
      ((dealerSeatPos - 1 + 2) % n) + 1,
      ((dealerSeatPos - 1 + 4) % n) + 1,
    ]
  }

  return participants.map(p => ({
    ...p,
    isDealer:  p.seat_position === dealerSeatPos,
    isSitting: sittingPositions.includes(p.seat_position),
  }))
}
