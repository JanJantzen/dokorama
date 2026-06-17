// scoreCalculation.js – Berechnung des Spielwertes nach Jans Doppelkopf-Regeln
// Validiert gegen die 15 Testfälle aus CLAUDE.md Abschnitt 4

// Alle Spieltypen die als Solo zählen (Solist:in spielt 1 gegen 3)
export const SOLO_TYPES = ['fleischlos', 'buben_solo', 'damen_solo', 'farb_solo', 'stilles_solo']
export const isSolo = (gameType) => SOLO_TYPES.includes(gameType)

// Wie viele Augen braucht eine Partei um eine Absage ERFOLGREICH abzuschließen?
// "Keine 90 geschafft" = Gegner hat < 90 Augen = eigene Partei hat >= 151 Augen
const ABSAGE_THRESHOLDS = {
  keine_90: 151,
  keine_60: 181,
  keine_30: 211,
  schwarz:  240,
}

// Ab wie vielen Augen des GEGNERS scheitert eine Absage?
// "Keine 90 scheitert" wenn Gegner >= 90 Augen hat
const ABSAGE_FAIL_THRESHOLDS = {
  keine_90: 90,
  keine_60: 60,
  keine_30: 30,
  schwarz:  1,
}

const ABSAGE_LABELS = {
  keine_90: 'Keine 90',
  keine_60: 'Keine 60',
  keine_30: 'Keine 30',
  schwarz:  'Schwarz',
}

// Gibt alle Absagen zurück, die eine Partei angesagt aber NICHT erreicht hat
function getFailedDeclarations(party, announcements, reEyes) {
  const opponentEyes = party === 're' ? 240 - reEyes : reEyes
  return Object.entries(ABSAGE_FAIL_THRESHOLDS)
    .filter(([type, failThreshold]) =>
      announcements.some(a => a.party === party && a.type === type) &&
      opponentEyes >= failThreshold
    )
    .map(([type]) => type)
}

// Gibt alle Absagen zurück die eine Partei augenmäßig erfüllt hat (egal ob angesagt)
function getAchievedDeclarations(party, reEyes) {
  const ownEyes = party === 're' ? reEyes : 240 - reEyes
  return Object.entries(ABSAGE_THRESHOLDS)
    .filter(([, threshold]) => ownEyes >= threshold)
    .map(([type]) => type)
}

// Hauptfunktion: Berechnet das komplette Spielergebnis
//
// Parameter:
//   reEyes:         Augen der Re-Partei (0–240)
//   gameType:       'normal' | 'hochzeit' | 'armut' | 'fleischlos' | 'buben_solo' | ...
//   announcements:  [{ party: 're'|'kontra', type: 're'|'kontra'|'keine_90'|... }]
//   specialPoints:  [{ type, earnerId, loserId?, earnerParty: 're'|'kontra' }]
//   playerResults:  [{ playerId, party: 're'|'kontra'|'ausgesetzt', specialRole }]
//
// Rückgabe:
//   { winner, spielwert, isTie, perPlayer, breakdown }
export function calculateGameResult({ reEyes, gameType, announcements, specialPoints, playerResults }) {
  const kontraEyes = 240 - reEyes
  const solo = isSolo(gameType)

  // --- 1. Gescheiterte Absagen ermitteln ---
  const reFailed = getFailedDeclarations('re', announcements, reEyes)
  const kontraFailed = getFailedDeclarations('kontra', announcements, reEyes)

  // --- 2. Gewinner bestimmen ---
  // Gescheiterte Absage = sofortige Niederlage der ansagenden Partei, egal wie viele Augen
  const isTie = reEyes === 120 // Gespaltener Arsch: genau 120:120 → Kontra gewinnt, aber nur "Gegen die Alten"
  let winner
  if (reFailed.length > 0)        winner = 'kontra'
  else if (kontraFailed.length > 0) winner = 're'
  else                              winner = reEyes >= 121 ? 're' : 'kontra'

  // --- 3. Augenmäßig erreichte Absagen beider Parteien ---
  const reAchieved    = getAchievedDeclarations('re',    reEyes)
  const kontraAchieved = getAchievedDeclarations('kontra', reEyes)
  const reAnnouncedAndAchieved    = reAchieved.filter(t => announcements.some(a => a.party === 're'    && a.type === t))
  const kontraAnnouncedAndAchieved = kontraAchieved.filter(t => announcements.some(a => a.party === 'kontra' && a.type === t))

  // Aufteilung in Gewinner- und Verlierer-Seite
  const winnerAchieved            = winner === 're' ? reAchieved            : kontraAchieved
  const winnerAnnouncedAchieved   = winner === 're' ? reAnnouncedAndAchieved : kontraAnnouncedAndAchieved
  const loserAchieved             = winner === 're' ? kontraAchieved          : reAchieved
  const loserAnnouncedAchieved    = winner === 're' ? kontraAnnouncedAndAchieved : reAnnouncedAndAchieved
  const loserFailed               = winner === 're' ? kontraFailed            : reFailed

  // --- 4. Grundpunkte berechnen (immer aus Sicht des Gewinners) ---
  let basePoints = 0
  const breakdown = []

  if (isTie) {
    // Gespaltener Arsch: Kontra gewinnt, aber nur "Gegen die Alten", kein "Gewonnen"
    basePoints = 1
    breakdown.push({ label: 'Gespaltener Arsch – Gegen die Alten', points: 1 })
  } else {
    breakdown.push({ label: 'Gewonnen', points: 1 })
    basePoints += 1

    // "Gegen die Alten" gibt es nur im NORMALSPIEL (Kontra ohne Kreuz-Damen schlägt Re).
    // Beim Solo gewinnen die drei Gegner ganz normal – kein "Gegen die Alten".
    if (winner === 'kontra' && !solo) {
      breakdown.push({ label: 'Gegen die Alten', points: 1 })
      basePoints += 1
    }

    if (solo) {
      breakdown.push({ label: 'Solo', points: 1 })
      basePoints += 1
    }

    // Erreichte Absagen des Gewinners (+1 pro Stufe)
    for (const type of winnerAchieved) {
      breakdown.push({ label: `${ABSAGE_LABELS[type]}`, points: 1 })
      basePoints += 1
    }

    // Angesagte UND erreichte Absagen des Gewinners (Bonus +1)
    for (const type of winnerAnnouncedAchieved) {
      breakdown.push({ label: `${ABSAGE_LABELS[type]} angesagt`, points: 1 })
      basePoints += 1
    }

    // Erreichte Absagen des Verlierers zählen ebenfalls für den Gewinner
    for (const type of loserAchieved) {
      breakdown.push({ label: `${ABSAGE_LABELS[type]} (Gegner)`, points: 1 })
      basePoints += 1
    }

    // Angesagte UND erreichte Absagen des Verlierers
    for (const type of loserAnnouncedAchieved) {
      breakdown.push({ label: `${ABSAGE_LABELS[type]} angesagt (Gegner)`, points: 1 })
      basePoints += 1
    }

    // Gescheiterte Absagen des Verlierers: +2 für Gewinner (Deklarationsstrafe)
    for (const type of loserFailed) {
      breakdown.push({ label: `${ABSAGE_LABELS[type]} angesagt und gescheitert`, points: 2 })
      basePoints += 2
    }
  }

  // --- 5. Multiplikator durch Re/Kontra-Ansagen ---
  // Nur Re-Ansage und Kontra-Ansage verdoppeln – Absagen tun das NICHT
  let multiplier = 1
  if (announcements.some(a => a.type === 're'))     multiplier *= 2
  if (announcements.some(a => a.type === 'kontra')) multiplier *= 2

  const spielwert = basePoints * multiplier

  // --- 6. Sonderpunkte (werden NACH der Verdopplung addiert) ---
  const reSpecialCount    = specialPoints.filter(sp => sp.earnerParty === 're').length
  const kontraSpecialCount = specialPoints.filter(sp => sp.earnerParty === 'kontra').length
  const reSpecialNet       = reSpecialCount - kontraSpecialCount // positiv = Re hat netto mehr

  // --- 7. Punkte pro Spieler verteilen ---
  const perPlayer = {}
  for (const p of playerResults) {
    if (p.party === 'ausgesetzt') { perPlayer[p.playerId] = 0; continue }

    const isWinner = p.party === winner
    const isRe = p.party === 're'
    // Sonderpunkt-Saldo aus Sicht dieser Partei (eigene - gegnerische)
    const ownSpecialNet = isRe ? reSpecialNet : -reSpecialNet

    if (solo && p.specialRole === 'solist') {
      // Solist:in bekommt das Dreifache, jeder Gegner das Einfache. Das ×3 wirkt
      // ganz am Ende auf den GESAMTWERT inkl. Sonderpunkte (nicht nur auf die
      // Grundpunkte×Ansage) – nur so heben sich Solist und drei Gegner zu 0 auf.
      perPlayer[p.playerId] = ((isWinner ? 1 : -1) * spielwert + ownSpecialNet) * 3
    } else {
      perPlayer[p.playerId] = (isWinner ? 1 : -1) * spielwert + ownSpecialNet
    }
  }

  return { winner, isTie, basePoints, multiplier, spielwert, reSpecialNet, perPlayer, breakdown }
}

// Leitet den Spieltyp aus den Sonderrollen der Spieler ab
// (kein separater Spieltyp-Input – ergibt sich aus dem was angepinnt wurde)
export function deriveGameType(specialRoles, soloType) {
  const roles = Object.values(specialRoles)
  if (roles.includes('solist'))   return soloType ?? 'buben_solo'
  if (roles.includes('hochzeit')) return 'hochzeit'
  if (roles.includes('arm'))      return 'armut'
  return 'normal'
}
