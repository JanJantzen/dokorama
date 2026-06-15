// standings.js – Punktestand einer Partie aus der Datenbank
//
// Die Punkte liegen verteilt: game_results (Punkte je Spieler:in) → games → rounds
// → session. Diese Funktion holt mit EINER Abfrage alle Ergebnisse einer Partie über
// diese Kette und summiert sie pro Spieler:in. Quelle ist also die DB (Single Source
// of Truth) – der Stand überlebt einen Reload und stimmt immer mit dem Gespeicherten.
//
// Wird vom Scoreboard (Trophy-Button) genutzt und später beim Rundenübergang und in
// den Statistiken wiederverwendet.

import { supabase } from './supabase'

// Lädt die Rangliste einer Partie: [{ player_id, name, avatar_url, total }],
// absteigend nach Punkten sortiert.
export async function loadStandings(sessionId) {
  // !inner = nur game_results, die wirklich an einer Runde DIESER Partie hängen.
  // Über die verschachtelte Beziehung filtern wir auf die session_id.
  const { data, error } = await supabase
    .from('game_results')
    .select('player_id, zaehlopunkte, players(name, avatar_url), games!inner(rounds!inner(session_id))')
    .eq('games.rounds.session_id', sessionId)

  if (error) throw error

  // Pro Spieler:in summieren
  const byPlayer = new Map()
  for (const row of data) {
    const entry = byPlayer.get(row.player_id) ?? {
      player_id:  row.player_id,
      name:       row.players?.name ?? '?',
      avatar_url: row.players?.avatar_url ?? null,
      total:      0,
    }
    entry.total += row.zaehlopunkte ?? 0
    byPlayer.set(row.player_id, entry)
  }

  return [...byPlayer.values()].sort((a, b) => b.total - a.total)
}
