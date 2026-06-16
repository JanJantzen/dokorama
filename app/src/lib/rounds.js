// rounds.js – Rundenfortschritt und -ende
//
// Eine Runde ist komplett, wenn alle regulären Spiele (= Anzahl Spieler:innen)
// PLUS alle angesagten Solos gespielt sind. Jeder ANGESAGTE Solo verlängert die
// Runde um 1 Spiel: der/die Solist:in kommt selbst raus und der/die Geber:in muss
// nochmal geben. Ein STILLES Solo zählt NICHT – dort kommt der/die Solist:in nicht
// raus, der/die Geber:in wandert weiter, es gibt kein Zusatzspiel.

import { supabase } from './supabase'

// Solo-Typen, die die Runde verlängern (alle außer Stilles Solo)
export const ANNOUNCED_SOLO_TYPES = ['fleischlos', 'buben_solo', 'damen_solo', 'farb_solo']

// Lädt den Fortschritt einer Runde aus der DB.
//   teilnehmerzahl = Anzahl Spieler:innen der Runde (jede:r gibt einmal = Basis-Spielzahl)
// Rückgabe: { played, announcedSolos, target, isComplete }
export async function loadRoundProgress(roundId, teilnehmerzahl) {
  const { data, error } = await supabase
    .from('games').select('game_type').eq('round_id', roundId)
  if (error) throw error

  const played         = data.length
  const announcedSolos = data.filter(g => ANNOUNCED_SOLO_TYPES.includes(g.game_type)).length
  const target         = teilnehmerzahl + announcedSolos

  return { played, announcedSolos, target, isComplete: played >= target }
}
