-- Migration 008: Kugelschreiber-Modell
--
-- Fügt zwei neue Spalten auf sessions hinzu:
--
--   sessions.current_writer_id
--     Wer hält gerade den Kugelschreiber – also wer ist der aktive Schreiber dieser Partie?
--     Zeigt auf players.id (nicht auf auth.users, weil wir den Spielernamen brauchen).
--     NULL = noch niemand schreibt (z.B. frisch angelegte Partie, noch nicht geöffnet).
--     Wird beim Öffnen der Partie zum Schreiben gesetzt, bei Übergabe gewechselt.
--
--   sessions.live_draft
--     Der aktuelle Spielerfassungs-Zustand als JSON – was der Schreiber gerade eingetippt hat,
--     aber noch nicht bestätigt hat. Entspricht dem GameContext-State im Frontend.
--     NULL = kein Spiel wird gerade erfasst (zwischen zwei Spielen, oder Partie noch nicht gestartet).
--     Wird bei jeder Änderung im GameContext überschrieben (debounced, ca. 500ms).
--     Wird nach dem Bestätigen eines Spiels auf NULL zurückgesetzt.
--
-- Ausführen: Supabase Dashboard → SQL Editor → dieses Script einfügen und ausführen.

-- Wer schreibt gerade?
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS current_writer_id UUID REFERENCES players(id) ON DELETE SET NULL;

-- Was hat der Schreiber gerade eingetippt (noch nicht bestätigt)?
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS live_draft JSONB;
