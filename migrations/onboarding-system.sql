-- Migration: Onboarding System
-- Date: 2026-01-14
--
-- Ajoute le support pour l'onboarding guidé des nouveaux joueurs

-- ===========================================
-- COLONNE ONBOARDING
-- ===========================================

-- Flag pour savoir si le joueur a complété l'onboarding
ALTER TABLE players ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL;

-- Marquer tous les joueurs existants comme ayant complété l'onboarding
-- (ils sont déjà actifs sur la plateforme)
UPDATE players SET onboarding_completed = TRUE WHERE onboarding_completed = FALSE;

-- ===========================================
-- COMMENTAIRES
-- ===========================================

COMMENT ON COLUMN players.onboarding_completed IS 'True si le joueur a complété le flow d''onboarding (5 écrans)';

-- ===========================================
-- VERIFICATION
-- ===========================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'onboarding_completed') THEN
    RAISE EXCEPTION 'Column onboarding_completed not added to players table';
  END IF;
  RAISE NOTICE 'Migration onboarding-system completed successfully';
END $$;
