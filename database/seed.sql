-- ============================================================
-- DOKORAMA – Seed-Daten: Gruppe und alle Spieler:innen
-- Einmalig ausgeführt beim initialen Setup
-- ============================================================

-- Schritt 1: Gruppe anlegen
INSERT INTO groups (name, created_at)
VALUES ('Dokorama', '2018-05-16 00:00:00+00');

-- Schritt 2: Alle Spieler:innen anlegen
INSERT INTO players (name)
VALUES
  ('Robert'),
  ('Kathrin'),
  ('Sophia'),
  ('Dani'),
  ('Jan'),
  ('Jörn'),
  ('Stine'),
  ('Nils'),
  ('Louisa'),
  ('Jenny'),
  ('Alex');

-- Schritt 3: Mitgliedschaften anlegen
-- Jan bekommt Admin-Rolle, alle anderen Schreiber-Rolle
INSERT INTO group_memberships (player_id, group_id, role, joined_at)
SELECT
  p.id,
  g.id,
  CASE WHEN p.name = 'Jan' THEN 'admin'::group_role ELSE 'schreiber'::group_role END,
  '2018-05-16 00:00:00+00'
FROM players p, groups g
WHERE g.name = 'Dokorama'
  AND p.name IN ('Robert','Kathrin','Sophia','Dani','Jan','Jörn','Stine','Nils','Louisa','Jenny','Alex');
