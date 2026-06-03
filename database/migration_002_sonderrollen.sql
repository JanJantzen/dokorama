-- Migration 002: Sonderrollen umbenennen
-- Datum: 3. Juni 2026
-- Grund: Klarere Begriffe für Hochzeit- und Armut-Rollen (kein Gendering nötig, präziser)
--
-- Alte Werte → Neue Werte:
--   hochzeiter  → hochzeit     (wer beide Kreuz-Damen hat)
--   armut       → arm          (wer ≤3 Trumpf hat)
--   retter      → reich        (wer die Armut-Karten nimmt)
--   solist      → unverändert
--   eingeheiratet → unverändert
--
-- In Supabase ausführen: SQL-Editor → diesen Code einfügen → Run

ALTER TYPE sonderrolle RENAME VALUE 'hochzeiter' TO 'hochzeit';
ALTER TYPE sonderrolle RENAME VALUE 'armut'      TO 'arm';
ALTER TYPE sonderrolle RENAME VALUE 'retter'     TO 'reich';
