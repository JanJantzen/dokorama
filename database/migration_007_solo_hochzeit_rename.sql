-- Migration 007: game_type-Wert umbenennen: haengengelassene_hochzeit → solo_hochzeit
--
-- PostgreSQL 10+ unterstützt das direkte Umbenennen von ENUM-Werten.
-- Da noch keine Spiele mit dem alten Wert gespeichert wurden, ist das sicher.
--
-- Ausführen in: Supabase Dashboard → SQL Editor

ALTER TYPE game_type RENAME VALUE 'haengengelassene_hochzeit' TO 'solo_hochzeit';
