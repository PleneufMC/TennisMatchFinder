-- ============================================
-- Migration: Ajout du format "2 sets + Super TB"
-- ============================================
-- TennisMatchFinder - Sprint 5
-- Date: 15 janvier 2026
-- ============================================
-- 
-- Explication des formats :
-- - one_set : Match en 1 set (coeff 0.5)
-- - two_sets : 2 sets gagnants classiques (coeff 0.8)
-- - two_sets_super_tb : 2 sets + Super TB au 3ème si 1-1 (coeff 0.85)
-- - three_sets : 3 sets complets (coeff 1.0)
-- - super_tiebreak : Match en Super TB uniquement - 10 pts min, 2 pts écart (coeff 0.3)
--
-- Le Super Tie-Break est joué à 10 points (ou 2 points d'écart après 10-10)
-- Exemple : 10-7, 10-8, 11-9, 12-10, etc.
-- ============================================

-- ============================================
-- ÉTAPE 1: Ajouter la nouvelle valeur à l'ENUM
-- ============================================
-- PostgreSQL permet d'ajouter des valeurs à un ENUM existant

DO $$ 
BEGIN
    -- Vérifie si la valeur 'two_sets_super_tb' existe déjà
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'match_format' 
        AND e.enumlabel = 'two_sets_super_tb'
    ) THEN
        -- Ajoute la nouvelle valeur après 'two_sets'
        ALTER TYPE match_format ADD VALUE IF NOT EXISTS 'two_sets_super_tb' AFTER 'two_sets';
        RAISE NOTICE '✅ Valeur two_sets_super_tb ajoutée à l''enum match_format';
    ELSE
        RAISE NOTICE '⏩ Valeur two_sets_super_tb déjà présente dans l''enum';
    END IF;
END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher toutes les valeurs de l'enum match_format
SELECT enumlabel as format, enumsortorder as ordre
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'match_format'
ORDER BY enumsortorder;

-- Message de confirmation
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Migration terminée avec succès !';
    RAISE NOTICE '';
    RAISE NOTICE 'Formats disponibles :';
    RAISE NOTICE '  - one_set (1 set) : coeff 0.5';
    RAISE NOTICE '  - two_sets (2 sets gagnants) : coeff 0.8';
    RAISE NOTICE '  - two_sets_super_tb (2 sets + Super TB) : coeff 0.85';
    RAISE NOTICE '  - three_sets (3 sets) : coeff 1.0';
    RAISE NOTICE '  - super_tiebreak (10 pts) : coeff 0.3';
    RAISE NOTICE '';
    RAISE NOTICE 'Super Tie-Break = 10 points minimum, 2 points d''écart';
    RAISE NOTICE '============================================';
END $$;
