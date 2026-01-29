-- ============================================================
-- Migration: Système de parrainage (Referral System)
-- VERSION POUR NEON SQL EDITOR
-- ============================================================

-- Démarrer la transaction
BEGIN;

-- 1. ENUM pour le statut des parrainages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
        CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'rewarded');
    END IF;
END $$;

-- 2. Table des parrainages
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES players(id) ON DELETE SET NULL,
    referred_email VARCHAR(255),
    status referral_status NOT NULL DEFAULT 'pending',
    referral_code VARCHAR(20),
    clicked_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    rewarded_at TIMESTAMP WITH TIME ZONE,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
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
ALTER TABLE referrals ADD CONSTRAINT chk_no_self_referral CHECK (referrer_id != referred_id);

-- 3. Table des stats de parrainage
CREATE TABLE IF NOT EXISTS player_referral_stats (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    total_referrals INTEGER NOT NULL DEFAULT 0,
    completed_referrals INTEGER NOT NULL DEFAULT 0,
    rewarded_referrals INTEGER NOT NULL DEFAULT 0,
    last_referral_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Badges Ambassador et Networker
INSERT INTO badges (id, name, description, criteria, category, tier, icon, icon_color, sort_order, is_active, is_dynamic, max_progress)
VALUES 
    ('ambassador', 'Ambassador', '3 filleuls inscrits', 'Parrainez 3 nouveaux joueurs', 'social', 'rare', 'UserPlus', '#3B82F6', 25, true, false, 3),
    ('networker', 'Networker', '10 filleuls inscrits - Influenceur !', 'Parrainez 10 nouveaux joueurs', 'social', 'epic', 'Network', '#8B5CF6', 26, true, false, 10)
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

-- 5. Fonction pour mettre à jour les stats de parrainage
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_total INTEGER;
    v_completed INTEGER;
    v_rewarded INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status IN ('completed', 'rewarded')),
        COUNT(*) FILTER (WHERE status = 'rewarded')
    INTO v_total, v_completed, v_rewarded
    FROM referrals 
    WHERE referrer_id = NEW.referrer_id;

    INSERT INTO player_referral_stats (player_id, total_referrals, completed_referrals, rewarded_referrals, last_referral_at, updated_at)
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

-- 6. Trigger pour mettre à jour les stats automatiquement
DROP TRIGGER IF EXISTS trg_update_referral_stats ON referrals;
CREATE TRIGGER trg_update_referral_stats
    AFTER INSERT OR UPDATE OF status ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_stats();

-- 7. Fonction pour mettre à jour updated_at automatiquement
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

-- 8. Vue pour analytics
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

-- Valider la transaction
COMMIT;

-- Vérification
SELECT 'Tables créées:' as info, 
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('referrals', 'player_referral_stats')) as tables_count,
       'Badges ajoutés:' as info2,
       (SELECT COUNT(*) FROM badges WHERE id IN ('ambassador', 'networker')) as badges_count;
