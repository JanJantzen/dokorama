// stats.js – Datenschicht für die Statistiken (Block C, Tier 1)
//
// Diese Datei ist das FUNDAMENT aller Auswertungen. Sie macht genau zwei Dinge:
//
//   1. Sie LÄDT alle abgeschlossenen Spiele aus der Datenbank (loadStatsData).
//   2. Sie stellt kleine, PURE Hilfsfunktionen bereit, die aus diesen Rohdaten
//      die immer wiederkehrenden Grundgrößen ableiten (Summen, Zähler).
//
// Die eigentlichen Kennzahlen (Gesamtscore, Siegquote, …) werden NICHT hier
// berechnet, sondern in den jeweiligen Statistik-Bausteinen, die auf diese
// Grundgrößen aufsetzen. So bleibt die Datenbeschaffung an EINER Stelle.
//
// Architektur-Entscheidung (Jan, 20.07.2026): erst mal alles LIVE in JavaScript
// rechnen (die Datenmenge ist mit ~1000 Zeilen winzig). Datenbank-Views kommen
// später, falls einzelne Kennzahlen wirklich rechenintensiv werden.
//
// Hinweis: In V1 gibt es genau eine Gruppe ("Dokorama"), und die App filtert
// nirgends nach Gruppe. Deshalb lädt diese Datei schlicht ALLE Daten. Eine
// Gruppen-Filterung wird erst relevant, wenn die App für mehrere Gruppen
// geöffnet wird (Roadmap-Block G).

import { supabase } from './supabase'

// ────────────────────────────────────────────────────────────────────────────
// 1. Der Lader
// ────────────────────────────────────────────────────────────────────────────

// Lädt alle abgeschlossenen Partien mit ihrem kompletten Inhalt und formt sie
// in eine aufgeräumte, leicht auswertbare Struktur um.
//
// Rückgabe:
//   {
//     sessions: [{ id, date }],
//     rounds:   [{ id, sessionId, number, participantIds: [playerId, …] }],
//     games:    [{ id, sessionId, sessionDate, roundId, roundNumber, number,
//                  gameType, results: [{ playerId, partei, sonderrolle, zaehlpunkte }] }],
//     players:  Map(playerId → { id, name, avatarUrl }),
//   }
export async function loadStatsData() {
  // EINE verschachtelte Abfrage von sessions aus nach unten. Warum von sessions
  // und nicht von game_results (wie standings.js)?
  //   - Wir bekommen die Daten gleich als Baum Partie → Runde → Spiel → Ergebnis.
  //   - Der Einstieg über sessions (~12 Zeilen) umgeht das PostgREST-Zeilenlimit
  //     von 1000, das beim Einstieg über game_results (~975 Zeilen) mitwachsend
  //     irgendwann zuschlagen würde.
  //
  // .eq('status', 'abgeschlossen') begrenzt auf fertige Partien. Eine fertige
  // Partie enthält per Definition nur fertige Runden (die laufende Runde wird
  // beim Beenden verworfen), deshalb reicht der Filter auf Partie-Ebene.
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      date,
      created_at,
      venues ( name ),
      rounds (
        id,
        number,
        round_participations ( player_id ),
        games (
          id,
          number,
          game_type,
          game_results (
            player_id,
            partei,
            sonderrolle,
            zaehlpunkte,
            players ( name, avatar_url )
          )
        )
      )
    `)
    .eq('status', 'abgeschlossen')

  if (error) throw error

  // ── Den DB-Baum in flache, bequeme Listen umformen ──
  // Flache Listen lassen sich später einfacher summieren/filtern als tief
  // verschachtelte Objekte. Jeder Eintrag trägt die Verweise (sessionId,
  // roundId, sessionDate) gleich mit, damit man beim Auswerten nicht mehr
  // durch den Baum navigieren muss.
  const sessions = []
  const rounds = []
  const games = []
  const players = new Map()

  for (const s of data ?? []) {
    sessions.push({ id: s.id, date: s.date, createdAt: s.created_at, venue: s.venues?.name ?? null })

    for (const r of s.rounds ?? []) {
      // Wer hat an dieser Runde teilgenommen? (Basis für "pro 4 Runden".)
      const participantIds = (r.round_participations ?? []).map(p => p.player_id)
      rounds.push({ id: r.id, sessionId: s.id, number: r.number, participantIds })

      for (const g of r.games ?? []) {
        const results = (g.game_results ?? []).map(gr => {
          // Spieler:innen-Stammdaten nebenbei einsammeln (einmal pro Person).
          if (!players.has(gr.player_id)) {
            players.set(gr.player_id, {
              id:        gr.player_id,
              name:      gr.players?.name ?? '?',
              avatarUrl: gr.players?.avatar_url ?? null,
            })
          }
          return {
            playerId:    gr.player_id,
            partei:      gr.partei,          // 're' | 'kontra' | 'ausgesetzt'
            sonderrolle: gr.sonderrolle,     // null | 'solist' | 'hochzeit' | …
            zaehlpunkte: gr.zaehlpunkte ?? 0,
          }
        })

        games.push({
          id:           g.id,
          sessionId:    s.id,
          sessionDate:  s.date,
          sessionVenue: s.venues?.name ?? null,
          roundId:      r.id,
          roundNumber: r.number,
          number:      g.number,
          gameType:    g.game_type,
          results,
        })
      }
    }
  }

  return { sessions, rounds, games, players }
}

// ────────────────────────────────────────────────────────────────────────────
// 1b. Zeitraum-Filter (Tier 1, Phase 2)
// ────────────────────────────────────────────────────────────────────────────
// Die Rohdaten werden EINMAL geladen (loadStatsData) und danach nur noch im
// Speicher auf den gewählten Zeitraum zugeschnitten – kein erneuter DB-Zugriff
// beim Umschalten. Das passt zur Architektur "einmal laden, live in JS rechnen".

// Schneidet den geladenen Datensatz auf einen Zeitraum zu und gibt einen NEUEN,
// gleich geformten Datensatz zurück (die Berechnungs-Helfer darunter merken den
// Unterschied nicht – sie bekommen einfach weniger Partien/Runden/Spiele).
//
// bounds = { from, to } als ISO 'YYYY-MM-DD' (kommt aus resolveRange im
// StatsFilterContext). null = offene Grenze. Der Vergleich funktioniert direkt
// auf den ISO-Strings, weil dieses Format lexikografisch = chronologisch ist.
export function filterByPeriod(data, { from, to }) {
  const inRange = (date) => (from == null || date >= from) && (to == null || date <= to)

  const sessions = data.sessions.filter(s => inRange(s.date))
  const keptSessionIds = new Set(sessions.map(s => s.id))
  const rounds = data.rounds.filter(r => keptSessionIds.has(r.sessionId))
  const games  = data.games.filter(g => keptSessionIds.has(g.sessionId))

  // Spieler:innen auf die einschränken, die im Zeitraum überhaupt gespielt haben.
  // Sonst zöge z. B. die Verlaufskurve für Abwesende eine platte Null-Linie.
  const activeIds = new Set()
  for (const g of games) for (const res of g.results) activeIds.add(res.playerId)
  const players = new Map()
  for (const id of activeIds) {
    if (data.players.has(id)) players.set(id, data.players.get(id))
  }

  return { sessions, rounds, games, players }
}

// Welche Kalenderjahre kommen in den Daten überhaupt vor? Absteigend sortiert
// (neuestes zuerst) – Grundlage für die Jahres-Chips im Zeitraum-Umschalter.
export function availableYears(data) {
  const years = new Set(data.sessions.map(s => Number(s.date.slice(0, 4))))
  return [...years].sort((a, b) => b - a)
}

// ────────────────────────────────────────────────────────────────────────────
// 1c. P6 – Mindest-Stichprobe (statistische Belastbarkeit)
// ────────────────────────────────────────────────────────────────────────────
// Quoten und Durchschnitte von Spieler:innen mit sehr wenigen Einheiten sind
// exakt erfasst, aber statistisch bedeutungslos (Beispiel: 1 Partie gespielt,
// Siegquote 100 %). Deshalb DER EINE globale Filter (STATISTIK_KONZEPT.md, P6):
// Eine Quote/ein Durchschnitt gilt erst ab dieser Anzahl zugrunde liegender
// Einheiten als belastbar; darunter wird sie in der UI gedämpft (grau + kursiv)
// und beim Sortieren nach hinten gerückt – aber NICHT versteckt (die absolute
// Zahl daneben, z. B. „1 von 1", bleibt der Ehrlichkeits-Anker).
//
// Absolute Zahlen (Summen, Zähler, Extremwerte) sind immun – sie stimmen immer,
// egal aus wie wenigen Einheiten sie stammen.
//
// Die Schwelle steht bewusst an EINER Stelle. Statistisch gibt es keine exakte
// Grenze (die Unsicherheit sinkt glatt mit wachsendem n); 8 ist eine runde,
// gut kommunizierbare Rausch-Schwelle, die nur das offensichtlich Sinnlose
// (n = 1…7) aussiebt. Perspektivisch pro Gruppe konfigurierbar.
export const P6_MIN_SAMPLE = 8

// Ist eine Stichprobe von n Einheiten zu dünn, um belastbar zu sein?
// n == null (unbekannt) gilt NICHT als dünn – dann liegt gar kein Wert vor,
// und der Null-Fall wird anderswo schon als „–" behandelt.
export function isWeakSample(n) {
  return n != null && n < P6_MIN_SAMPLE
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Grundgrößen (pure Hilfsfunktionen)
// ────────────────────────────────────────────────────────────────────────────
// "Pur" heißt: gleiche Eingabe → gleiche Ausgabe, keine Datenbank, keine
// Seiteneffekte. Reines Rechnen auf dem bereits geladenen Datensatz.

// Gesamtscore-Basis: Summe der Zählpunkte je Spieler:in über ALLE Spiele.
// Das ist bereits der Kern der Kennzahl G1 (Gesamtscore). Ausgesetzt-Zeilen
// tragen zaehlpunkte = 0 bei und verfälschen die Summe daher nicht.
// Rückgabe: Map(playerId → summe)
export function playerTotals(data) {
  const totals = new Map()
  for (const game of data.games) {
    for (const res of game.results) {
      totals.set(res.playerId, (totals.get(res.playerId) ?? 0) + res.zaehlpunkte)
    }
  }
  return totals
}

// Gespielte Runden je Spieler:in – der Nenner für die "pro 4 Runden"-Normierung.
// Gezählt werden die Runden, an denen die Person TEILGENOMMEN hat (aus
// round_participations), nicht die der ganzen Gruppe – so ist die Normierung
// fair für Spätankömmlinge und Früh-Geher.
// Rückgabe: Map(playerId → anzahl runden)
export function playedRoundsByPlayer(data) {
  const counts = new Map()
  for (const round of data.rounds) {
    for (const playerId of round.participantIds) {
      counts.set(playerId, (counts.get(playerId) ?? 0) + 1)
    }
  }
  return counts
}

// Gespielte SPIELE je Spieler:in – Nenner für den Durchschnittsscore "pro Spiel".
// Gezählt werden nur Spiele, in denen die Person wirklich MITGESPIELT hat
// (partei ≠ 'ausgesetzt'). Ausgesetzt-Zeilen tragen 0 Punkte bei und dürfen den
// Schnitt nicht verwässern.
// Rückgabe: Map(playerId → anzahl spiele)
export function playedGamesByPlayer(data) {
  const counts = new Map()
  for (const game of data.games) {
    for (const res of game.results) {
      if (res.partei === 'ausgesetzt') continue
      counts.set(res.playerId, (counts.get(res.playerId) ?? 0) + 1)
    }
  }
  return counts
}

// Gespielte PARTIEN je Spieler:in – Nenner für den Durchschnittsscore "pro Partie".
// Eine Partie zählt, wenn die Person an mindestens einer ihrer Runden teilnahm.
// Rückgabe: Map(playerId → anzahl partien)
export function playedSessionsByPlayer(data) {
  const sessionsByPlayer = new Map() // playerId → Set(sessionId)
  for (const round of data.rounds) {
    for (const playerId of round.participantIds) {
      let set = sessionsByPlayer.get(playerId)
      if (!set) { set = new Set(); sessionsByPlayer.set(playerId, set) }
      set.add(round.sessionId)
    }
  }
  const counts = new Map()
  for (const [playerId, set] of sessionsByPlayer) counts.set(playerId, set.size)
  return counts
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Saldo pro Einheit (gemeinsame Grundgröße für L7 und L2/L3/L4)
// ────────────────────────────────────────────────────────────────────────────
// Bisher hatten wir nur Summen PRO SPIELER:IN. Für „bester/schlechtester Wert"
// und für „Erster/Letzter" brauchen wir aber den Saldo JE EINHEIT: Was hat jede
// Person in DIESEM einen Spiel / DIESER einen Runde / DIESER einen Partie geholt?

// Liefert für eine Ebene je Einheit deren Kontext (Datum/Ort) samt der
// Salden je Spieler:in.
//   level = 'game'    → ein Eintrag je Spiel (nur Mitspielende, kein Ausgesetzt)
//   level = 'round'   → ein Eintrag je Runde  (Spiele der Runde aufsummiert)
//   level = 'session' → ein Eintrag je Partie (Spiele der Partie aufsummiert)
// Datum/Ort stammen aus der Partie, zu der die Einheit gehört (bei Runde/Partie
// aus einem beliebigen Spiel der Einheit – alle teilen dieselbe Partie).
// Rückgabe: [{ date, venue, players: Map(playerId → saldo) }, …]
export function unitSaldi(data, level) {
  if (level === 'game') {
    // Je Spiel: die Zählpunkte direkt aus den Ergebniszeilen. Ausgesetzt-Zeilen
    // überspringen – wer nicht mitspielte, hat für dieses Spiel keinen Wert
    // (eine 0 würde „bester/schlechtester Wert" verfälschen).
    return data.games.map(g => {
      const players = new Map()
      for (const res of g.results) {
        if (res.partei === 'ausgesetzt') continue
        players.set(res.playerId, (players.get(res.playerId) ?? 0) + res.zaehlpunkte)
      }
      return { date: g.sessionDate, venue: g.sessionVenue, players }
    })
  }

  // 'round' oder 'session': alle Spiele der Einheit je Spieler:in aufsummieren.
  // Hier zählen Ausgesetzt-Zeilen als 0 mit – der Saldo einer Runde/Partie
  // schließt das ausgesetzte Spiel korrekt als Nullbeitrag ein.
  const key = level === 'round' ? 'roundId' : 'sessionId'
  const byUnit = new Map() // unitId → { date, venue, players: Map(playerId → saldo) }
  for (const g of data.games) {
    const unitId = g[key]
    let unit = byUnit.get(unitId)
    if (!unit) {
      unit = { date: g.sessionDate, venue: g.sessionVenue, players: new Map() }
      byUnit.set(unitId, unit)
    }
    for (const res of g.results) {
      unit.players.set(res.playerId, (unit.players.get(res.playerId) ?? 0) + res.zaehlpunkte)
    }
  }
  return [...byUnit.values()]
}

// L7 Bester/schlechtester Wert: durchläuft alle Einheiten einer Ebene und merkt
// sich je Spieler:in den höchsten und tiefsten Einzelsaldo – samt Datum/Ort der
// Einheit, in der er erzielt wurde (für die Rekord-Anzeige). Bei Gleichstand
// bleibt der zuerst gefundene Rekord stehen.
// Rückgabe: { best: Map(pid → {value,date,venue}), worst: Map(pid → {value,date,venue}) }
export function bestWorstSaldo(data, level) {
  const units = unitSaldi(data, level)
  const best = new Map()
  const worst = new Map()
  for (const u of units) {
    for (const [pid, saldo] of u.players) {
      const b = best.get(pid)
      if (!b || saldo > b.value)  best.set(pid,  { value: saldo, date: u.date, venue: u.venue })
      const w = worst.get(pid)
      if (!w || saldo < w.value)  worst.set(pid, { value: saldo, date: u.date, venue: u.venue })
    }
  }
  return { best, worst }
}

// L2/L3/L4 in EINEM Durchgang: zählt je Spieler:in über alle Einheiten einer
// Ebene, wie oft sie Erste:r bzw. Letzte:r wurde und wie ihr Netto-Saldo ausfiel.
//
// Regeln (aus STATISTIK_KONZEPT.md):
//   • Erster = höchster Saldo der Einheit, Letzter = tiefster. Geteilte Plätze
//     gelten VOLL für alle Beteiligten (zwei punktgleich vorn = beide Erster).
//   • Sind ALLE gleich (kein Abstand zwischen höchstem und tiefstem), gibt es
//     keine:n klare:n Erste:n/Letzte:n → niemand bekommt hier einen Zähler.
//   • Netto: eigener Saldo > 0 positiv, < 0 negativ, exakt 0 neutral.
//   • 'units' ist der Nenner für die Quoten (Einheiten, an denen man teilnahm).
//
// level = 'round' | 'session' (auf Spielebene gibt es das nicht – dort zählt
// Sieg/Niederlage, L1, das das Gewinner-Flag braucht → Phase 5).
// Rückgabe: Map(playerId → { units, erster, letzter, pos, neutral, neg })
export function placementStats(data, level) {
  const acc = new Map()
  const bump = (pid) => {
    let a = acc.get(pid)
    if (!a) { a = { units: 0, erster: 0, letzter: 0, pos: 0, neutral: 0, neg: 0 }; acc.set(pid, a) }
    return a
  }

  for (const u of unitSaldi(data, level)) {
    const saldi = [...u.players.values()]
    if (saldi.length === 0) continue
    const max = Math.max(...saldi)
    const min = Math.min(...saldi)
    const spread = max !== min   // nur bei echtem Abstand gibt es Erste:n/Letzte:n

    for (const [pid, s] of u.players) {
      const a = bump(pid)
      a.units += 1
      if (spread && s === max) a.erster += 1
      if (spread && s === min) a.letzter += 1
      if (s > 0) a.pos += 1
      else if (s < 0) a.neg += 1
      else a.neutral += 1
    }
  }
  return acc
}

// Bereitet die Daten für die kumulierte Verlaufskurve auf: Gesamtscore ABSOLUT
// über die Zeit, ein Punkt je Partie (chronologisch). Nur absolut – „Schnitt"
// ist ein Durchschnitt und lässt sich nicht sinnvoll aufsummieren.
// Rückgabe:
//   {
//     points:  [{ label, <playerId>: kumulierterStand, … }],  // ein Objekt je Partie
//     players: [{ id, name }],                                 // nach Endstand absteigend
//   }
export function buildScoreCurve(data) {
  // 1. Partien chronologisch sortieren (nach Datum; bei gleichem Datum nach
  //    created_at, damit mehrere Partien am selben Tag eine stabile Reihenfolge haben).
  const sessions = [...data.sessions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return (a.createdAt ?? '') < (b.createdAt ?? '') ? -1 : 1
  })

  // 2. Punktezuwachs je Partie und Spieler:in vorberechnen:
  //    Map(sessionId → Map(playerId → Summe der Zählpunkte in dieser Partie)).
  const deltaBySession = new Map()
  for (const game of data.games) {
    let perPlayer = deltaBySession.get(game.sessionId)
    if (!perPlayer) { perPlayer = new Map(); deltaBySession.set(game.sessionId, perPlayer) }
    for (const res of game.results) {
      perPlayer.set(res.playerId, (perPlayer.get(res.playerId) ?? 0) + res.zaehlpunkte)
    }
  }

  // 3. Laufende Summe je Spieler:in mitführen und nach jeder Partie einen
  //    Kurvenpunkt festhalten. Wer an einer Partie nicht teilnahm, behält seinen
  //    Stand – die Linie bleibt an dieser Stelle flach.
  const running = new Map()
  const points = []
  for (const s of sessions) {
    const delta = deltaBySession.get(s.id)
    if (delta) {
      for (const [pid, d] of delta) running.set(pid, (running.get(pid) ?? 0) + d)
    }
    const point = { label: shortDate(s.date) }
    for (const pid of data.players.keys()) point[pid] = running.get(pid) ?? 0
    points.push(point)
  }

  // 4. Spieler:innen nach Endstand absteigend – bestimmt die Reihenfolge der
  //    Linien/Legende (führend zuerst).
  const players = [...data.players.values()]
    .map(p => ({ id: p.id, name: p.name }))
    .sort((a, b) => (running.get(b.id) ?? 0) - (running.get(a.id) ?? 0))

  return { points, players }
}

// Kurzes Datumslabel „T.M." aus einem ISO-Datum (YYYY-MM-DD).
function shortDate(iso) {
  const [, m, d] = iso.split('-')
  return `${Number(d)}.${Number(m)}.`
}
