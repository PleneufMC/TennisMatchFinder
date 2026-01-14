-- ===========================================
-- Migration: Système de Réputation Post-Match
-- Sprint 4 - TennisMatchFinder
-- Date: 14 janvier 2026
-- ===========================================

-- 1. Créer la table match_ratings pour stocker les évaluations
-- ============================================================

CREATE TABLE IF NOT EXISTS match_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rated_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Critères d'évaluation (1-5 étoiles)
  punctuality INTEGER NOT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
  fair_play INTEGER NOT NULL CHECK (fair_play >= 1 AND fair_play <= 5),
  friendliness INTEGER NOT NULL CHECK (friendliness >= 1 AND friendliness <= 5),
  
  -- Commentaire optionnel (privé, pour les admins)
  comment TEXT,
  
  -- Moyenne calculée
  average_rating DECIMAL(2,1) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS match_ratings_match_id_idx ON match_ratings(match_id);
CREATE INDEX IF NOT EXISTS match_ratings_rater_id_idx ON match_ratings(rater_id);
CREATE INDEX IF NOT EXISTS match_ratings_rated_player_id_idx ON match_ratings(rated_player_id);

-- Contrainte d'unicité : un joueur ne peut évaluer qu'une fois par match
CREATE UNIQUE INDEX IF NOT EXISTS match_ratings_unique_idx ON match_ratings(match_id, rater_id);


-- 2. Ajouter les colonnes de réputation à la table players
-- =========================================================

ALTER TABLE players 
ADD COLUMN IF NOT EXISTS reputation_avg DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS reputation_punctuality DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS reputation_fair_play DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS reputation_friendliness DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS reputation_count INTEGER DEFAULT 0 NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN players.reputation_avg IS 'Moyenne générale de réputation (1-5)';
COMMENT ON COLUMN players.reputation_punctuality IS 'Moyenne ponctualité (1-5)';
COMMENT ON COLUMN players.reputation_fair_play IS 'Moyenne fair-play (1-5)';
COMMENT ON COLUMN players.reputation_friendliness IS 'Moyenne convivialité (1-5)';
COMMENT ON COLUMN players.reputation_count IS 'Nombre total d évaluations reçues';


-- 3. Ajouter le badge "Partenaire Fiable" 
-- ========================================

INSERT INTO badges (
  id, 
  name, 
  description, 
  criteria, 
  category, 
  tier, 
  icon, 
  icon_color, 
  sort_order, 
  is_active, 
  is_dynamic, 
  max_progress
)
VALUES (
  'reliable-partner',
  'Partenaire Fiable',
  'Excellente réputation',
  'Obtenez une moyenne de 4.5/5 avec au moins 5 évaluations',
  'social',
  'rare',
  'UserCheck',
  '#10B981',
  24,
  true,
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  criteria = EXCLUDED.criteria,
  icon = EXCLUDED.icon,
  icon_color = EXCLUDED.icon_color;


-- 4. Vérification
-- ================

-- Afficher la structure de la table match_ratings
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'match_ratings'
ORDER BY ordinal_position;

-- Afficher les nouvelles colonnes de players
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'players' 
  AND column_name LIKE 'reputation%'
ORDER BY column_name;

-- Compter les badges
SELECT tier, COUNT(*) as count FROM badges GROUP BY tier ORDER BY tier;
