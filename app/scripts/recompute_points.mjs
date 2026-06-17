// recompute_points.mjs – Zählpunkte app-erfasster Spiele neu berechnen und korrigieren
//
// Nutzt die (gefixte) calculateGameResult und vergleicht mit den gespeicherten
// zaehlopunkte. Nur Spiele mit exakten Augen (augen_re) – historische Importe
// (Augen-Range, Werte aus Roberts Buch) bleiben unangetastet.
//
// Aufruf (aus dem Repo-Root):
//   node app/scripts/recompute_points.mjs           → Dry-Run (zeigt Abweichungen)
//   node app/scripts/recompute_points.mjs --commit  → schreibt Korrekturen

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { calculateGameResult } from '../src/lib/scoreCalculation.js'

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envText.split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
const commit = process.argv.includes('--commit')

const { data: games, error } = await sb.from('games')
  .select('id, number, game_type, augen_re, rounds(number, sessions(date)), game_results(player_id, partei, sonderrolle, zaehlopunkte, players(name)), announcements(player_id, typ), special_points(player_id, typ, loser_id)')
  .not('augen_re', 'is', null)
if (error) { console.error('DB-Fehler:', error.message); process.exit(1) }

let changedGames = 0, changedRows = 0
const updates = []

for (const g of games) {
  const partyOf = (pid) => g.game_results.find(r => r.player_id === pid)?.partei
  const nameOf  = (pid) => g.game_results.find(r => r.player_id === pid)?.players?.name ?? pid

  const announcements = (g.announcements ?? [])
    .map(a => ({ party: partyOf(a.player_id), type: a.typ }))
    .filter(a => a.party && a.party !== 'ausgesetzt')
  const specialPoints = (g.special_points ?? [])
    .map(sp => ({ type: sp.typ, earnerId: sp.player_id, loserId: sp.loser_id, earnerParty: partyOf(sp.player_id) }))
  const playerResults = g.game_results.map(r => ({ playerId: r.player_id, party: r.partei, specialRole: r.sonderrolle }))

  const { perPlayer } = calculateGameResult({
    reEyes: g.augen_re, gameType: g.game_type, announcements, specialPoints, playerResults,
  })

  const diffs = g.game_results.filter(r => (perPlayer[r.player_id] ?? 0) !== r.zaehlopunkte)
  if (diffs.length) {
    changedGames++
    const date = g.rounds?.sessions?.date
    console.log(`\n${date} · Runde ${g.rounds?.number} · Spiel ${g.number} (${g.game_type})`)
    for (const r of diffs) {
      changedRows++
      console.log(`   ${nameOf(r.player_id).padEnd(10)} ${r.zaehlopunkte}  →  ${perPlayer[r.player_id] ?? 0}`)
      updates.push({ gameId: g.id, playerId: r.player_id, points: perPlayer[r.player_id] ?? 0 })
    }
  }
}

console.log(`\n${changedGames} Spiel(e), ${changedRows} Ergebnis-Zeile(n) mit Abweichung.`)
if (!updates.length) { console.log('Nichts zu korrigieren.'); process.exit(0) }
if (!commit) { console.log('\nDry-Run – nichts geschrieben. Zum Korrigieren: --commit anhängen.'); process.exit(0) }

for (const u of updates) {
  const { error: e } = await sb.from('game_results').update({ zaehlopunkte: u.points })
    .eq('game_id', u.gameId).eq('player_id', u.playerId)
  if (e) { console.error('Update-Fehler:', e.message); process.exit(1) }
}
console.log(`\n✅ ${updates.length} Ergebnis-Zeile(n) korrigiert.`)
