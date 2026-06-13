// seatUtils.js – Berechnung von Sitzpositionen, Geber-Rotation, Aussetzern und Tischpositionen
//
// Tisch-Layout-Prinzip:
//   Aktive Spieler: immer in den 4 Ecken (mit Backdrop)
//   Aussetzer:      in den Kanten-Slots mittig auf ihrer Kante (ohne Backdrop)
//
// 4 Spieler: statisch – P1=unten-links, dann Uhrzeigersinn
// 5-7 Spieler: dynamisch pro Spiel
//   - Ecke oben-links  = nächster Geber (kommt als nächstes dran)
//   - Kante-links      = aktueller Geber (setzt gerade aus)
//   - Restliche Aktive = oben-rechts → unten-rechts → unten-links (Uhrzeigersinn)
//   - Weitere Aussetzer = Kante-oben (6 Spieler), Kante-rechts (7 Spieler)
//
// participants muss bereits isDealer/isSitting enthalten (via calcSeatStatus).

// ─── Positionen ────────────────────────────────────────────────────────────────

// 4 Ecken – Reihenfolge: oben-links[0], oben-rechts[1], unten-rechts[2], unten-links[3]
// CornerPlayer positioniert sich per left/right/top/bottom:0, braucht kein x/y
const CORNERS = [
  { isCorner: true, side: 'left',  vertical: 'top'    }, // [0] oben-links
  { isCorner: true, side: 'right', vertical: 'top'    }, // [1] oben-rechts
  { isCorner: true, side: 'right', vertical: 'bottom' }, // [2] unten-rechts
  { isCorner: true, side: 'left',  vertical: 'bottom' }, // [3] unten-links
]

// 3 Kanten-Slots – Avatar-Mittelpunkt 60px vom jeweiligen Rand (60px = 16cqw bei SE/375px).
// cqw = % der Container-Breite (= <main>, gedeckelte Phone-Spalte) – siehe TableView.
// posStyle wird direkt als style-Prop auf dem CompactPlayer-Container verwendet
const EDGES = [
  {
    isCorner: false,
    posStyle: { left: 'clamp(60px, 16cqw, 80px)', top: '50%',  transform: 'translate(-50%, -50%)' },
    side: 'left',  vertical: 'middle',
  },
  {
    isCorner: false,
    posStyle: { left: '50%', top: 'clamp(60px, 16cqw, 80px)', transform: 'translate(-50%, -50%)' },
    side: 'top',   vertical: 'top',
  },
  {
    isCorner: false,
    posStyle: { right: 'clamp(60px, 16cqw, 80px)', top: '50%', transform: 'translate(50%, -50%)' },
    side: 'right', vertical: 'middle',
  },
]

// ─── Hauptfunktion ─────────────────────────────────────────────────────────────

// Gibt eine Map<player_id → Layout-Objekt> zurück.
// Layout-Objekt enthält: isCorner, side, vertical, posStyle (nur bei Edge)
export function getDisplayPositions(participants) {
  const n      = participants.length
  const result = new Map()

  if (n === 4) {
    // Statisch: P1=unten-links[3], P2=unten-rechts[2], P3=oben-rechts[1], P4=oben-links[0]
    const cornerIdx = [3, 2, 1, 0]
    participants.forEach(p => result.set(p.player_id, CORNERS[cornerIdx[p.seat_position - 1]]))
    return result
  }

  const dealer  = participants.find(p => p.isDealer)
  const sitters = participants.filter(p => p.isSitting)
  const actives = participants.filter(p => !p.isSitting)

  // Nächster Geber = Sitz direkt nach dem aktuellen Geber im Uhrzeigersinn
  const nextDealerSeat = (dealer.seat_position % n) + 1

  // Aktive Spieler in Uhrzeigersinn-Reihenfolge, startend beim nächsten Geber
  const sortedActives = [...actives].sort((a, b) => {
    const aNorm = (a.seat_position - nextDealerSeat + n) % n
    const bNorm = (b.seat_position - nextDealerSeat + n) % n
    return aNorm - bNorm
  })
  // sortedActives[0] → oben-links, [1] → oben-rechts, [2] → unten-rechts, [3] → unten-links
  sortedActives.forEach((p, i) => result.set(p.player_id, CORNERS[i]))

  // Aussetzer: Geber → Kante-links, weitere in Reihenfolge nach Geber → Kante-oben, Kante-rechts
  const sortedSitters = [...sitters].sort((a, b) => {
    if (a.isDealer) return -1
    if (b.isDealer) return  1
    const aNorm = (a.seat_position - dealer.seat_position + n) % n
    const bNorm = (b.seat_position - dealer.seat_position + n) % n
    return aNorm - bNorm
  })
  sortedSitters.forEach((p, i) => result.set(p.player_id, EDGES[i]))

  return result
}

// ─── Sitzstatus ────────────────────────────────────────────────────────────────

// Berechnet für ein bestimmtes Spiel einer Runde wer Geber ist und wer aussetzt
export function calcSeatStatus(participants, gameNumber) {
  const n             = participants.length
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
