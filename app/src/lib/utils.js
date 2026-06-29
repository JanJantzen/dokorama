import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// crypto.randomUUID() ist nur in sicheren Kontexten (HTTPS / localhost) verfügbar.
// Beim Testen über lokale IP (http://192.168.x.x) schlägt es fehl.
// Diese Funktion fällt auf Math.random zurück – für IDs im lokalen Spielzustand völlig ausreichend.
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}
