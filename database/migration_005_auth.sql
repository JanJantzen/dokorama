-- Migration 005: Login / Auth-Verknüpfung
--
-- Fügt zwei neue Spalten hinzu:
--
--   players.auth_user_id
--     Verknüpft einen Supabase-Auth-Account mit einer Spieler:in-Zeile.
--     Wer sich einloggt, wird über diese Spalte als konkrete Person erkannt.
--     Bleibt NULL für Spieler:innen ohne eigenen Login (reine DB-Einträge für Statistiken).
--
--   sessions.created_by
--     Wer hat diese Partie angelegt? Grundlage für „nur Ersteller:in schreibt" (Auth-Stufe 3).
--     Wird beim Anlegen einer neuen Partie auf die auth_user_id der eingeloggten Person gesetzt.
--     Bleibt NULL für Partien, die vor dem Login-Bau angelegt wurden.
--
-- Ausführen: Supabase Dashboard → SQL Editor → dieses Script einfügen und ausführen.
-- Reihenfolge spielt keine Rolle (beide Befehle sind unabhängig voneinander).

-- Spieler:in ↔ Auth-Account verknüpfen
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Eindeutigkeitsindex: ein Auth-Account darf nur einer Spieler:in zugeordnet sein
CREATE UNIQUE INDEX IF NOT EXISTS players_auth_user_id_unique
  ON players(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Wer hat die Partie angelegt?
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
