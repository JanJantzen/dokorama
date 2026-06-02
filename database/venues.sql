-- DOKORAMA – Seed-Daten: Austragungsorte
-- Bei Jan/Kathrin/Dani sind private Orte (owner_id gesetzt), Knorke ist öffentlich (NULL)

INSERT INTO venues (name, owner_id)
VALUES
  ('Bei Jan',     (SELECT id FROM players WHERE name = 'Jan')),
  ('Bei Kathrin', (SELECT id FROM players WHERE name = 'Kathrin')),
  ('Bei Dani',    (SELECT id FROM players WHERE name = 'Dani')),
  ('Knorke',      NULL);
