// import_session.mjs – Historische Partie aus einem ROBERT_IMPORT-JSON in die DB importieren
//
// Aufruf (aus dem Repo-Root):
//   node app/scripts/import_session.mjs database/imports/<datei>.json            → Dry-Run (prüft & zeigt, schreibt NICHTS)
//   node app/scripts/import_session.mjs database/imports/<datei>.json --commit   → schreibt wirklich (alles-oder-nichts)
//
// Übersetzt das menschenlesbare JSON-Format (ROBERT_IMPORT.md) in das DB-Schema:
//   - Slugs (jan, robert, …) → echte player-UUIDs (über den Namen)
//   - group "jan-runde" → Gruppe "Dokorama"; venue null
//   - alte Enum-Namen → aktuelles Schema (hochzeiter→hochzeit, armut→arm, retter→reich; completed→abgeschlossen)
//   - Feldnamen (party→partei, points→zaehlpunkte, type→typ, solo_color→farbe)
// Fehlende Werte bleiben null. Bei Fehlern wird NICHT importiert.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ── Env aus app/.env laden ──────────────────────────────────────────────────
const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envText.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

// ── Argumente ───────────────────────────────────────────────────────────────
const [, , file, ...flags] = process.argv
const commit = flags.includes('--commit')
if (!file) {
  console.error('Aufruf: node app/scripts/import_session.mjs <datei.json> [--commit]')
  process.exit(1)
}

// ── Mappings JSON-Format → DB-Schema ────────────────────────────────────────
const SLUG_TO_NAME = { jan: 'Jan', robert: 'Robert', dani: 'Dani', sophia: 'Sophia', joern: 'Jörn', kathrin: 'Kathrin' }
const ROLE_MAP = {
  solist: 'solist', eingeheiratet: 'eingeheiratet',
  hochzeiter: 'hochzeit', hochzeit: 'hochzeit',
  armut: 'arm', arm: 'arm', retter: 'reich', reich: 'reich',
}
const STATUS_MAP = { completed: 'abgeschlossen', abgeschlossen: 'abgeschlossen', laufend: 'laufend' }
const GAME_TYPES = ['normal', 'hochzeit', 'armut', 'fleischlos', 'buben_solo', 'damen_solo', 'farb_solo', 'stilles_solo']
const FARBEN = ['karo', 'herz', 'pik', 'kreuz']
const ANN_TYPES = ['re', 'kontra', 'keine_90', 'keine_60', 'keine_30', 'schwarz']
const SP_TYPES = ['fuchs_gefangen', 'karlchen_gemacht', 'karlchen_gefangen', 'doppelkopf']

const errors = []
const warnings = []
const err  = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

// ── JSON laden ──────────────────────────────────────────────────────────────
let data
try {
  data = JSON.parse(readFileSync(file, 'utf8'))
} catch (e) {
  console.error('❌ Datei nicht lesbar / kein gültiges JSON:', e.message)
  process.exit(1)
}

// ── Stammdaten laden (Spieler, Gruppe) ──────────────────────────────────────
const { data: players, error: pErr } = await sb.from('players').select('id, name')
if (pErr) { console.error('❌ DB-Fehler (players):', pErr.message); process.exit(1) }
const nameToId = new Map(players.map(p => [p.name, p.id]))

const { data: groups } = await sb.from('groups').select('id, name')
const groupId = groups?.find(g => g.name === 'Dokorama')?.id ?? null
if (!groupId) err('Gruppe "Dokorama" nicht in der DB gefunden.')

// Slug → UUID (über den Namen). Sammelt Fehler statt zu raten.
function resolvePlayer(slug, context) {
  if (slug == null) return null
  const name = SLUG_TO_NAME[slug]
  if (!name) { err(`Unbekannter Spieler-Slug "${slug}" (${context}).`); return null }
  const id = nameToId.get(name)
  if (!id) { err(`Spieler "${name}" (Slug ${slug}) nicht in der DB (${context}).`); return null }
  return id
}

// ── Aufbereiten + Validieren ────────────────────────────────────────────────
const s = data.session ?? {}
if (!s.date) err('session.date fehlt.')

const session = {
  group_id: groupId,
  venue_id: null,                                   // historische Abende ohne Ort
  date:     s.date ?? null,
  status:   STATUS_MAP[s.status] ?? 'abgeschlossen',
}

const rounds = (data.rounds ?? []).map(r => {
  const participations = (r.participations ?? []).map(p => ({
    player_id:     resolvePlayer(p.player_id, `Runde ${r.number} Teilnahme`),
    seat_position: p.seat_position,
  }))

  // Spiele in Reihenfolge bringen und pro Runde neu bei 1 nummerieren (App-Konvention).
  // Die Original-Nummer (g.number) wird nur noch für Fehlermeldungen referenziert.
  const sortedGames = [...(r.games ?? [])].sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
  const games = sortedGames.map((g, gi) => {
    const num = gi + 1
    if (!GAME_TYPES.includes(g.game_type)) err(`Runde ${r.number} Spiel ${g.number}: unbekannter game_type "${g.game_type}".`)
    if (g.game_type === 'farb_solo' && !FARBEN.includes(g.solo_color)) err(`Runde ${r.number} Spiel ${g.number}: Farb-Solo ohne gültige solo_color.`)
    // Augen: augen_re und min/max schließen sich aus
    if (g.augen_re != null && (g.augen_re_min != null || g.augen_re_max != null))
      err(`Runde ${r.number} Spiel ${g.number}: augen_re UND augen_re_min/max gesetzt (schließt sich aus).`)

    const results = (g.results ?? []).map(res => {
      if (!['re', 'kontra', 'ausgesetzt'].includes(res.party)) err(`R${r.number} S${g.number}: ungültige party "${res.party}".`)
      if (res.special_role != null && !ROLE_MAP[res.special_role]) err(`R${r.number} S${g.number}: unbekannte special_role "${res.special_role}".`)
      return {
        player_id:    resolvePlayer(res.player_id, `R${r.number} S${g.number} Ergebnis`),
        partei:       res.party,
        sonderrolle:  res.special_role != null ? ROLE_MAP[res.special_role] : null,
        zaehlpunkte: res.points ?? 0,
      }
    })
    // Nullsummen-Check über die gelisteten (aktiven) Spieler
    const sum = results.reduce((a, x) => a + (x.zaehlpunkte ?? 0), 0)
    if (sum !== 0) warn(`R${r.number} S${g.number}: Summe der Punkte ist ${sum}, nicht 0.`)

    const announcements = (g.announcements ?? []).map(a => {
      if (!ANN_TYPES.includes(a.type)) err(`R${r.number} S${g.number}: unbekannte Ansage "${a.type}".`)
      return { player_id: resolvePlayer(a.player_id, `R${r.number} S${g.number} Ansage`), typ: a.type }
    })

    const special_points = (g.special_points ?? []).map(sp => {
      if (!SP_TYPES.includes(sp.type)) err(`R${r.number} S${g.number}: unbekannter Sonderpunkt "${sp.type}".`)
      return {
        player_id: resolvePlayer(sp.player_id, `R${r.number} S${g.number} Sonderpunkt`),
        typ:       sp.type,
        loser_id:  sp.loser_id != null ? resolvePlayer(sp.loser_id, `R${r.number} S${g.number} Sonderpunkt-Verlierer`) : null,
      }
    })

    return {
      number:       num,
      game_type:    g.game_type,
      farbe:        g.solo_color ?? null,
      augen_re:     g.augen_re ?? null,
      augen_re_min: g.augen_re_min ?? null,
      augen_re_max: g.augen_re_max ?? null,
      results, announcements, special_points,
    }
  })

  return { number: r.number, status: STATUS_MAP[r.status] ?? 'abgeschlossen', participations, games }
})

// Duplikat-Check: existiert schon eine Partie mit diesem Datum in der Gruppe?
if (session.date && groupId) {
  const { data: existing } = await sb.from('sessions').select('id').eq('group_id', groupId).eq('date', session.date)
  if (existing && existing.length > 0)
    warn(`Es existiert bereits ${existing.length} Partie(n) mit Datum ${session.date} in dieser Gruppe – evtl. Doppel-Import.`)
}

// ── Bericht ─────────────────────────────────────────────────────────────────
const gameCount = rounds.reduce((a, r) => a + r.games.length, 0)
console.log('')
console.log(`Partie: ${session.date}  ·  Status: ${session.status}  ·  Runden: ${rounds.length}  ·  Spiele: ${gameCount}`)
for (const r of rounds) {
  console.log(`  Runde ${r.number} (${r.games.length} Spiele, ${r.participations.length} Teilnehmer)`)
  for (const g of r.games) {
    const rePts = g.results.find(x => x.partei === 're')?.zaehlpunkte ?? 0
    const win = rePts >= 0 ? 'Re' : 'Kontra'
    const extra = g.game_type !== 'normal' ? ` [${g.game_type}]` : ''
    console.log(`    Spiel ${g.number}: ${win} ${rePts >= 0 ? '+' : ''}${rePts}${extra}`)
  }
}
if (warnings.length) { console.log('\n⚠️  Warnungen:'); warnings.forEach(w => console.log('   - ' + w)) }
if (errors.length)   { console.log('\n❌ Fehler:');     errors.forEach(e => console.log('   - ' + e)) }

if (errors.length) {
  console.log('\nImport abgebrochen – bitte Fehler beheben.')
  process.exit(1)
}
if (!commit) {
  console.log('\n✅ Dry-Run ok – nichts geschrieben. Zum echten Import: --commit anhängen.')
  process.exit(0)
}

// ── Schreiben (alles-oder-nichts: bei Fehler Session wieder löschen) ─────────
let sessionId = null
try {
  const { data: ins, error: e1 } = await sb.from('sessions').insert(session).select('id').single()
  if (e1) throw e1
  sessionId = ins.id

  for (const r of rounds) {
    const { data: rIns, error: e2 } = await sb.from('rounds')
      .insert({ session_id: sessionId, number: r.number, status: r.status }).select('id').single()
    if (e2) throw e2
    const roundId = rIns.id

    if (r.participations.length) {
      const { error: e3 } = await sb.from('round_participations')
        .insert(r.participations.map(p => ({ round_id: roundId, player_id: p.player_id, seat_position: p.seat_position })))
      if (e3) throw e3
    }

    for (const g of r.games) {
      const { data: gIns, error: e4 } = await sb.from('games').insert({
        round_id: roundId, number: g.number, game_type: g.game_type, farbe: g.farbe,
        augen_re: g.augen_re, augen_re_min: g.augen_re_min, augen_re_max: g.augen_re_max,
      }).select('id').single()
      if (e4) throw e4
      const gameId = gIns.id

      if (g.results.length) {
        const { error: e5 } = await sb.from('game_results')
          .insert(g.results.map(x => ({ game_id: gameId, ...x })))
        if (e5) throw e5
      }
      if (g.announcements.length) {
        const { error: e6 } = await sb.from('announcements')
          .insert(g.announcements.map(x => ({ game_id: gameId, ...x })))
        if (e6) throw e6
      }
      if (g.special_points.length) {
        const { error: e7 } = await sb.from('special_points')
          .insert(g.special_points.map(x => ({ game_id: gameId, ...x })))
        if (e7) throw e7
      }
    }
  }

  console.log(`\n✅ Importiert: Partie ${session.date} (id ${sessionId}).`)
} catch (e) {
  console.error('\n❌ Import fehlgeschlagen:', e.message)
  if (sessionId) {
    await sb.from('sessions').delete().eq('id', sessionId) // Cascade räumt Runden/Spiele wieder ab
    console.error('   Angefangener Import wurde rückgängig gemacht (Session gelöscht).')
  }
  process.exit(1)
}
