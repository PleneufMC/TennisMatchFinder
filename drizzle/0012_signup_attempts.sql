-- Migration: Signup Attempts (Capture abandons inscription)
-- Date: 2026-01-28
-- Description: Table pour capturer les tentatives d'inscription, même abandonnées
-- Impact: Permet de récupérer les emails des utilisateurs qui n'ont pas terminé leur inscription

-- Créer l'enum pour le status des tentatives
DO $$ BEGIN
  CREATE TYPE signup_attempt_status AS ENUM ('started', 'in_progress', 'abandoned', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table principale signup_attempts
CREATE TABLE IF NOT EXISTS signup_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Données capturées progressivement
  email VARCHAR(255),
  full_name VARCHAR(100),
  city VARCHAR(100),
  self_assessed_level player_level,
  wants_to_join_club BOOLEAN,
  club_slug VARCHAR(50),
  -- Tracking de progression
  last_step_reached INTEGER NOT NULL DEFAULT 1, -- 1-6
  last_step_name VARCHAR(50), -- fullname, email, city, level, club_option, submit
  -- Status et conversion
  status signup_attempt_status NOT NULL DEFAULT 'started',
  converted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  converted_at TIMESTAMP,
  -- Analytics
  source VARCHAR(50), -- landing_hero, landing_cta, pricing_page, etc.
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  user_agent TEXT,
  -- Identifiant session pour regrouper les tentatives
  session_id VARCHAR(100),
  -- Temps passé sur le formulaire (en secondes)
  time_spent_seconds INTEGER,
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS signup_attempts_email_idx ON signup_attempts(email);
CREATE INDEX IF NOT EXISTS signup_attempts_status_idx ON signup_attempts(status);
CREATE INDEX IF NOT EXISTS signup_attempts_created_at_idx ON signup_attempts(created_at);
CREATE INDEX IF NOT EXISTS signup_attempts_session_id_idx ON signup_attempts(session_id);
CREATE INDEX IF NOT EXISTS signup_attempts_last_step_idx ON signup_attempts(last_step_reached);

-- Commentaires pour documentation
COMMENT ON TABLE signup_attempts IS 'Capture les tentatives d''inscription pour relance et analyse conversion';
COMMENT ON COLUMN signup_attempts.last_step_reached IS 'Étape atteinte: 1=fullname, 2=email, 3=city, 4=level, 5=club_option, 6=submit';
COMMENT ON COLUMN signup_attempts.status IS 'started=début, in_progress=en cours, abandoned=abandonné, completed=converti';
