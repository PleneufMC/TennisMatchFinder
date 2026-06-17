-- Migration: Marketplace profs (Lot 2) — profils coachs + créneaux de coaching
-- Date: 2026-06-17
-- Modèle économique : abonnement coach 15 €/mois (Stripe Subscriptions existant,
--   PAS de Stripe Connect, PAS de commission par lead). Paiement du cours
--   joueur->coach HORS plateforme (tarif affiché à titre indicatif).
-- Idempotente : ré-exécutable sans erreur.

-- 1. Enums (créés seulement s'ils n'existent pas)
DO $$ BEGIN
  CREATE TYPE "coach_subscription_status" AS ENUM ('active', 'past_due', 'canceled', 'incomplete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "coach_slot_status" AS ENUM ('open', 'booked', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Table coach_profiles : 1 ligne par coach
CREATE TABLE IF NOT EXISTS "coach_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "player_id" uuid NOT NULL UNIQUE REFERENCES "players"("id") ON DELETE CASCADE,
  "club_id" uuid REFERENCES "clubs"("id") ON DELETE SET NULL,
  "bio" text,
  "hourly_rate_cents" integer,
  "specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "stripe_customer_id" varchar(255),
  "stripe_subscription_id" varchar(255),
  "subscription_status" "coach_subscription_status",
  "current_period_end" timestamp,
  "cancel_at_period_end" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "coach_profiles_player_id_idx" ON "coach_profiles" ("player_id");
CREATE INDEX IF NOT EXISTS "coach_profiles_club_id_idx" ON "coach_profiles" ("club_id");
CREATE INDEX IF NOT EXISTS "coach_profiles_stripe_customer_id_idx" ON "coach_profiles" ("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "coach_profiles_status_idx" ON "coach_profiles" ("subscription_status");

-- 3. Table coach_slots : créneaux de 60 min publiés par un coach
CREATE TABLE IF NOT EXISTS "coach_slots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coach_profile_id" uuid NOT NULL REFERENCES "coach_profiles"("id") ON DELETE CASCADE,
  "coach_player_id" uuid NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "club_id" uuid REFERENCES "clubs"("id") ON DELETE SET NULL,
  "start_time" timestamp NOT NULL,
  "duration_minutes" integer DEFAULT 60 NOT NULL,
  "price_cents" integer,
  "location" varchar(200),
  "notes" varchar(300),
  "status" "coach_slot_status" DEFAULT 'open' NOT NULL,
  "booked_by_player_id" uuid REFERENCES "players"("id") ON DELETE SET NULL,
  "booked_at" timestamp,
  "completed_at" timestamp,
  "cancelled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "coach_slots_coach_profile_id_idx" ON "coach_slots" ("coach_profile_id");
CREATE INDEX IF NOT EXISTS "coach_slots_coach_player_id_idx" ON "coach_slots" ("coach_player_id");
CREATE INDEX IF NOT EXISTS "coach_slots_club_id_idx" ON "coach_slots" ("club_id");
CREATE INDEX IF NOT EXISTS "coach_slots_status_start_idx" ON "coach_slots" ("status", "start_time");
CREATE INDEX IF NOT EXISTS "coach_slots_booked_by_idx" ON "coach_slots" ("booked_by_player_id");

-- Documentation
COMMENT ON TABLE "coach_profiles" IS 'Profil coach (abonnement 15 EUR/mois via Stripe). Un membre peut etre joueur ET coach.';
COMMENT ON TABLE "coach_slots" IS 'Creneaux de coaching 60 min. Paiement du cours HORS plateforme, tarif affiche a titre indicatif.';
COMMENT ON COLUMN "coach_slots"."status" IS 'open->booked->confirmed->completed | cancelled. completed = base stats/avis.';
