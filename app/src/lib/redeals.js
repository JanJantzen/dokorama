// redeals.js – Datenbankzugriffe für Neugeben-Events
//
// Neugeben-Events werden in round_redeals gespeichert.
// Sie sind keine Spiele – kein Score, keine Teams, nur Typ + Geber + Verursacher.

import { supabase } from '@/lib/supabase'

// Speichert ein Neugeben-Event in der DB. Gibt den gespeicherten Datensatz zurück.
export async function saveRedeal({ roundId, redealType, dealerId, culpritId }) {
  const { data, error } = await supabase
    .from('round_redeals')
    .insert({
      round_id:    roundId,
      redeal_type: redealType,
      dealer_id:   dealerId,
      culprit_id:  culpritId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Löscht ein einzelnes Neugeben-Event (z.B. wenn falsch erfasst).
export async function deleteRedeal(id) {
  const { error } = await supabase
    .from('round_redeals')
    .delete()
    .eq('id', id)
  if (error) throw error
}
