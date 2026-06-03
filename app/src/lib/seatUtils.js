// seatUtils.js – Berechnung von Sitzpositionen, Geber-Rotation, Aussetzern und Tischpositionen
//
// Tisch-Layout-Prinzip:
//   Sitze 1–4: immer die vier Ecken (unabhängig von Spielerzahl)
//   Sitze 5–7: Aussetzer-Slots an der linken, oberen, rechten Kante (mittig)
//
// Jede Position hat Layout-Metadaten:
//   side:     'left' | 'right' | 'top'  → wo der Toggle sitzt / Sonderpunkte auf Gegenseite
//   vertical: 'top' | 'bottom' | 'middle' → ob Name oben/unten, Ansagen oben/unten

const TABLE_POSITIONS = {
  4: [
    { x: 18, y: 78, side: 'left',  vertical: 'bottom' }, // Sitz 1: unten links  (Ecke)
    { x: 82, y: 78, side: 'right', vertical: 'bottom' }, // Sitz 2: unten rechts (Ecke)
    { x: 82, y: 22, side: 'right', vertical: 'top'    }, // Sitz 3: oben rechts  (Ecke)
    { x: 18, y: 22, side: 'left',  vertical: 'top'    }, // Sitz 4: oben links   (Ecke)
  ],
  5: [
    { x: 18, y: 78, side: 'left',  vertical: 'bottom' },
    { x: 82, y: 78, side: 'right', vertical: 'bottom' },
    { x: 82, y: 22, side: 'right', vertical: 'top'    },
    { x: 18, y: 22, side: 'left',  vertical: 'top'    },
    { x:  6, y: 50, side: 'left',  vertical: 'middle' }, // Sitz 5: links mitte  (Aussetzer-Slot)
  ],
  6: [
    { x: 18, y: 78, side: 'left',  vertical: 'bottom' },
    { x: 82, y: 78, side: 'right', vertical: 'bottom' },
    { x: 82, y: 22, side: 'right', vertical: 'top'    },
    { x: 18, y: 22, side: 'left',  vertical: 'top'    },
    { x:  6, y: 50, side: 'left',  vertical: 'middle' },
    { x: 50, y:  8, side: 'top',   vertical: 'top'    }, // Sitz 6: oben mitte   (Aussetzer-Slot)
  ],
  7: [
    { x: 18, y: 78, side: 'left',  vertical: 'bottom' },
    { x: 82, y: 78, side: 'right', vertical: 'bottom' },
    { x: 82, y: 22, side: 'right', vertical: 'top'    },
    { x: 18, y: 22, side: 'left',  vertical: 'top'    },
    { x:  6, y: 50, side: 'left',  vertical: 'middle' },
    { x: 50, y:  8, side: 'top',   vertical: 'top'    },
    { x: 94, y: 50, side: 'right', vertical: 'middle' }, // Sitz 7: rechts mitte (Aussetzer-Slot)
  ],
}

// Gibt die vollständige Layout-Konfiguration für eine Sitzposition zurück
export function getTablePosition(seatPosition, totalPlayers) {
  const positions = TABLE_POSITIONS[totalPlayers] ?? TABLE_POSITIONS[4]
  return positions[seatPosition - 1] ?? positions[0]
}

// Berechnet für ein bestimmtes Spiel einer Runde wer Geber ist und wer aussetzt
export function calcSeatStatus(participants, gameNumber) {
  const n = participants.length
  const dealerSeatPos = ((gameNumber - 1) % n) + 1

  let sittingPositions = []
  if (n === 5) {
    sittingPositions = [dealerSeatPos]
  } else if (n === 6) {
    sittingPositions = [dealerSeatPos, ((dealerSeatPos - 1 + 2) % n) + 1]
  } else if (n === 7) {
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
