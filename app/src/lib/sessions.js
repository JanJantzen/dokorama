// sessions.js – Partien für den Homescreen laden, löschen, Datum formatieren
//
// loadSessions holt alle Partien mit Ort, Spieler:innen (eindeutig über alle Runden)
// und – bei laufenden Partien – dem aktuellen Runden-/Spielfortschritt. Sortiert nach
// Startzeitpunkt (created_at), neueste zuerst.

import { supabase } from './supabase'

// "16. Juni 2026"
export function formatSessionDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function loadSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, date, status, created_at, venues(name), rounds(number, status, games(id), round_participations(seat_position, players(id, name)))')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map(s => {
    const rounds = [...(s.rounds ?? [])].sort((a, b) => a.number - b.number)

    // Spieler:innen eindeutig über alle Runden (in Sitzreihenfolge der ersten Runde)
    const byId = new Map()
    for (const r of rounds)
      for (const rp of [...(r.round_participations ?? [])].sort((a, b) => a.seat_position - b.seat_position))
        if (rp.players && !byId.has(rp.players.id)) byId.set(rp.players.id, rp.players.name)
    const playerNames = [...byId.values()]

    // Fortschritt der laufenden Runde (nur bei laufenden Partien)
    let progress = null
    if (s.status === 'laufend') {
      const live = rounds.find(r => r.status === 'laufend') ?? rounds[rounds.length - 1]
      if (live) progress = { round: live.number, game: (live.games?.length ?? 0) + 1 }
    }

    return {
      id:        s.id,
      date:      s.date,
      status:    s.status,
      createdAt: s.created_at,
      venueName: s.venues?.name ?? null,
      playerNames,
      progress,
    }
  })
}

// Löscht eine Partie. Runden, Spiele, Ergebnisse etc. gehen per ON DELETE CASCADE mit.
export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}
