-- Migration 006: Hängengelassene Hochzeit als neuer Solo-Typ
--
-- Fügt 'haengengelassene_hochzeit' zum game_type-ENUM hinzu.
-- PostgreSQL erlaubt das Erweitern eines ENUMs ohne Tabellen-Umbau –
-- bestehende Daten bleiben vollständig erhalten.
--
-- Ausführen in: Supabase Dashboard → SQL Editor

ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'haengengelassene_hochzeit';
