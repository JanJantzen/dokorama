-- Migration 009: Neugeben-Events
--
-- Neue Tabelle round_redeals für Situationen, bei denen nach dem Austeilen
-- sofort neu gegeben werden muss (Schmeißen). Ein Neugeben-Event ist KEIN Spiel –
-- es hat keine Teams, keine Augen, kein Ergebnis. Die Runde braucht weiterhin
-- dieselbe Anzahl echter Spiele. Der Geber gibt nochmal (Rotation schreitet NICHT vor).
--
-- Vier Typen:
--   fuenf_neunen    – Spieler:in hat 5 oder mehr Neunen und schmeißt
--   armut_abgelehnt – Jemand hat eine Armut (≤3 Trümpfe), aber kein:e Mitspieler:in nimmt sie
--   trumpfschwach   – Höchster Trumpf ist maximal das Karo-Ass (Fuchs) → kein Trumpf
--                     der einen gegnerischen Fuchs stechen könnte. Gilt unabhängig von
--                     der Gesamtzahl der Trümpfe. Bei ≤3 Trümpfen + trumpfschwach
--                     besteht Wahlfreiheit zwischen Neugeben und Armut spielen.
--   vergeben        – Der/die Geber:in hat sich beim Austeilen vergeben (Karten falsch verteilt).
--                     Hier ist culprit_id immer gleich dealer_id.
--
-- Ausführen: Supabase Dashboard → SQL Editor → dieses Script einfügen und ausführen.

-- Neues Enum für den Grund des Neugebens
CREATE TYPE redeal_type AS ENUM (
  'fuenf_neunen',
  'armut_abgelehnt',
  'trumpfschwach',
  'vergeben'
);

-- Neugeben-Events Tabelle
CREATE TABLE round_redeals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id    UUID        NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  redeal_type redeal_type NOT NULL,
  dealer_id   UUID        NOT NULL REFERENCES players(id),
  culprit_id  UUID        NOT NULL REFERENCES players(id), -- bei 'vergeben' = dealer_id
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security aktivieren (wie alle anderen Tabellen auch)
ALTER TABLE round_redeals ENABLE ROW LEVEL SECURITY;

-- Dev-Policies: in der Entwicklungsphase alles offen (wird in Phase 3 eingeschränkt)
CREATE POLICY "dev_read"   ON round_redeals FOR SELECT USING (true);
CREATE POLICY "dev_write"  ON round_redeals FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_delete" ON round_redeals FOR DELETE USING (true);
-- Kein UPDATE: Neugeben-Events werden nur gelöscht und neu erfasst, nie direkt editiert.
