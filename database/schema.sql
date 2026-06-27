-- ============================================================
-- DOKORAMA – Datenbankschema v1
-- Erstellt: Juni 2026
-- Alle Tabellen in Abhängigkeitsreihenfolge anlegen
-- (erst die unabhängigen, dann die abhängigen)
-- ============================================================

-- Vordefinierte Wertelisten (Enums) -------------------------

CREATE TYPE global_role     AS ENUM ('super_admin', 'normal');
CREATE TYPE group_role      AS ENUM ('admin', 'schreiber', 'leser');
CREATE TYPE session_status  AS ENUM ('laufend', 'abgeschlossen');
CREATE TYPE round_status    AS ENUM ('laufend', 'abgeschlossen');
CREATE TYPE game_type       AS ENUM ('normal', 'hochzeit', 'armut', 'fleischlos', 'buben_solo', 'damen_solo', 'farb_solo', 'stilles_solo', 'haengengelassene_hochzeit');
CREATE TYPE farbe           AS ENUM ('karo', 'herz', 'pik', 'kreuz');
CREATE TYPE partei          AS ENUM ('re', 'kontra', 'ausgesetzt');
CREATE TYPE sonderrolle     AS ENUM ('solist', 'hochzeit', 'eingeheiratet', 'arm', 'reich');
CREATE TYPE ansage_typ      AS ENUM ('re', 'kontra', 'keine_90', 'keine_60', 'keine_30', 'schwarz');
CREATE TYPE sonderpunkt_typ AS ENUM ('fuchs_gefangen', 'karlchen_gemacht', 'karlchen_gefangen', 'doppelkopf');

-- Spieler ---------------------------------------------------
CREATE TABLE players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Supabase-Login (optional)
  name         TEXT NOT NULL,
  avatar_url   TEXT,
  email        TEXT UNIQUE,
  global_role  global_role NOT NULL DEFAULT 'normal',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gruppen ---------------------------------------------------
CREATE TABLE groups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  image_url         TEXT,
  public_link_token TEXT UNIQUE DEFAULT gen_random_uuid()::text, -- Token für den öffentlichen Nur-Lesen-Link
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Austragungsorte -------------------------------------------
CREATE TABLE venues (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL,
  owner_id UUID REFERENCES players(id) ON DELETE SET NULL -- NULL = öffentlicher Ort
);

-- Gruppenmitgliedschaften -----------------------------------
CREATE TABLE group_memberships (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role      group_role NOT NULL DEFAULT 'leser',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, group_id) -- jede:r Spieler:in kann einer Gruppe nur einmal angehören
);

-- Abende ----------------------------------------------------
CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  venue_id   UUID REFERENCES venues(id) ON DELETE SET NULL,
  date       DATE NOT NULL,
  status     session_status NOT NULL DEFAULT 'laufend',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Runden ----------------------------------------------------
CREATE TABLE rounds (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  number     INTEGER NOT NULL,
  status     round_status NOT NULL DEFAULT 'laufend',
  UNIQUE (session_id, number)
);

-- Runden-Teilnahmen -----------------------------------------
CREATE TABLE round_participations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id      UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seat_position INTEGER NOT NULL CHECK (seat_position BETWEEN 1 AND 7),
  UNIQUE (round_id, player_id),
  UNIQUE (round_id, seat_position)
);

-- Spiele ----------------------------------------------------
CREATE TABLE games (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id     UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  number       INTEGER NOT NULL,
  game_type    game_type NOT NULL DEFAULT 'normal',
  farbe        farbe,                                           -- nur bei Farb-Solo
  augen_re     INTEGER CHECK (augen_re BETWEEN 0 AND 240),     -- nur bei App-Erfassung
  augen_re_min INTEGER CHECK (augen_re_min BETWEEN 0 AND 240), -- nur beim historischen Import
  augen_re_max INTEGER CHECK (augen_re_max BETWEEN 0 AND 240), -- nur beim historischen Import
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (round_id, number),
  CONSTRAINT augen_exclusivity CHECK (                         -- augen_re und min/max schließen sich aus
    (augen_re IS NOT NULL AND augen_re_min IS NULL AND augen_re_max IS NULL) OR
    (augen_re IS NULL AND augen_re_min IS NOT NULL AND augen_re_max IS NOT NULL) OR
    (augen_re IS NULL AND augen_re_min IS NULL AND augen_re_max IS NULL)
  )
);

-- Spielergebnisse -------------------------------------------
CREATE TABLE game_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  partei       partei NOT NULL,
  sonderrolle  sonderrolle,
  zaehlopunkte INTEGER NOT NULL DEFAULT 0,                     -- berechnet, aber gespeichert
  UNIQUE (game_id, player_id)
);

-- Ansagen ---------------------------------------------------
CREATE TABLE announcements (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id   UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  typ       ansage_typ NOT NULL
);

-- Sonderpunkte ----------------------------------------------
CREATE TABLE special_points (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id   UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE, -- wer hat es erzielt
  typ       sonderpunkt_typ NOT NULL,
  loser_id  UUID REFERENCES players(id) ON DELETE SET NULL          -- wem wurde es abgenommen (Fuchs/Karlchen)
);
