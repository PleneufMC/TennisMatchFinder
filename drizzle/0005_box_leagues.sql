-- Migration: Box Leagues (Compétitions mensuelles par niveau)
-- Date: 2026-01-09

-- Enum for box league status
DO $$ BEGIN
  CREATE TYPE "box_league_status" AS ENUM('draft', 'registration', 'active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum for box league match status
DO $$ BEGIN
  CREATE TYPE "box_league_match_status" AS ENUM('scheduled', 'completed', 'forfeit', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Box Leagues table
CREATE TABLE IF NOT EXISTS "box_leagues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "description" text,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "registration_deadline" timestamp NOT NULL,
  "min_players" integer DEFAULT 4 NOT NULL,
  "max_players" integer DEFAULT 6 NOT NULL,
  "elo_range_min" integer,
  "elo_range_max" integer,
  "division" integer DEFAULT 1 NOT NULL,
  "matches_per_player" integer DEFAULT 5 NOT NULL,
  "points_win" integer DEFAULT 3 NOT NULL,
  "points_draw" integer DEFAULT 1 NOT NULL,
  "points_loss" integer DEFAULT 0 NOT NULL,
  "points_forfeit" integer DEFAULT -1 NOT NULL,
  "promotion_spots" integer DEFAULT 1 NOT NULL,
  "relegation_spots" integer DEFAULT 1 NOT NULL,
  "status" "box_league_status" DEFAULT 'draft' NOT NULL,
  "created_by" uuid REFERENCES "players"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Box League Participants table
CREATE TABLE IF NOT EXISTS "box_league_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "league_id" uuid NOT NULL REFERENCES "box_leagues"("id") ON DELETE CASCADE,
  "player_id" uuid NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "elo_at_start" integer NOT NULL,
  "matches_played" integer DEFAULT 0 NOT NULL,
  "matches_won" integer DEFAULT 0 NOT NULL,
  "matches_lost" integer DEFAULT 0 NOT NULL,
  "matches_drawn" integer DEFAULT 0 NOT NULL,
  "points" integer DEFAULT 0 NOT NULL,
  "sets_won" integer DEFAULT 0 NOT NULL,
  "sets_lost" integer DEFAULT 0 NOT NULL,
  "games_won" integer DEFAULT 0 NOT NULL,
  "games_lost" integer DEFAULT 0 NOT NULL,
  "final_rank" integer,
  "is_promoted" boolean DEFAULT false NOT NULL,
  "is_relegated" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "withdraw_reason" text,
  "registered_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Box League Matches table
CREATE TABLE IF NOT EXISTS "box_league_matches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "league_id" uuid NOT NULL REFERENCES "box_leagues"("id") ON DELETE CASCADE,
  "player1_id" uuid NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "player2_id" uuid NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "winner_id" uuid REFERENCES "players"("id") ON DELETE SET NULL,
  "score" varchar(50),
  "player1_sets" integer,
  "player2_sets" integer,
  "player1_games" integer,
  "player2_games" integer,
  "status" "box_league_match_status" DEFAULT 'scheduled' NOT NULL,
  "forfeit_by" uuid REFERENCES "players"("id") ON DELETE SET NULL,
  "main_match_id" uuid REFERENCES "matches"("id") ON DELETE SET NULL,
  "scheduled_date" timestamp,
  "played_at" timestamp,
  "deadline" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for box_leagues
CREATE INDEX IF NOT EXISTS "box_leagues_club_id_idx" ON "box_leagues" ("club_id");
CREATE INDEX IF NOT EXISTS "box_leagues_status_idx" ON "box_leagues" ("status");
CREATE INDEX IF NOT EXISTS "box_leagues_dates_idx" ON "box_leagues" ("start_date", "end_date");

-- Indexes for box_league_participants
CREATE INDEX IF NOT EXISTS "box_league_participants_league_id_idx" ON "box_league_participants" ("league_id");
CREATE INDEX IF NOT EXISTS "box_league_participants_player_id_idx" ON "box_league_participants" ("player_id");
CREATE INDEX IF NOT EXISTS "box_league_participants_points_idx" ON "box_league_participants" ("points");
CREATE UNIQUE INDEX IF NOT EXISTS "box_league_participants_unique_idx" ON "box_league_participants" ("league_id", "player_id");

-- Indexes for box_league_matches
CREATE INDEX IF NOT EXISTS "box_league_matches_league_id_idx" ON "box_league_matches" ("league_id");
CREATE INDEX IF NOT EXISTS "box_league_matches_player1_id_idx" ON "box_league_matches" ("player1_id");
CREATE INDEX IF NOT EXISTS "box_league_matches_player2_id_idx" ON "box_league_matches" ("player2_id");
CREATE INDEX IF NOT EXISTS "box_league_matches_status_idx" ON "box_league_matches" ("status");
