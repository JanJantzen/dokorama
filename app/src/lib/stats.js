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
//     rounds:   [{ id, sessionId, number, participantIds: [playerId, …],
//                  participants: [{ playerId, seat }] }],
//     games:    [{ id, sessionId, sessionDate, roundId, roundNumber, number,
//                  gameType, createdAt, winner: 're'|'kontra'|null,
//                  redealDealerIds: [playerId, …],
//                  results: [{ playerId, partei, sonderrolle, zaehlpunkte }] }],
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
        round_participations ( player_id, seat_position ),
        games (
          id,
          number,
          game_type,
          augen_re,
          augen_re_min,
          augen_re_max,
          created_at,
          game_results (
            player_id,
            partei,
            sonderrolle,
            zaehlpunkte,
            players ( name, avatar_url )
          ),
          special_points ( player_id ),
          round_redeals ( dealer_id )
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
      // Zusätzlich mit Sitzposition – nötig für die Geber-Rotation (A5). seat = 1
      // ist der/die erste Geber:in der Runde; die Rotation läuft 1 → n → 1.
      const participants = (r.round_participations ?? []).map(p => ({
        playerId: p.player_id,
        seat:     p.seat_position,
      }))
      rounds.push({ id: r.id, sessionId: s.id, number: r.number, participantIds, participants })

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
          createdAt:   g.created_at,     // Zeitstempel (für Spielzeit A6/A7; im Import = Import-Zeit)
          augenRe:     g.augen_re,       // exakte Re-Augen (App-Erfassung) …
          augenReMin:  g.augen_re_min,   // … oder Range aus dem historischen Import
          augenReMax:  g.augen_re_max,
          // Gewinner:innen der Sonderpunkte dieses Spiels (player_id = wer ihn erzielt
          // hat). Für Partie-Steckbrief 8.3: Anzahl (= .length) + Pro-Person-Zeile.
          specialPointPlayers: (g.special_points ?? []).map(sp => sp.player_id),
          // Geber:innen der gescheiterten Gebversuche an diesem Spiel (Quelle 3
          // für A5). Jedes Neugeben ist eine zusätzliche Gabe – egal aus welcher
          // Ursache (fünf Neunen / Armut ohne Retter / trumpfschwach / vergeben).
          redealDealerIds: (g.round_redeals ?? []).map(rd => rd.dealer_id),
          winner:      deriveWinner(g, results),   // 're' | 'kontra' | null (Basis für L1/L5/L9)
          results,
        })
      }
    }
  }

  return { sessions, rounds, games, players }
}

// Leitet für ein geladenes Spiel den Gewinner ('re' | 'kontra' | null) ab –
// aus den gespeicherten Zählpunkten, NICHT aus den Augen. Grund (Phase-5-Verifikation):
// die Augen sind in manchen Altimporten unvollständig/platzhalterhaft, die gebuchten
// Punkte dagegen sind überall Roberts belastbare Realität. Und: alle anderen Kennzahlen
// vertrauen ohnehin den Punkten – so bleibt der Gewinner widerspruchsfrei zum Rest.
//
// Der Trick ("Auspacken"): Gewinner ist, wer den positiven SPIELWERT hat. Sonderpunkte
// werden NACH dem Spielwert draufgerechnet und können das Vorzeichen der Zählpunkte
// kippen (Testfall 13: Gewinner mit Minuspunkten). Rechnet man den Sonderpunkte-Saldo
// wieder heraus, bleibt der reine Spielwert übrig – und dessen Vorzeichen ist eindeutig.
//
// Für eine:n KONTRA-Spieler:in (die sind nie der ×3-Solist, also kein Skalierungs-Faktor):
//   u = zaehlpunkte + reSpecialNet   ( = ±Spielwert, nie 0 )
//   u < 0 → Re hat gewonnen, sonst Kontra.
// reSpecialNet = Sonderpunkte der Re-Seite minus die der Kontra-Seite.
function deriveWinner(g, results) {
  const parteiOf = (pid) => results.find(r => r.playerId === pid)?.partei
  let reSp = 0, koSp = 0
  for (const sp of g.special_points ?? []) {
    const partei = parteiOf(sp.player_id)
    if (partei === 're') reSp++
    else if (partei === 'kontra') koSp++
  }
  const reSpecialNet = reSp - koSp

  const kontra = results.find(r => r.partei === 'kontra')
  if (!kontra) return null // kein Kontra-Team (dürfte nie vorkommen) → nicht bestimmbar

  const u = kontra.zaehlpunkte + reSpecialNet
  return u < 0 ? 're' : 'kontra'
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
// 1b'. Personen-Filter (Achse 5, Tier 2, Phase 9)
// ────────────────────────────────────────────────────────────────────────────
// Zwilling zu filterByPeriod, nur nach "wer mitgespielt hat" statt "wann". Grenzt
// den Datensatz auf die Spiele einer gewählten Personen-Konstellation ein:
// behalten wird ein Spiel nur, wenn JEDE gewählte Person darin mitgespielt hat
// (Schnittmenge – "nur die gemeinsamen Spiele"). Für EINE Person heißt das
// schlicht "alle Spiele dieser Person" (der Fall des Spieler-Steckbriefs).
//
// Wie beim Zeitraum-Filter: reine Einschränkung im Speicher, kein neuer
// DB-Zugriff, gleiche Datenform zurück. Anders als der Zeitraum (der ganze
// Partien rein/raus nimmt) schneidet dieser Filter auf SPIEL-Ebene – deshalb
// werden danach leer gewordene Runden und Partien mit weggeräumt, damit der
// zurückgegebene Datensatz in sich stimmig bleibt.
//
// personIds = Liste gewählter Spieler-IDs. Leere Liste = kein Filter (Daten
// unverändert zurück, wie ein offener Zeitraum).
export function filterByPersons(data, personIds) {
  if (!personIds || personIds.length === 0) return data

  // Hat in diesem Spiel jede gewählte Person mitgespielt (nicht ausgesetzt)?
  const played = (game, id) =>
    game.results.some(r => r.playerId === id && r.partei !== 'ausgesetzt')
  const allPlayed = (game) => personIds.every(id => played(game, id))

  const games = data.games.filter(allPlayed)

  // Nur noch die Runden/Partien behalten, die überhaupt noch ein Spiel enthalten.
  const keptRoundIds   = new Set(games.map(g => g.roundId))
  const keptSessionIds = new Set(games.map(g => g.sessionId))
  const rounds   = data.rounds.filter(r => keptRoundIds.has(r.id))
  const sessions = data.sessions.filter(s => keptSessionIds.has(s.id))

  // Spieler:innen auf die einschränken, die in den übrig gebliebenen Spielen
  // noch vorkommen (gleiche Logik wie beim Zeitraum-Filter). Das sind die
  // gewählten Personen UND ihre jeweiligen Mitspieler:innen in diesen Spielen.
  const activeIds = new Set()
  for (const g of games) for (const res of g.results) activeIds.add(res.playerId)
  const players = new Map()
  for (const id of activeIds) {
    if (data.players.has(id)) players.set(id, data.players.get(id))
  }

  return { sessions, rounds, games, players }
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

// Rang-Berechnung über ein ganzes Feld (Spieler-Steckbrief, Phase 10.2).
//
// Eingabe: eine Map(spielerId → Zahl) mit AUSSCHLIESSLICH den ranking-fähigen
// Werten (Aufrufer siebt vorher null-Werte und schwache Stichproben aus – die
// bekommen bewusst keinen Rang, s. P6). Ausgabe: Map(spielerId → Rang, 1-basiert).
//
// Gleichstand = gleicher Rang, danach Lücke („Standard competition ranking",
// 1-2-2-4): zwei geteilte Erste stehen beide auf 🥇, der Nächste auf Rang 3.
// higherIsBetter steuert die Richtung (höher = besser bei Punkten/Quoten;
// perspektivisch könnte eine „kleiner ist besser"-Kennzahl false übergeben).
export function rankMap(values, higherIsBetter = true) {
  const sorted = [...values.entries()].sort((a, b) =>
    higherIsBetter ? b[1] - a[1] : a[1] - b[1],
  )
  const ranks = new Map()
  let prevValue = null
  let prevRank = 0
  sorted.forEach(([id, value], i) => {
    // Gleicher Wert wie der Vorgänger → gleicher Rang; sonst der Listenplatz (i+1),
    // wodurch nach einem Gleichstand automatisch die Lücke entsteht.
    const rank = prevValue !== null && value === prevValue ? prevRank : i + 1
    ranks.set(id, rank)
    prevValue = value
    prevRank = rank
  })
  return ranks
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

// A4 – Anwesenheits-Timeline (Ausdauer-Block).
//
// Baut das „Präsenz-Raster": links jede Person, oben die Spielabende in
// chronologischer Reihenfolge, und für jede Kombination die schlichte Aussage
// „an diesem Abend dabei – ja/nein". „Dabei" heißt: in mindestens einer Runde
// des Abends als Teilnehmer:in eingetragen (gleiche Quelle wie
// playedSessionsByPlayer). Reine Anwesenheit ist immer exakt erfasst →
// P6-immun, auf jeder Datenqualität voll belastbar.
//
// So liest man aus einer Zeile die „Spielerbiografie": durchgehend gefüllt =
// treuer Stammgast; erst voll, dann leer = intensive Phase, danach abgeflacht.
//
// Rückgabe:
//   {
//     sessions: [{ id, date }],          // chronologisch (alt → neu)
//     rows: [{
//       id, name, avatarUrl,
//       present: [bool, …],              // deckungsgleich zur sessions-Reihenfolge
//       total,                           // Anzahl besuchter Abende
//       firstDate, lastDate,             // erster/letzter besuchter Abend (oder null)
//     }],
//   }
export function attendanceTimeline(data) {
  // Abende chronologisch sortieren – identischer Vergleich wie sessionChronoIndex
  // (Datum, bei Gleichstand die Anlage-Zeit), damit die Reihenfolge überall gleich ist.
  const sessions = [...data.sessions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return (a.createdAt ?? '') < (b.createdAt ?? '') ? -1 : 1
  })

  // Wer war an welchem Abend dabei? Aus den Runden-Teilnahmen einsammeln.
  const presence = new Map() // playerId → Set(sessionId)
  for (const round of data.rounds) {
    for (const pid of round.participantIds) {
      let set = presence.get(pid)
      if (!set) { set = new Set(); presence.set(pid, set) }
      set.add(round.sessionId)
    }
  }

  // Je Person die Präsenz-Reihe (deckungsgleich zur sessions-Reihenfolge) bauen.
  const rows = []
  for (const [pid, set] of presence) {
    const p = data.players.get(pid)
    const present = sessions.map(s => set.has(s.id))
    let total = 0, firstIdx = -1, lastIdx = -1
    present.forEach((v, i) => { if (v) { total++; if (firstIdx < 0) firstIdx = i; lastIdx = i } })
    rows.push({
      id:        pid,
      name:      p?.name ?? '?',
      avatarUrl: p?.avatarUrl ?? null,
      present,
      total,
      firstDate: firstIdx >= 0 ? sessions[firstIdx].date : null,
      lastDate:  lastIdx  >= 0 ? sessions[lastIdx].date  : null,
    })
  }
  // Stammgäste oben: nach Gesamt-Teilnahme absteigend, bei Gleichstand nach Name.
  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

  return { sessions: sessions.map(s => ({ id: s.id, date: s.date })), rows }
}

// Angesagte Solos, bei denen der/die Geber:in NOCHMAL gibt (Rotation hält an):
// fleischlos, buben_solo, damen_solo, farb_solo. NICHT dabei: Stilles Solo und
// Solo Hochzeit – die verlängern die Runde nicht und rücken normal weiter.
const HELD_ROTATION_TYPES = new Set(['fleischlos', 'buben_solo', 'damen_solo', 'farb_solo'])

// A5 – Gebeversuche: wie oft jemand mischen & austeilen musste. Summe aus drei
// Quellen (alle drei, nicht nur die Redeal-Tabelle):
//   1. normales Geben  – Rotation: jede:r gibt pro Runde genau einmal
//   2. Solo-Neugabe    – nach einem angesagten Solo gibt derselbe nochmal
//   3. Fehl-Gebversuch – jedes Neugeben (round_redeals) ist eine zusätzliche
//                        Gabe des dortigen Gebers, egal aus welcher Ursache
//
// Quelle 1+2 ergeben sich aus der Geber-Rotation: pro Runde bei seat 1 starten,
// nach jedem NORMALEN Spiel eins weiterrücken, nach einem angesagten Solo den
// Geber HALTEN (er gibt das verlängernde Folgespiel) – so fällt die Solo-Neugabe
// automatisch dem richtigen seat zu. Quelle 3 hängt direkt an den Spielen.
//
// Reine Mengen → P6-immun. Rückgabe: Map(playerId → Anzahl Gaben).
export function dealingStats(data) {
  const deals = new Map()
  const add = (pid) => { if (pid != null) deals.set(pid, (deals.get(pid) ?? 0) + 1) }

  // Spiele je Runde gruppieren (später in Nummern-Reihenfolge durchlaufen).
  const gamesByRound = new Map()
  for (const g of data.games) {
    let arr = gamesByRound.get(g.roundId)
    if (!arr) { arr = []; gamesByRound.set(g.roundId, arr) }
    arr.push(g)
  }

  for (const round of data.rounds) {
    const parts = round.participants ?? []
    const n = parts.length
    if (n === 0) continue
    const seatMap = new Map(parts.map(p => [p.seat, p.playerId])) // seat → playerId
    const games = (gamesByRound.get(round.id) ?? []).slice().sort((a, b) => a.number - b.number)

    let seat = 1 // seat 1 = erste:r Geber:in der Runde
    for (const g of games) {
      add(seatMap.get(seat))                            // Quelle 1+2: die Gabe dieses Spiels
      for (const pid of g.redealDealerIds ?? []) add(pid) // Quelle 3: Fehl-Gebversuche
      // Rotation fortschreiben – außer nach angesagtem Solo (derselbe gibt nochmal).
      if (!HELD_ROTATION_TYPES.has(g.gameType)) seat = (seat % n) + 1
    }
  }
  return deals
}

// A6/A7 – Spielzeit. Nur aus App-erfassten Abenden: dort tragen die Spiel-
// Zeitstempel (created_at) die echte Uhrzeit. Beim historischen Import wurden
// alle Spiele eines Abends in derselben Sekunde eingespielt → keine Dauer.
// Ein Abend gilt als „getimt", wenn er mindestens ein App-Spiel hat (augenRe
// gesetzt = exakte Augen = App-Erfassung) und die Zeitstempel auseinanderliegen.
//
// A6 (Spielstunden je Person) = Summe der Zeitspannen der besuchten getimten
// Abende. A7 (Ø Dauer) = gesamte getimte Zeit ÷ Anzahl getimter Partien/Runden/
// Spiele. Dauer eines Abends = letzter minus erster Spiel-Zeitstempel (die
// Dauer des letzten Spiels selbst fehlt mangels Endzeit – leichte Unterschätzung).
//
// Rückgabe:
//   {
//     perPlayer: Map(playerId → ms),          // A6
//     totalMs,                                 // Summe aller getimten Abende
//     counts: { sessions, rounds, games },     // getimte Einheiten (Nenner A7)
//     avg:    { session, round, game },        // A7: totalMs ÷ counts (ms, oder null)
//     dates:  [ 'YYYY-MM-DD', … ],             // getimte Abende (für den P2-Hinweis)
//   }
export function playtimeStats(data) {
  // Spiele je Abend gruppieren.
  const gamesBySession = new Map()
  for (const g of data.games) {
    let arr = gamesBySession.get(g.sessionId)
    if (!arr) { arr = []; gamesBySession.set(g.sessionId, arr) }
    arr.push(g)
  }

  // Getimte Abende + ihre Zeitspanne bestimmen.
  const timed = new Map() // sessionId → spanMs
  for (const [sid, gs] of gamesBySession) {
    if (!gs.some(g => g.augenRe != null)) continue // kein App-Spiel → Import → keine Uhrzeit
    const ts = gs.map(g => Date.parse(g.createdAt)).filter(Number.isFinite)
    if (ts.length < 2) continue
    const span = Math.max(...ts) - Math.min(...ts)
    if (span > 0) timed.set(sid, span)
  }

  // Anwesenheit je Abend (aus den Runden-Teilnahmen), um A6 zuzuordnen.
  const attend = new Map() // sessionId → Set(playerId)
  for (const round of data.rounds) {
    let set = attend.get(round.sessionId)
    if (!set) { set = new Set(); attend.set(round.sessionId, set) }
    for (const p of round.participants ?? []) set.add(p.playerId)
  }

  // A6: je Person die Summe der Spannen ihrer besuchten getimten Abende.
  const perPlayer = new Map()
  let totalMs = 0
  for (const [sid, span] of timed) {
    totalMs += span
    for (const pid of attend.get(sid) ?? []) {
      perPlayer.set(pid, (perPlayer.get(pid) ?? 0) + span)
    }
  }

  // A7: Nenner = Anzahl getimter Partien / Runden / Spiele.
  const timedIds = new Set(timed.keys())
  const rounds = data.rounds.filter(r => timedIds.has(r.sessionId)).length
  const games  = data.games.filter(g => timedIds.has(g.sessionId)).length
  const dates  = data.sessions.filter(s => timedIds.has(s.id)).map(s => s.date).sort()

  return {
    perPlayer,
    totalMs,
    counts: { sessions: timed.size, rounds, games },
    avg: {
      session: timed.size ? totalMs / timed.size : null,
      round:   rounds ? totalMs / rounds : null,
      game:    games  ? totalMs / games  : null,
    },
    dates,
  }
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

// Lineares-Interpolations-Quantil („Typ 7", wie numpy/Excel-Standard): p ∈ [0,1]
// auf eine AUFSTEIGEND sortierte Zahlenliste. p=0 → Minimum, p=0,5 → Median,
// p=1 → Maximum. Bei genau einem Wert gibt es diesen Wert zurück. Liegt der
// gesuchte Rang zwischen zwei Datenpunkten, wird linear dazwischen interpoliert.
// (Leere Liste → null; wird von spreadStats nie mit n=0 aufgerufen.)
function quantile(sortedAsc, p) {
  const n = sortedAsc.length
  if (n === 0) return null
  if (n === 1) return sortedAsc[0]
  const idx = p * (n - 1)        // Bruch-Rang 0…n-1
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sortedAsc[lo]
  const frac = idx - lo
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac
}

// L8 Streuung/Konstanz: sammelt je Spieler:in ALLE Einzel-Salden auf der Ebene
// (Spiel/Runde/Partie – wiederverwendet unitSaldi) und beschreibt ihre Verteilung
// mit der „Fünf-Zahlen-Zusammenfassung" für den Box-Plot plus der Standard-
// abweichung σ (Nerd-Modus):
//   • min / max     → die Whisker (bestes/schlechtestes Einzelergebnis)
//   • q1 / q3       → die Kasten-Kanten (mittlere 50 % der Ergebnisse)
//   • median        → der Strich im Kasten (typischer Wert)
//   • sigma         → Standardabweichung (Populations-σ, weil es die VOLLSTÄNDIGE
//                     Ergebnisreihe der Person ist, keine Stichprobe daraus)
//   • n             → Anzahl Werte (Nenner für die P6-Dämpfung)
// Ein schmaler Kasten = konstante:r Spieler:in, ein breiter = Zocker:in.
// Rückgabe: Map(playerId → { n, min, q1, median, q3, max, sigma })
export function spreadStats(data, level) {
  const units = unitSaldi(data, level)
  // Je Spieler:in alle Salden in eine Liste einsammeln.
  const byPlayer = new Map() // pid → number[]
  for (const u of units) {
    for (const [pid, saldo] of u.players) {
      let arr = byPlayer.get(pid)
      if (!arr) { arr = []; byPlayer.set(pid, arr) }
      arr.push(saldo)
    }
  }
  const out = new Map()
  for (const [pid, values] of byPlayer) {
    const sorted = [...values].sort((a, b) => a - b)
    const n = sorted.length
    const mean = sorted.reduce((s, v) => s + v, 0) / n
    const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n
    out.set(pid, {
      n,
      min:    sorted[0],
      q1:     quantile(sorted, 0.25),
      median: quantile(sorted, 0.5),
      q3:     quantile(sorted, 0.75),
      max:    sorted[n - 1],
      sigma:  Math.sqrt(variance),
    })
  }
  return out
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

// ────────────────────────────────────────────────────────────────────────────
// 3b. Sieg/Niederlage je Spieler:in (L1, Spielebene, binär)
// ────────────────────────────────────────────────────────────────────────────
// Auf Spielebene gibt es nur Sieg oder Niederlage (kein „Erster/Letzter" wie bei
// Runde/Partie): Man hat gewonnen, wenn die EIGENE Partei die Gewinner-Partei des
// Spiels ist (game.winner, oben aus den Punkten abgeleitet). Aussetzer und Spiele
// mit unbekanntem Gewinner (winner == null, dürfte nicht vorkommen) zählen nicht.
//
//   games        = gespielte, entschiedene Spiele (Nenner der Siegquote)
//   siege        = Partei === winner
//   niederlagen  = games − siege
// Rückgabe: Map(playerId → { games, siege, niederlagen })
export function winLossStats(data) {
  const acc = new Map()
  for (const g of data.games) {
    if (g.winner == null) continue
    for (const res of g.results) {
      if (res.partei === 'ausgesetzt') continue
      let a = acc.get(res.playerId)
      if (!a) { a = { games: 0, siege: 0, niederlagen: 0 }; acc.set(res.playerId, a) }
      a.games += 1
      if (res.partei === g.winner) a.siege += 1
      else a.niederlagen += 1
    }
  }
  return acc
}

// ────────────────────────────────────────────────────────────────────────────
// 3c. Serien / Streaks (L5)
// ────────────────────────────────────────────────────────────────────────────
// Eine Serie ist eine Folge aufeinanderfolgender Einheiten (Spiele bzw. Runden/
// Partien), in denen dieselbe Person denselben Zustand erreicht hat – z. B. „5
// Siege in Folge". Pro Zustand weisen wir zwei Zahlen aus:
//   • aktuell = die Serie, die am Ende noch lief (Stand: jüngste Einheit)
//   • längste = der Rekord im gewählten Zeitraum
//
// Regeln (STATISTIK_KONZEPT.md L5, Jan-Entscheidung 26.07.2026):
//   • Abwesenheit (Aussetzen) unterbricht NICHT – ausgesetzte Einheiten kommen in
//     der persönlichen Folge gar nicht vor, die Serie läuft darüber hinweg.
//   • Jede MITGESPIELTE Einheit ohne den Zustand bricht die Serie („jedes Nicht-
//     Erreichen bricht", nicht nur das Gegenteil). Für Sieg/Niederlage ist das
//     ohnehin dasselbe (kein Mittelfeld); für Erster/Letzter heißt es: eine Runde
//     im Mittelfeld beendet die Erster-Serie.
//   • Streaks sind IMMUN gegen P6 (Absolutzahlen) – keine Dämpfung.
//
// Entscheidend ist die CHRONOLOGISCHE Reihenfolge: die Einheiten müssen in echter
// Spielreihenfolge durchlaufen werden, sonst wäre „in Folge" bedeutungslos.

// Chronologischer Rang jeder Partie (nach Datum, bei Gleichstand nach created_at)
// als Nachschlage-Index sessionId → Position. Basis, um Spiele/Runden/Partien in
// echte Spielreihenfolge zu bringen. Gleiche Sortier-Logik wie buildScoreCurve.
function sessionChronoIndex(data) {
  const order = new Map()
  ;[...data.sessions]
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      return (a.createdAt ?? '') < (b.createdAt ?? '') ? -1 : 1
    })
    .forEach((s, i) => order.set(s.id, i))
  return order
}

// Kleiner Serien-Zähler: bekommt je Einheit in chronologischer Reihenfolge ein
// hit(pid, erreicht, date) und merkt sich pro Person die laufende (`run`) und die
// längste (`longest`) Serie. Am Ende IST `run` die aktuelle Serie – 0, wenn die
// letzte gespielte Einheit den Zustand nicht erfüllte.
//
// Zusätzlich wird die DATUMS-SPANNE der längsten Serie festgehalten (bestFrom/
// bestTo) – das „wann war die Rekord-Serie". `runStart` merkt sich das Datum, an
// dem die laufende Serie begann; sobald sie einen neuen Rekord aufstellt, wird die
// Spanne (Start … aktuelles Datum) als bestFrom/bestTo eingefroren.
function makeStreakTracker() {
  const m = new Map() // pid → { run, longest, runStart, bestFrom, bestTo }
  return {
    hit(pid, erreicht, date) {
      let s = m.get(pid)
      if (!s) { s = { run: 0, longest: 0, runStart: null, bestFrom: null, bestTo: null }; m.set(pid, s) }
      if (erreicht) {
        if (s.run === 0) s.runStart = date   // neue Serie beginnt hier
        s.run += 1
        if (s.run > s.longest) {
          s.longest = s.run
          s.bestFrom = s.runStart
          s.bestTo = date
        }
      } else {
        s.run = 0
        s.runStart = null
      }
    },
    map: m,
  }
}

// L5 Sieg-/Niederlagen-Serien (Spielebene). Läuft die Spiele chronologisch durch
// und führt zwei Serien je Person: eine für Siege, eine für Niederlagen. Ein Spiel
// ist genau eines von beiden – „gewonnen" bricht die Pechsträhne und umgekehrt.
// Spiele mit unbekanntem Gewinner (winner == null, kaputte Altimporte) werden wie
// Abwesenheit übersprungen (weder Zähler noch Bruch).
// Rückgabe: Map(pid → { siegAktuell, siegLaengste, niederlageAktuell, niederlageLaengste })
export function winLossStreaks(data) {
  const order = sessionChronoIndex(data)
  const games = [...data.games].sort((a, b) => {
    const so = (order.get(a.sessionId) ?? 0) - (order.get(b.sessionId) ?? 0)
    if (so !== 0) return so
    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber
    return a.number - b.number
  })

  const sieg = makeStreakTracker()
  const niederlage = makeStreakTracker()
  for (const g of games) {
    if (g.winner == null) continue
    for (const res of g.results) {
      if (res.partei === 'ausgesetzt') continue
      const gewonnen = res.partei === g.winner
      sieg.hit(res.playerId, gewonnen, g.sessionDate)
      niederlage.hit(res.playerId, !gewonnen, g.sessionDate)
    }
  }

  const empty = { run: 0, longest: 0, bestFrom: null, bestTo: null }
  const out = new Map()
  for (const pid of new Set([...sieg.map.keys(), ...niederlage.map.keys()])) {
    const s = sieg.map.get(pid) ?? empty
    const n = niederlage.map.get(pid) ?? empty
    out.set(pid, {
      siegAktuell: s.run, siegLaengste: s.longest, siegVon: s.bestFrom, siegBis: s.bestTo,
      niederlageAktuell: n.run, niederlageLaengste: n.longest, niederlageVon: n.bestFrom, niederlageBis: n.bestTo,
    })
  }
  return out
}

// L5 Erster-/Letzter-Serien (Runde- oder Partie-Ebene). Aggregiert erst die Spiele
// je Einheit zu Salden je Spieler:in (wie unitSaldi), bringt die Einheiten dann in
// chronologische Reihenfolge und führt zwei Serien je Person. „Erster" = höchster
// Saldo der Einheit, „Letzter" = tiefster (geteilte Plätze zählen für alle). Ohne
// Abstand (alle gleich) ist niemand Erster/Letzter → beide Serien brechen.
// level = 'round' | 'session'.
// Rückgabe: Map(pid → { ersterAktuell, ersterLaengste, letzterAktuell, letzterLaengste })
export function placementStreaks(data, level) {
  const order = sessionChronoIndex(data)

  // Spiele je Einheit zu Salden je Spieler:in zusammenziehen (Ausgesetzt-Zeilen
  // tragen 0 bei). so/roundNumber je Einheit für die chronologische Sortierung.
  const key = level === 'round' ? 'roundId' : 'sessionId'
  const byUnit = new Map() // unitId → { so, roundNumber, players: Map(pid → saldo) }
  for (const g of data.games) {
    const id = g[key]
    let u = byUnit.get(id)
    if (!u) {
      u = { so: order.get(g.sessionId) ?? 0, roundNumber: g.roundNumber, date: g.sessionDate, players: new Map() }
      byUnit.set(id, u)
    }
    for (const res of g.results) {
      u.players.set(res.playerId, (u.players.get(res.playerId) ?? 0) + res.zaehlpunkte)
    }
  }
  // Sortieren: erst nach Partie-Reihenfolge, bei 'round' innerhalb der Partie nach
  // Rundennummer (bei 'session' ist so eindeutig, roundNumber greift dann nie).
  const units = [...byUnit.values()].sort((a, b) => {
    if (a.so !== b.so) return a.so - b.so
    return a.roundNumber - b.roundNumber
  })

  const erster = makeStreakTracker()
  const letzter = makeStreakTracker()
  for (const u of units) {
    const saldi = [...u.players.values()]
    if (saldi.length === 0) continue
    const max = Math.max(...saldi)
    const min = Math.min(...saldi)
    const spread = max !== min
    for (const [pid, s] of u.players) {
      erster.hit(pid, spread && s === max, u.date)
      letzter.hit(pid, spread && s === min, u.date)
    }
  }

  const empty = { run: 0, longest: 0, bestFrom: null, bestTo: null }
  const out = new Map()
  for (const pid of new Set([...erster.map.keys(), ...letzter.map.keys()])) {
    const e = erster.map.get(pid) ?? empty
    const l = letzter.map.get(pid) ?? empty
    out.set(pid, {
      ersterAktuell: e.run, ersterLaengste: e.longest, ersterVon: e.bestFrom, ersterBis: e.bestTo,
      letzterAktuell: l.run, letzterLaengste: l.longest, letzterVon: l.bestFrom, letzterBis: l.bestTo,
    })
  }
  return out
}

// ────────────────────────────────────────────────────────────────────────────
// 3d. Deutlichkeit der Siege (L9)
// ────────────────────────────────────────────────────────────────────────────
// Zeigt, WIE deutlich jemand gewinnt: Verteilung der eigenen Siege über fünf Stufen
// von knapp → vernichtend. Gemessen am ERREICHTEN (nicht am Angesagten) – die Stufe
// ergibt sich allein aus den eigenen Augen des Gewinners:
//   > 120 (keine Absage geschafft) = normaler (knapper) Sieg
//   ≥ 151 Keine 90 · ≥ 181 Keine 60 · ≥ 211 Keine 30 · 240 Schwarz
// (Schwellen identisch zu ABSAGE_THRESHOLDS in scoreCalculation.js.)
//
// Der Gewinner steht als game.winner fest (aus den Punkten abgeleitet). Seine Augen:
// augen_re exakt (App-Erfassung) ODER die Mitte der Import-Range – jede Import-Range
// liegt per Konstruktion vollständig in EINER Stufe, die Mitte genügt zur Einordnung.
// Ein Sieg NUR durch eine gescheiterte Gegner-Absage (Gewinner < 121 eigene Augen)
// fällt in die mildeste Stufe „normal" – deutlicher misst sich ein Sieg nicht.
// Rückgabe: Map(pid → { total, normal, k90, k60, k30, schwarz })
export function clarityStats(data) {
  const acc = new Map()
  for (const g of data.games) {
    if (g.winner == null) continue

    // Repräsentative Re-Augen: exakt, sonst Mitte der Import-Range.
    let reEye = g.augenRe
    if (reEye == null && g.augenReMin != null && g.augenReMax != null) {
      reEye = Math.round((g.augenReMin + g.augenReMax) / 2)
    }
    if (reEye == null) continue // ohne Augen nicht einstufbar (nach der 25.03.-Reparatur kein Fall mehr)

    const winnerEyes = g.winner === 're' ? reEye : 240 - reEye
    const stage =
      winnerEyes >= 240 ? 'schwarz' :
      winnerEyes >= 211 ? 'k30' :
      winnerEyes >= 181 ? 'k60' :
      winnerEyes >= 151 ? 'k90' : 'normal'

    for (const res of g.results) {
      if (res.partei !== g.winner) continue // nur die Gewinner:innen dieses Spiels
      let a = acc.get(res.playerId)
      if (!a) { a = { total: 0, normal: 0, k90: 0, k60: 0, k30: 0, schwarz: 0 }; acc.set(res.playerId, a) }
      a.total += 1
      a[stage] += 1
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

// ────────────────────────────────────────────────────────────────────────────
// 9. Partie-Steckbrief („Stats of the Party", Tier 2 / Phase 8)
// ────────────────────────────────────────────────────────────────────────────
//
// Alle folgenden Funktionen beschreiben GENAU EINE Partie (sessionId). Sie sind
// reines Filtern der ohnehin geladenen Gruppendaten – kein neuer Datentopf, kein
// eigener DB-Zugriff (Konzept: „bestehende Kennzahlen, gefiltert auf eine Partie").

// buildSessionCurve – Verlaufskurve über die Spiele EINER Partie (Phase 8.1).
//
// Anders als buildScoreCurve (x-Achse = Partien über die ganze Historie) läuft
// die x-Achse hier über die einzelnen Spiele DIESES Abends (1, 2, 3, …). y ist
// der kumulierte Saldo je Spieler:in. Rückgabeform ist identisch zu
// buildScoreCurve ({ points: [{ label, <playerId>: wert, … }], players }), damit
// die ScoreCurve-Komponente unverändert wiederverwendet werden kann.
export function buildSessionCurve(data, sessionId) {
  // Spiele dieser Partie in echter Spielreihenfolge: erst nach Runde, dann nach
  // Spielnummer innerhalb der Runde.
  const games = data.games
    .filter(g => g.sessionId === sessionId)
    .sort((a, b) => (a.roundNumber - b.roundNumber) || (a.number - b.number))

  // Wer war an diesem Abend beteiligt? Jede:r mit mindestens einem echten (nicht
  // ausgesetzten) Ergebnis bekommt eine Linie. Reine Aussetzer bleiben außen vor.
  const involved = new Set()
  for (const g of games) {
    for (const res of g.results) {
      if (res.partei !== 'ausgesetzt') involved.add(res.playerId)
    }
  }

  // Laufende Summe je Spieler:in; nach jedem Spiel ein Kurvenpunkt. Wer ein Spiel
  // aussetzt, behält seinen Stand → die Linie bleibt an der Stelle flach.
  //
  // Jeder Punkt bekommt ein eindeutiges Label (der globale Spiel-Index als String)
  // und daneben Meta-Infos (Runde, Spielnummer innerhalb der Runde, ob hier eine
  // neue Runde beginnt). meta ist nach Label gekippt, damit die ScoreCurve die
  // x-Achse zweizeilig beschriften (Spielnr. + Rundenmarker) und im Tooltip
  // „Runde X · Spiel Y" zeigen kann.
  const running = new Map()
  const points = []
  const meta = {}
  let idx = 0
  let prevRound = null
  for (const g of games) {
    idx++
    for (const res of g.results) {
      running.set(res.playerId, (running.get(res.playerId) ?? 0) + res.zaehlpunkte)
    }
    const label = String(idx)
    const point = { label }
    for (const pid of involved) point[pid] = running.get(pid) ?? 0
    points.push(point)
    meta[label] = {
      round:      g.roundNumber,
      game:       g.number,               // Spielnummer INNERHALB der Runde
      roundStart: g.roundNumber !== prevRound,
    }
    prevRound = g.roundNumber
  }

  // Spieler:innen nach Endstand absteigend – bestimmt die Reihenfolge der Linien
  // und der rechten Rang-Liste (führend zuerst).
  const players = [...involved]
    .map(pid => ({ id: pid, name: data.players.get(pid)?.name ?? '?' }))
    .sort((a, b) => (running.get(b.id) ?? 0) - (running.get(a.id) ?? 0))

  return { points, players, meta }
}

// sessionSingleGameExtremes – bester/schlechtester Einzelspielwert EINES Abends
// (Phase 8.2). „Einzelspielwert" = die Zählpunkte, die eine Person in einem
// einzelnen Spiel geholt hat (gleiche Idee wie L7 auf Spiel-Ebene, nur auf diese
// Partie begrenzt). Aussetzer zählen nicht mit.
//
// Rückgabe je Rekord: { value, holders: [{ name, round, game }, …] }. holders
// enthält jede:n Inhaber:in mit dem eigenen Spielort (Runde/Spiel), z. B. beide
// Partner eines Team-Werts oder – selten – dieselbe Person in zwei Spielen mit
// gleichem Wert. Dubletten (Name + gleicher Ort) werden entfernt.
export function sessionSingleGameExtremes(data, sessionId) {
  const games = data.games.filter(g => g.sessionId === sessionId)

  let best = null   // { value, entries: [{ playerId, round, game }] }
  let worst = null

  for (const g of games) {
    for (const res of g.results) {
      if (res.partei === 'ausgesetzt') continue
      const v = res.zaehlpunkte
      const entry = { playerId: res.playerId, round: g.roundNumber, game: g.number }
      if (!best || v > best.value)      best = { value: v, entries: [entry] }
      else if (v === best.value)        best.entries.push(entry)
      if (!worst || v < worst.value)    worst = { value: v, entries: [entry] }
      else if (v === worst.value)       worst.entries.push(entry)
    }
  }

  // Rohform → Anzeigeform: je Inhaber:in Name + eigener Ort (Dubletten raus).
  const shape = (rec) => {
    if (!rec) return null
    const seen = new Set()
    const holders = []
    for (const e of rec.entries) {
      const name = data.players.get(e.playerId)?.name ?? '?'
      const key = `${name}|${e.round}|${e.game}`
      if (seen.has(key)) continue
      seen.add(key)
      holders.push({ name, round: e.round, game: e.game })
    }
    return { value: rec.value, holders }
  }

  return { best: shape(best), worst: shape(worst) }
}

// sessionStreaks – längste Sieg-/Niederlagenserie INNERHALB eines Abends
// (Phase 8.2, L5-Logik auf die Partie begrenzt). Pro Person die Spiele des Abends
// in Reihenfolge; ein Aussetzen unterbricht die Serie NICHT (übersprungen), nur
// das jeweils andere Ergebnis bricht sie. Anschließend das Maximum über alle
// Personen. Eine „Serie" zählt erst ab Länge 2; sonst null.
//
// Rückgabe je Serie: { len, holders: [{ name, from:{round,game}, to:{round,game} }] }
// – from/to markieren erstes und letztes Spiel der Serie (für die Spannen-Anzeige
// „R3S2–R4S2"). Bei Gleichstand mehrere Inhaber:innen mit je eigener Spanne.
export function sessionStreaks(data, sessionId) {
  const games = data.games
    .filter(g => g.sessionId === sessionId)
    .sort((a, b) => (a.roundNumber - b.roundNumber) || (a.number - b.number))

  // Ergebnis-Folge je Person mit Spielort: { outcome:'win'|'loss', round, game }.
  // Unentschiedene/gewinnerlose Spiele und Aussetzer kommen gar nicht erst rein
  // → sie unterbrechen die Serie nicht.
  const seq = new Map()
  for (const g of games) {
    if (!g.winner) continue
    for (const res of g.results) {
      if (res.partei === 'ausgesetzt') continue
      const outcome = res.partei === g.winner ? 'win' : 'loss'
      if (!seq.has(res.playerId)) seq.set(res.playerId, [])
      seq.get(res.playerId).push({ outcome, round: g.roundNumber, game: g.number })
    }
  }

  // Längste Serie eines Ergebnistyps in einer Folge, inkl. Start-/End-Spiel.
  const longestRun = (arr, target) => {
    let best = { len: 0, from: null, to: null }
    let curLen = 0, curFrom = null
    for (const e of arr) {
      if (e.outcome === target) {
        if (curLen === 0) curFrom = e
        curLen++
        if (curLen > best.len) best = { len: curLen, from: curFrom, to: e }
      } else {
        curLen = 0; curFrom = null
      }
    }
    return best
  }

  const perPlayer = new Map()
  for (const [pid, arr] of seq) {
    perPlayer.set(pid, { win: longestRun(arr, 'win'), loss: longestRun(arr, 'loss') })
  }

  // Gruppen-Maximum + alle Inhaber:innen (Gleichstand → mehrere, je eigene Spanne).
  let maxWin = 0, maxLoss = 0
  for (const v of perPlayer.values()) {
    if (v.win.len > maxWin)   maxWin = v.win.len
    if (v.loss.len > maxLoss) maxLoss = v.loss.len
  }
  const nm = (pid) => data.players.get(pid)?.name ?? '?'
  const collect = (key, len) =>
    [...perPlayer]
      .filter(([, v]) => v[key].len === len)
      .map(([pid, v]) => ({ name: nm(pid), from: v[key].from, to: v[key].to }))

  return {
    bestWin:  maxWin  >= 2 ? { len: maxWin,  holders: collect('win', maxWin) }   : null,
    bestLoss: maxLoss >= 2 ? { len: maxLoss, holders: collect('loss', maxLoss) } : null,
  }
}

// Spieltypen, die als Solo bzw. als Sonderspiel (Hochzeit/Armut) zählen.
const SOLO_TYPES = new Set([
  'fleischlos', 'buben_solo', 'damen_solo', 'farb_solo', 'stilles_solo', 'solo_hochzeit',
])
const SONDERSPIEL_TYPES = new Set(['hochzeit', 'armut'])

// sessionCounts – Anzahl Solos / Sonderspiele / Sonderpunkte an EINEM Abend, jeweils
// mit einem längenbereinigten Erwartungswert UND einer Pro-Person-Aufschlüsselung
// (Phase 8.3).
//
// Erwartungswert statt simplem Ø pro Partie: Ein simpler „Gesamtzahl ÷ Anzahl
// Partien" wäre durch die Abendlänge verzerrt (ein langer Abend hat mechanisch mehr
// Solos). Stattdessen die Gruppen-Rate PRO RUNDE (Gesamtzahl ÷ alle Runden) × die
// Runden DIESES Abends → „so viele wären an einem Abend dieser Länge erwartbar".
// Runde als Basis (nicht Spiel), weil ein angesagtes Solo die Runde um ein Spiel
// verlängert – „Spiele" wären durch die Solos selbst aufgebläht, Runden nicht.
// Reine Einordnung, kein Ranking, keine P6-Behandlung.
//
// Zuordnung „wer": Solo → der/die Solist:in (sonderrolle 'solist'); Sonderspiel →
// der/die Hauptrolle (sonderrolle 'hochzeit' bzw. 'arm'); Sonderpunkt → wer ihn
// erzielt hat (specialPointPlayers).
export function sessionCounts(data, sessionId) {
  let sSolo = 0, sSs = 0, sSp = 0   // dieser Abend
  let gSolo = 0, gSs = 0, gSp = 0   // ganze Gruppe

  // Pro-Person-Zähler NUR für diesen Abend (playerId → Anzahl).
  const bySolo = new Map()
  const bySs   = new Map()
  const bySp   = new Map()
  const bump = (map, pid) => { if (pid) map.set(pid, (map.get(pid) ?? 0) + 1) }

  for (const g of data.games) {
    const solo = SOLO_TYPES.has(g.gameType) ? 1 : 0
    const ss   = SONDERSPIEL_TYPES.has(g.gameType) ? 1 : 0
    const spIds = g.specialPointPlayers ?? []
    gSolo += solo; gSs += ss; gSp += spIds.length
    if (g.sessionId !== sessionId) continue

    sSolo += solo; sSs += ss; sSp += spIds.length
    if (solo) bump(bySolo, g.results.find(r => r.sonderrolle === 'solist')?.playerId)
    if (ss) {
      const mainRole = g.gameType === 'armut' ? 'arm' : 'hochzeit'
      bump(bySs, g.results.find(r => r.sonderrolle === mainRole)?.playerId)
    }
    for (const pid of spIds) bump(bySp, pid)
  }

  // Zähler-Map → nach Anzahl absteigend sortierte Namensliste [{ name, count }].
  const rank = (map) =>
    [...map]
      .map(([pid, count]) => ({ name: data.players.get(pid)?.name ?? '?', count }))
      .sort((a, b) => b.count - a.count)

  // Erwartungswert = Gruppen-Rate pro Runde × Runden dieses Abends.
  const groupRounds   = data.rounds.length || 1
  const sessionRounds = data.rounds.filter(r => r.sessionId === sessionId).length
  const expected = (groupTotal) => (groupTotal / groupRounds) * sessionRounds

  return {
    solos:        { count: sSolo, expected: expected(gSolo), byPlayer: rank(bySolo) },
    sonderspiele: { count: sSs,   expected: expected(gSs),   byPlayer: rank(bySs) },
    sonderpunkte: { count: sSp,   expected: expected(gSp),   byPlayer: rank(bySp) },
  }
}
