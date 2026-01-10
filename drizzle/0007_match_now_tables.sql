-- Migration: Tables Match Now
-- Date: 2026-01-10
-- Description: Crée les tables match_now_availability et match_now_responses si elles n'existent pas

-- Table des disponibilités Match Now
CREATE TABLE IF NOT EXISTS "match_now_availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "player_id" uuid NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
  "available_until" timestamp NOT NULL,
  "message" varchar(200),
  "game_types" jsonb DEFAULT '["simple"]'::jsonb NOT NULL,
  "elo_min" integer,
  "elo_max" integer,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Table des réponses Match Now
CREATE TABLE IF NOT EXISTS "match_now_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "availability_id" uuid NOT NULL REFERENCES "match_now_availability"("id") ON DELETE CASCADE,
  "responder_id" uuid NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "message" varchar(200),
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "match_now_availability_player_id_idx" ON "match_now_availability" ("player_id");
CREATE INDEX IF NOT EXISTS "match_now_availability_club_id_idx" ON "match_now_availability" ("club_id");
CREATE INDEX IF NOT EXISTS "match_now_availability_active_idx" ON "match_now_availability" ("is_active", "available_until");
CREATE INDEX IF NOT EXISTS "match_now_responses_availability_id_idx" ON "match_now_responses" ("availability_id");
