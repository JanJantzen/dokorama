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
    sessions.push({ id: s.id, date: s.date, createdAt: s.created_at })

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
          id:          g.id,
          sessionId:   s.id,
          sessionDate: s.date,
          roundId:     r.id,
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
