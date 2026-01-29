-- ============================================================
-- Migration: NPS Survey (Net Promoter Score)
-- ============================================================
-- Version: 1.0.0
-- Date: 2026-01-29
-- Description: Ajoute la table pour stocker les réponses NPS
--
-- NPS = % Promoteurs (9-10) - % Détracteurs (0-6)
-- Passifs = 7-8
--
-- Déclenchement:
--   - Après 5 matchs joués
--   - Ou après 30 jours d'inscription
--   - Cooldown: 90 jours entre 2 surveys
-- ============================================================

-- Démarrer la transaction
BEGIN;

-- ============================================
-- 1. Table des réponses NPS
-- ============================================
CREATE TABLE IF NOT EXISTS nps_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Joueur qui répond
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Score NPS (0-10)
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    
    -- Feedback textuel optionnel
    feedback TEXT,
    
    -- Contexte du survey (quand il a été déclenché)
    trigger_reason VARCHAR(50) NOT NULL, -- 'matches_milestone', 'days_since_signup', 'manual'
    trigger_value INTEGER, -- Ex: 5 (matchs) ou 30 (jours)
    
    -- Si l'utilisateur a fermé sans répondre
    dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_nps_surveys_player_id ON nps_surveys(player_id);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_score ON nps_surveys(score);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_created_at ON nps_surveys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nps_surveys_dismissed ON nps_surveys(dismissed) WHERE dismissed = FALSE;

-- ============================================
-- 2. Vue pour analytics NPS
-- ============================================
CREATE OR REPLACE VIEW v_nps_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) AS date,
    COUNT(*) AS total_responses,
    COUNT(*) FILTER (WHERE score <= 6) AS detractors,
    COUNT(*) FILTER (WHERE score BETWEEN 7 AND 8) AS passives,
    COUNT(*) FILTER (WHERE score >= 9) AS promoters,
    ROUND(AVG(score)::NUMERIC, 1) AS avg_score,
    -- Calcul NPS = % Promoteurs - % Détracteurs
    ROUND(
        (COUNT(*) FILTER (WHERE score >= 9)::NUMERIC / NULLIF(COUNT(*), 0) * 100) -
        (COUNT(*) FILTER (WHERE score <= 6)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        0
    ) AS nps_score
FROM nps_surveys
WHERE dismissed = FALSE
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ============================================
-- 3. Vue pour NPS global
-- ============================================
CREATE OR REPLACE VIEW v_nps_global AS
SELECT 
    COUNT(*) AS total_responses,
    COUNT(*) FILTER (WHERE score <= 6) AS detractors,
    COUNT(*) FILTER (WHERE score BETWEEN 7 AND 8) AS passives,
    COUNT(*) FILTER (WHERE score >= 9) AS promoters,
    ROUND(AVG(score)::NUMERIC, 1) AS avg_score,
    ROUND(
        (COUNT(*) FILTER (WHERE score >= 9)::NUMERIC / NULLIF(COUNT(*), 0) * 100) -
        (COUNT(*) FILTER (WHERE score <= 6)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        0
    ) AS nps_score,
    ROUND(COUNT(*) FILTER (WHERE score <= 6)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) AS detractors_pct,
    ROUND(COUNT(*) FILTER (WHERE score BETWEEN 7 AND 8)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) AS passives_pct,
    ROUND(COUNT(*) FILTER (WHERE score >= 9)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) AS promoters_pct
FROM nps_surveys
WHERE dismissed = FALSE;

-- ============================================
-- 4. Commentaires pour documentation
-- ============================================
COMMENT ON TABLE nps_surveys IS 'Réponses au survey NPS (Net Promoter Score). Score de -100 à +100.';
COMMENT ON COLUMN nps_surveys.score IS 'Score de 0 à 10. 0-6=Détracteur, 7-8=Passif, 9-10=Promoteur';
COMMENT ON COLUMN nps_surveys.trigger_reason IS 'Raison du déclenchement: matches_milestone, days_since_signup, manual';
COMMENT ON COLUMN nps_surveys.dismissed IS 'TRUE si le survey a été fermé sans réponse';

COMMENT ON VIEW v_nps_analytics IS 'Analytics NPS par jour';
COMMENT ON VIEW v_nps_global IS 'Score NPS global avec distribution';

-- Valider la transaction
COMMIT;

-- ============================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================
SELECT 
    'Table nps_surveys créée' as info,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'nps_surveys') as exists;

-- ============================================
-- ROLLBACK (à exécuter manuellement si nécessaire)
-- ============================================
/*
BEGIN;
DROP VIEW IF EXISTS v_nps_global;
DROP VIEW IF EXISTS v_nps_analytics;
DROP TABLE IF EXISTS nps_surveys;
COMMIT;
*/
