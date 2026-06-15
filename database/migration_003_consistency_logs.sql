-- Migration 003: Konsistenz-Logbuch (consistency_logs)
-- Datum: 15. Juni 2026
-- Grund: Teil 6 der Konsistenzregeln (KONSISTENZREGELN.md, C.Fallback / Prinzip P8).
--
-- Das Sicherheitsnetz "sicherer Default": Wenn eine Eingabe einen widersprüchlichen
-- Zustand erzeugen würde, für den KEIN spezifischer Auflösungs-Dialog vorgesehen ist,
-- wird die Aktion blockiert (der letzte saubere Stand bleibt), der generische
-- Block-Dialog erscheint und der Vorfall wird HIER festgehalten – damit die zugrunde
-- liegende Regel-Lücke später gefunden und geschlossen werden kann.
--
-- Dieses Logbuch sollte im Normalbetrieb leer bleiben. Jede Zeile ist ein Hinweis auf
-- eine echte Lücke im Regelwerk.
--
-- In Supabase ausführen: SQL-Editor → diesen Code einfügen → Run

-- Die Tabelle ---------------------------------------------------------------
CREATE TABLE consistency_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violated_invariants  TEXT[]      NOT NULL,                 -- verletzte Invarianten (A.4), z.B. {I6}
  attempted_action     JSONB       NOT NULL,                 -- die blockierte Aktion (enthält die betroffenen Spieler:innen)
  state_before         JSONB       NOT NULL,                 -- kompletter Spielstand vor der Aktion (zum Nachstellen)
  writer_id            UUID REFERENCES players(id) ON DELETE SET NULL, -- Schreiber:in; bis zum Login-Bau immer NULL
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()    -- Zeitstempel
);

-- Row Level Security ---------------------------------------------------------
-- Analog zu rls_dev.sql bewusst offen für die Entwicklungsphase: lesen und
-- einfügen für alle erlaubt. Kein UPDATE/DELETE – ein Logbuch wird nur ergänzt,
-- nie verändert.
ALTER TABLE consistency_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dev_read"  ON consistency_logs FOR SELECT USING (true);
CREATE POLICY "dev_write" ON consistency_logs FOR INSERT WITH CHECK (true);
