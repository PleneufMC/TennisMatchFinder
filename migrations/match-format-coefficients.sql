-- ============================================
-- Migration: Coefficient ELO par Format de Match
-- ============================================
-- TennisMatchFinder - USP vs Playtomic
-- Date: 13 janvier 2026
-- ============================================

-- ============================================
-- ÉTAPE 1: Créer l'ENUM match_format
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_format') THEN
        CREATE TYPE match_format AS ENUM ('one_set', 'two_sets', 'three_sets', 'super_tiebreak');
    END IF;
END $$;

-- ============================================
-- ÉTAPE 2: Ajouter la colonne match_format à la table matches
-- ============================================

ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_format match_format NOT NULL DEFAULT 'two_sets';

-- ============================================
-- ÉTAPE 3: Ajouter les colonnes breakdown à elo_history
-- ============================================

ALTER TABLE elo_history
ADD COLUMN IF NOT EXISTS format_coefficient DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS margin_modifier DECIMAL(3,2);

-- ============================================
-- ÉTAPE 4: Créer les index (optionnel, pour performance)
-- ============================================

CREATE INDEX IF NOT EXISTS matches_match_format_idx ON matches(match_format);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que la colonne existe
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'matches' AND column_name = 'match_format';

-- Afficher les formats existants
SELECT match_format, COUNT(*) as count 
FROM matches 
GROUP BY match_format 
ORDER BY count DESC;
