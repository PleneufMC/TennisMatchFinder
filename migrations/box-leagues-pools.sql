-- ============================================
-- BOX LEAGUES POOLS MIGRATION
-- Ajout du système de poules avec tirage au sort
-- Date: 2026-01-17
-- ============================================

-- 1. Ajouter les colonnes pour les poules à la table box_leagues
ALTER TABLE box_leagues 
ADD COLUMN IF NOT EXISTS pool_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS players_per_pool INTEGER NOT NULL DEFAULT 6,
ADD COLUMN IF NOT EXISTS pools_drawn BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Ajouter la colonne pool_number aux participants
ALTER TABLE box_league_participants 
ADD COLUMN IF NOT EXISTS pool_number INTEGER;

-- 3. Créer un index sur pool_number pour les requêtes par poule
CREATE INDEX IF NOT EXISTS box_league_participants_pool_idx 
ON box_league_participants(league_id, pool_number);

-- 4. Ajouter des commentaires
COMMENT ON COLUMN box_leagues.pool_count IS 'Nombre de poules (1 = pas de poules, 2+ = tirage au sort)';
COMMENT ON COLUMN box_leagues.players_per_pool IS 'Nombre de joueurs par poule';
COMMENT ON COLUMN box_leagues.pools_drawn IS 'Le tirage au sort a-t-il été effectué ?';
COMMENT ON COLUMN box_league_participants.pool_number IS 'Numéro de poule assignée (1=A, 2=B, 3=C, etc.)';

-- 5. Vérification
DO $$
BEGIN
    -- Vérifier que les colonnes ont été ajoutées
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'box_leagues' AND column_name = 'pool_count'
    ) THEN
        RAISE NOTICE '✅ Box Leagues pools migration completed successfully!';
        RAISE NOTICE '   - pool_count column: OK';
        RAISE NOTICE '   - players_per_pool column: OK';
        RAISE NOTICE '   - pools_drawn column: OK';
        RAISE NOTICE '   - pool_number column on participants: OK';
    ELSE
        RAISE EXCEPTION 'Migration failed: columns not created';
    END IF;
END $$;
