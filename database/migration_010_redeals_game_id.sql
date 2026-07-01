-- Migration 010: round_redeals – round_id durch game_id ersetzen
--
-- Redeals gehören semantisch zu einem Spiel, nicht zu einer Runde.
-- Mit game_id als FK funktioniert Cascade-Delete automatisch: wird ein Spiel
-- gelöscht, verschwinden seine Neugebens-Events mit.
--
-- Redeals werden jetzt erst beim Bestätigen des Spiels in die DB geschrieben
-- (zusammen mit game_results, announcements etc.) – bis dahin leben sie im
-- GameContext-State und damit im live_draft (sichtbar für Zuschauer).
--
-- Ausführen: Supabase Dashboard → SQL Editor → ausführen.

-- Alte Einträge löschen (haben round_id aber keine game_id – nicht mehr verwendbar)
DELETE FROM round_redeals;

ALTER TABLE round_redeals
  DROP COLUMN round_id,
  ADD COLUMN game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE;
