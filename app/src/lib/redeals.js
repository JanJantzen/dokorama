// redeals.js – Datenbankzugriffe für Neugeben-Events
//
// Redeals leben während der Erfassung im GameContext-State (und damit im live_draft).
// Erst beim Bestätigen des Spiels werden sie gemeinsam mit der dann bekannten game_id
// in round_redeals geschrieben. Cascade-Delete auf games.id räumt sie automatisch auf.

import { supabase } from '@/lib/supabase'

// Schreibt alle Redeals eines Spiels auf einmal in die DB.
// Wird in handleConfirm (SessionPage) aufgerufen, nachdem die game_id bekannt ist.
export async function saveRedealsForGame(gameId, redeals, dealerId) {
  if (!redeals || redeals.length === 0) return
  const rows = redeals.map(r => ({
    game_id:     gameId,
    redeal_type: r.redealType,
    dealer_id:   dealerId,
    culprit_id:  r.culpritId,
  }))
  const { error } = await supabase.from('round_redeals').insert(rows)
  if (error) throw error
}
