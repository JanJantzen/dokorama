// draft.js – lokaler Entwurf des laufenden (noch nicht bestätigten) Spiels
//
// Hält den Erfassungs-Zustand des AKTUELLEN Spiels pro Partie im localStorage, damit
// er beim Verlassen des Tisches (Bearbeiten, Hauptmenü, Seiten-Reload) nicht verloren
// geht. Bewusst NICHT in der DB – dort landet ein Spiel weiterhin erst beim Bestätigen.
// Pro Partie (Session-ID) genau ein Entwurf → mehrere parallele Partien stören sich nicht.
// Der Spielnummer-Abgleich verhindert, dass ein veralteter Entwurf zurückkommt.

const key = (sessionId) => `dokorama-draft-${sessionId}`

export function saveDraft(sessionId, gameNumber, gameState) {
  if (!sessionId) return
  try {
    localStorage.setItem(key(sessionId), JSON.stringify({ gameNumber, gameState }))
  } catch { /* localStorage voll/blockiert – nicht kritisch */ }
}

// Gibt den gespeicherten gameState zurück, wenn er zur aktuellen Spielnummer passt – sonst null.
export function loadDraft(sessionId, gameNumber) {
  if (!sessionId) return null
  try {
    const raw = localStorage.getItem(key(sessionId))
    if (!raw) return null
    const draft = JSON.parse(raw)
    return draft.gameNumber === gameNumber ? draft.gameState : null
  } catch { return null }
}

export function clearDraft(sessionId) {
  if (!sessionId) return
  try { localStorage.removeItem(key(sessionId)) } catch { /* egal */ }
}
