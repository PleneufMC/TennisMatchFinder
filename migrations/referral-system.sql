-- ============================================================
-- Migration: Système de parrainage (Referral System)
-- ============================================================
-- Version: 1.0.0
-- Date: 2026-01-29
-- Auteur: TennisMatchFinder
-- Description: Ajoute les tables et fonctions pour gérer le 
--              programme de parrainage (referral rate target: 10%)
-- 
-- Tables créées:
--   - referrals: Tracking des parrainages
--   - player_referral_stats: Stats agrégées par joueur
--
-- Badges ajoutés:
--   - ambassador (rare): 3 filleuls inscrits
--   - networker (epic): 10 filleuls inscrits
--
-- IMPORTANT: Exécuter sur une base de données avec les tables
--            'players' et 'badges' déjà existantes.
-- ============================================================

-- Démarrer la transaction
BEGIN;

-- ============================================
-- 1. ENUM pour le statut des parrainages
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
        CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'rewarded');
        RAISE NOTICE 'Type referral_status créé';
    ELSE
        RAISE NOTICE 'Type referral_status existe déjà';
    END IF;
END $$;

-- ============================================
-- 2. Table des parrainages
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parrain (celui qui invite)
    referrer_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Filleul (celui qui est invité) - NULL tant qu'il n'a pas de compte
    referred_id UUID REFERENCES players(id) ON DELETE SET NULL,
    
    -- Email du filleul (capturé avant qu'il ait un compte)
    referred_email VARCHAR(255),
    
    -- Status du parrainage
    -- pending: lien partagé/cliqué mais inscription non terminée
    -- completed: filleul inscrit avec succès
    -- rewarded: récompense attribuée au parrain
    status referral_status NOT NULL DEFAULT 'pending',
    
    -- Code de parrainage personnalisé (optionnel, pour liens courts)
    referral_code VARCHAR(20),
    
    -- Tracking temporel
    clicked_at TIMESTAMP WITH TIME ZONE,      -- Quand le lien a été cliqué
    completed_at TIMESTAMP WITH TIME ZONE,    -- Quand l'inscription est terminée
    rewarded_at TIMESTAMP WITH TIME ZONE,     -- Quand la récompense a été donnée
    
    -- UTM tracking pour attribution marketing
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals(referred_email) WHERE referred_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

-- Contrainte: un parrain ne peut pas se parrainer lui-même
ALTER TABLE referrals DROP CONSTRAINT IF EXISTS chk_no_self_referral;
ALTER TABLE referrals ADD CONSTRAINT chk_no_self_referral 
    CHECK (referrer_id != referred_id);

RAISE NOTICE 'Table referrals créée avec index';

-- ============================================
-- 3. Table des stats de parrainage (dénormalisée pour performance)
-- ============================================
CREATE TABLE IF NOT EXISTS player_referral_stats (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    
    -- Compteurs
    total_referrals INTEGER NOT NULL DEFAULT 0,      -- Total de parrainages initiés
    completed_referrals INTEGER NOT NULL DEFAULT 0,  -- Inscriptions complétées
    rewarded_referrals INTEGER NOT NULL DEFAULT 0,   -- Récompenses obtenues
    
    -- Timestamps
    last_referral_at TIMESTAMP WITH TIME ZONE,       -- Dernier parrainage complété
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

RAISE NOTICE 'Table player_referral_stats créée';

-- ============================================
-- 4. Badges Ambassador et Networker
-- ============================================
INSERT INTO badges (id, name, description, criteria, category, tier, icon, icon_color, sort_order, is_active, is_dynamic, max_progress)
VALUES 
    (
        'ambassador', 
        'Ambassador', 
        '3 filleuls inscrits', 
        'Parrainez 3 nouveaux joueurs', 
        'social', 
        'rare', 
        'UserPlus', 
        '#3B82F6',  -- blue-500
        25, 
        true, 
        false, 
        3
    ),
    (
        'networker', 
        'Networker', 
        '10 filleuls inscrits - Influenceur !', 
        'Parrainez 10 nouveaux joueurs', 
        'social', 
        'epic', 
        'Network', 
        '#8B5CF6',  -- purple-500
        26, 
        true, 
        false, 
        10
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    criteria = EXCLUDED.criteria,
    category = EXCLUDED.category,
    tier = EXCLUDED.tier,
    icon = EXCLUDED.icon,
    icon_color = EXCLUDED.icon_color,
    sort_order = EXCLUDED.sort_order,
    max_progress = EXCLUDED.max_progress;

RAISE NOTICE 'Badges ambassador et networker ajoutés';

-- ============================================
-- 5. Fonction pour mettre à jour les stats de parrainage
-- ============================================
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_total INTEGER;
    v_completed INTEGER;
    v_rewarded INTEGER;
BEGIN
    -- Calculer les stats actuelles
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status IN ('completed', 'rewarded')),
        COUNT(*) FILTER (WHERE status = 'rewarded')
    INTO v_total, v_completed, v_rewarded
    FROM referrals 
    WHERE referrer_id = NEW.referrer_id;

    -- Upsert des stats
    INSERT INTO player_referral_stats (
        player_id, 
        total_referrals, 
        completed_referrals, 
        rewarded_referrals, 
        last_referral_at, 
        updated_at
    )
    VALUES (
        NEW.referrer_id,
        v_total,
        v_completed,
        v_rewarded,
        CASE WHEN NEW.status IN ('completed', 'rewarded') THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (player_id) DO UPDATE SET
        total_referrals = v_total,
        completed_referrals = v_completed,
        rewarded_referrals = v_rewarded,
        last_referral_at = CASE 
            WHEN NEW.status IN ('completed', 'rewarded') THEN NOW() 
            ELSE player_referral_stats.last_referral_at 
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'Fonction update_referral_stats créée';

-- ============================================
-- 6. Trigger pour mettre à jour les stats automatiquement
-- ============================================
DROP TRIGGER IF EXISTS trg_update_referral_stats ON referrals;
CREATE TRIGGER trg_update_referral_stats
    AFTER INSERT OR UPDATE OF status ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_stats();

RAISE NOTICE 'Trigger trg_update_referral_stats créé';

-- ============================================
-- 7. Fonction pour mettre à jour updated_at automatiquement
-- ============================================
CREATE OR REPLACE FUNCTION update_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_referrals_updated_at ON referrals;
CREATE TRIGGER trg_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referrals_updated_at();

RAISE NOTICE 'Trigger updated_at créé';

-- ============================================
-- 8. Commentaires pour documentation
-- ============================================
COMMENT ON TABLE referrals IS 'Programme de parrainage - tracking des invitations et conversions. Objectif: referral rate >= 10%';
COMMENT ON TABLE player_referral_stats IS 'Stats de parrainage agrégées par joueur (dénormalisé pour performance)';

COMMENT ON COLUMN referrals.referrer_id IS 'ID du joueur parrain (celui qui invite)';
COMMENT ON COLUMN referrals.referred_id IS 'ID du joueur filleul (celui qui a été invité), NULL si pas encore inscrit';
COMMENT ON COLUMN referrals.referred_email IS 'Email du filleul capturé avant création du compte';
COMMENT ON COLUMN referrals.status IS 'pending=en attente, completed=inscrit, rewarded=récompensé';
COMMENT ON COLUMN referrals.referral_code IS 'Code personnalisé optionnel pour liens courts';

COMMENT ON COLUMN player_referral_stats.total_referrals IS 'Nombre total de parrainages initiés';
COMMENT ON COLUMN player_referral_stats.completed_referrals IS 'Nombre de filleuls ayant complété leur inscription';
COMMENT ON COLUMN player_referral_stats.rewarded_referrals IS 'Nombre de parrainages ayant donné lieu à une récompense';

-- ============================================
-- 9. Vue pour analytics (optionnel)
-- ============================================
CREATE OR REPLACE VIEW v_referral_analytics AS
SELECT 
    DATE_TRUNC('day', r.created_at) AS date,
    COUNT(*) AS total_referrals,
    COUNT(*) FILTER (WHERE r.status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE r.status = 'rewarded') AS rewarded,
    ROUND(
        COUNT(*) FILTER (WHERE r.status IN ('completed', 'rewarded'))::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) AS conversion_rate_pct
FROM referrals r
GROUP BY DATE_TRUNC('day', r.created_at)
ORDER BY date DESC;

COMMENT ON VIEW v_referral_analytics IS 'Vue agrégée pour dashboard analytics parrainage';

RAISE NOTICE 'Vue v_referral_analytics créée';

-- Valider la transaction
COMMIT;

-- ============================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================
DO $$
DECLARE
    v_tables_ok BOOLEAN;
    v_badges_ok BOOLEAN;
BEGIN
    -- Vérifier que les tables existent
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name IN ('referrals', 'player_referral_stats')
    ) INTO v_tables_ok;

    -- Vérifier que les badges existent
    SELECT EXISTS (
        SELECT 1 FROM badges 
        WHERE id IN ('ambassador', 'networker')
    ) INTO v_badges_ok;

    IF v_tables_ok AND v_badges_ok THEN
        RAISE NOTICE '✅ Migration réussie! Tables et badges créés correctement.';
    ELSE
        RAISE WARNING '⚠️ Migration peut être incomplète. Vérifiez les tables et badges.';
    END IF;
END $$;

-- ============================================
-- ROLLBACK (à exécuter manuellement si nécessaire)
-- ============================================
-- Pour annuler cette migration, exécuter:
/*
BEGIN;
DROP VIEW IF EXISTS v_referral_analytics;
DROP TRIGGER IF EXISTS trg_update_referral_stats ON referrals;
DROP TRIGGER IF EXISTS trg_referrals_updated_at ON referrals;
DROP FUNCTION IF EXISTS update_referral_stats();
DROP FUNCTION IF EXISTS update_referrals_updated_at();
DROP TABLE IF EXISTS player_referral_stats;
DROP TABLE IF EXISTS referrals;
DROP TYPE IF EXISTS referral_status;
DELETE FROM badges WHERE id IN ('ambassador', 'networker');
COMMIT;
*/
