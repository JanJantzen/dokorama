-- Migration 011: Spalte zaehlopunkte → zaehlpunkte umbenennen
--
-- Die Spalte game_results.zaehlopunkte enthält die Zählpunkte einer Spieler:in
-- für ein einzelnes Spiel (+ für Gewinner, − für Verlierer, berechnet und
-- gespeichert). Der Name enthielt einen alten Tippfehler ("zaehl-O-punkte");
-- korrekt ist "zaehlpunkte" (von "Zählpunkte").
--
-- Reine Umbenennung – der Inhalt bleibt unverändert, keine Daten gehen verloren.
-- Es gibt (noch) keine Views oder Policies, die diese Spalte namentlich referenzieren.
--
-- WICHTIG: Diese Migration und die zugehörige Code-Änderung gehören zusammen.
-- Nach dem Ausführen erwartet der Code die Spalte unter dem neuen Namen.
--
-- Ausführen: Supabase Dashboard → SQL Editor → ausführen.

ALTER TABLE game_results
  RENAME COLUMN zaehlopunkte TO zaehlpunkte;
