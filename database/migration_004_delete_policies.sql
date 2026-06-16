-- Migration 004: DELETE-Policies für sessions und rounds (Entwicklungsphase)
-- Datum: 16. Juni 2026
--
-- Grund: Partien und Runden ließen sich nicht löschen. RLS ist aktiv, aber rls_dev.sql
-- hatte DELETE-Policies nur für announcements, special_points und games – NICHT für
-- sessions und rounds. Ohne passende Policy blockt RLS das Löschen STUMM (0 Zeilen
-- betroffen, kein Fehler). Betroffen war:
--   • "Alles verwerfen" (löscht die ganze Partie)
--   • "Beenden & Speichern" (löscht die unfertige laufende Runde)
--   • "Partie löschen" im Partie-Details-Screen
--
-- Die Kindtabellen (rounds, games, game_results, announcements, special_points,
-- round_participations) gehen per ON DELETE CASCADE automatisch mit – Cascade-Löschungen
-- umgehen die RLS der Kindtabellen, daher genügen die Policies auf sessions und rounds.
--
-- In Supabase ausführen: SQL-Editor → diesen Code einfügen → Run

CREATE POLICY "dev_delete" ON sessions FOR DELETE USING (true);
CREATE POLICY "dev_delete" ON rounds   FOR DELETE USING (true);
