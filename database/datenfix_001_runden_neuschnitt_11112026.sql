-- datenfix_001_runden_neuschnitt_11112026.sql
--
-- KEINE Migration: ändert nichts am Datenbank-Aufbau, sondern korrigiert die
-- Runden-Zuordnung der Spiele eines einzelnen Abends (11.11.2026).
--
-- HINTERGRUND
-- Am 11.11.2026 hat die App das Runden-Ende von Runde 2 verloren (Reload bei
-- offenem Runden-Übergangs-Screen) und ein fünftes Spiel in Runde 2 angeboten,
-- obwohl die Runde ohne Solo nach vier Spielen fertig war. Am Tisch wurde richtig
-- weitergespielt und richtig erfasst – nur die Rundengrenzen sind seitdem um ein
-- Spiel verschoben. Dadurch stimmt auch die abgeleitete Geber-Rotation nicht mehr.
--
-- IST (Spiele je Runde):   4 · 5 · 4 · 6 · 4   = 23
-- SOLL (Spiele je Runde):  4 · 4 · 4 · 6 · 5   = 23
--
-- Kein Spiel wird gelöscht oder angelegt – die 23 erfassten Spiele werden nur neu
-- auf die Runden geschnitten. Ab dem 5. Spiel von Runde 2 rutscht jedes Spiel um
-- einen Platz weiter: das überzählige Spiel wird Spiel 1 von Runde 3, das letzte
-- Spiel von Runde 3 wird Spiel 1 von Runde 4 usw.
--
-- GEBER
-- Der/die Geber:in wird NICHT pro Spiel gespeichert, sondern berechnet aus
-- round_participations.seat_position + Spielnummer + angesagten Solos davor
-- (calcSeatStatus in app/src/lib/seatUtils.js). Die Sitzpositionen sind in allen
-- fünf Runden identisch (1 Sophia, 2 Robert, 3 Jan, 4 Kathrin), deshalb genügt der
-- Neuschnitt: danach beginnt jede Runde wieder bei Sophia und jede:r gibt genau
-- einmal pro Runde (plus Wiederholung nach angesagtem Solo). Gespeicherte
-- Geber-Daten gibt es nur in round_redeals – das einzige Neugeben des Abends hängt
-- an Runde 1, Spiel 3 und wird von diesem Fix nicht berührt.
--
-- AUSGESETZT
-- Vier Spieler:innen = niemand setzt aus; es gibt in diesem Abend keine einzige
-- game_results-Zeile mit partei = 'ausgesetzt'. Der Neuschnitt kann also auch keine
-- gespeicherte Aussetzer-Zuordnung falsch machen.
--
-- NICHT BERÜHRT: game_results, announcements, special_points, round_redeals –
-- alle hängen an game_id, und die Spiel-IDs bleiben unverändert.

BEGIN;

-- ── 1) Vorher-Bild zur Kontrolle ──────────────────────────────────────────────
SELECT r.number AS runde, count(*) AS spiele
FROM rounds r JOIN games g ON g.round_id = r.id
WHERE r.session_id = '99878cc2-dc12-4b63-b7f0-ba85b589a0b9'
GROUP BY r.number ORDER BY r.number;

-- ── 2) Nummern in einen freien Bereich schieben ───────────────────────────────
-- Nötig, weil games einen UNIQUE(round_id, number) hat: ohne diesen Zwischenschritt
-- würde das Umnummerieren auf bereits belegte Nummern laufen.
UPDATE games g
SET number = g.number + 100
WHERE g.round_id IN (
  SELECT id FROM rounds WHERE session_id = '99878cc2-dc12-4b63-b7f0-ba85b589a0b9'
);

-- ── 3) Neu schneiden ──────────────────────────────────────────────────────────
-- Reihenfolge = created_at (entspricht der tatsächlichen Spielreihenfolge des Abends).
-- Die Soll-Verteilung 4/4/4/6/5 steht in den CASE-Grenzen: Positionen 1-4 → Runde 1,
-- 5-8 → Runde 2, 9-12 → Runde 3, 13-18 → Runde 4, 19-23 → Runde 5.
WITH ordered AS (
  SELECT g.id, row_number() OVER (ORDER BY g.created_at) AS pos
  FROM games g JOIN rounds r ON r.id = g.round_id
  WHERE r.session_id = '99878cc2-dc12-4b63-b7f0-ba85b589a0b9'
),
ziel AS (
  SELECT o.id,
    CASE WHEN o.pos <=  4 THEN 1
         WHEN o.pos <=  8 THEN 2
         WHEN o.pos <= 12 THEN 3
         WHEN o.pos <= 18 THEN 4
         ELSE                   5 END AS runde_nr,
    CASE WHEN o.pos <=  4 THEN o.pos
         WHEN o.pos <=  8 THEN o.pos -  4
         WHEN o.pos <= 12 THEN o.pos -  8
         WHEN o.pos <= 18 THEN o.pos - 12
         ELSE                   o.pos - 18 END AS spiel_nr
  FROM ordered o
)
UPDATE games g
SET round_id = r.id,
    number   = z.spiel_nr
FROM ziel z
JOIN rounds r
  ON r.session_id = '99878cc2-dc12-4b63-b7f0-ba85b589a0b9'
 AND r.number     = z.runde_nr
WHERE g.id = z.id;

-- ── 4) Leeren Live-Entwurf verwerfen ──────────────────────────────────────────
-- In sessions.live_draft steht ein komplett leerer Entwurf (keine Partei, keine Augen,
-- keine Ansagen) für „Spiel 5 der Runde 5". Nach dem Neuschnitt ist Spiel 5 der Runde 5
-- ein echtes, gespeichertes Spiel und die Runde komplett – der Entwurf ist gegenstandslos
-- und würde Zuschauer:innen nur einen Phantom-Tisch zeigen.
UPDATE sessions SET live_draft = NULL
WHERE id = '99878cc2-dc12-4b63-b7f0-ba85b589a0b9';

-- ── 5) Nachher-Bild: muss 4 · 4 · 4 · 6 · 5 ergeben ───────────────────────────
SELECT r.number AS runde, count(*) AS spiele,
       count(*) FILTER (
         WHERE g.game_type IN ('fleischlos','buben_solo','damen_solo','farb_solo')
       ) AS angesagte_solos,
       4 + count(*) FILTER (
         WHERE g.game_type IN ('fleischlos','buben_solo','damen_solo','farb_solo')
       ) AS soll
FROM rounds r JOIN games g ON g.round_id = r.id
WHERE r.session_id = '99878cc2-dc12-4b63-b7f0-ba85b589a0b9'
GROUP BY r.number ORDER BY r.number;

-- ── 6) Nachher-Bild im Detail (Spiel für Spiel, inkl. abgeleiteter Geber) ─────
-- geber = Sitzposition ((spielnummer - 1 - angesagte Solos davor) mod 4) + 1,
-- also exakt dieselbe Formel wie calcSeatStatus in der App.
SELECT r.number AS runde, g.number AS spiel, g.game_type,
       to_char(g.created_at AT TIME ZONE 'Europe/Berlin','HH24:MI') AS uhrzeit,
       p.name AS geber
FROM rounds r
JOIN games g ON g.round_id = r.id
JOIN round_participations rp ON rp.round_id = r.id
JOIN players p ON p.id = rp.player_id
WHERE r.session_id = '99878cc2-dc12-4b63-b7f0-ba85b589a0b9'
  AND rp.seat_position = ((
        g.number - 1 - (
          SELECT count(*) FROM games x
          WHERE x.round_id = g.round_id AND x.number < g.number
            AND x.game_type IN ('fleischlos','buben_solo','damen_solo','farb_solo')
        )
      ) % 4) + 1
ORDER BY r.number, g.number;

-- Sehen 5) und 6) richtig aus → COMMIT. Sonst ROLLBACK (nichts ist passiert).
COMMIT;
