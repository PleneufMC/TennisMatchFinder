-- ============================================
-- Trophy Case 2.0 Migration - TennisMatchFinder
-- ============================================
-- À exécuter sur Neon PostgreSQL
-- Date: 2026-01-13
-- ============================================

-- ============================================
-- ÉTAPE 1: Créer les ENUMs (si pas déjà présents)
-- ============================================

DO $$ 
BEGIN
    -- Créer badge_tier si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_tier') THEN
        CREATE TYPE badge_tier AS ENUM ('common', 'rare', 'epic', 'legendary');
    END IF;
    
    -- Créer badge_category si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_category') THEN
        CREATE TYPE badge_category AS ENUM ('milestone', 'achievement', 'social', 'special');
    END IF;
END $$;

-- ============================================
-- ÉTAPE 2: Créer la table badges
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    criteria TEXT NOT NULL,
    category badge_category NOT NULL,
    tier badge_tier NOT NULL DEFAULT 'common',
    icon VARCHAR(50) NOT NULL,
    icon_color VARCHAR(20),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_dynamic BOOLEAN NOT NULL DEFAULT false,
    max_progress INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index pour la table badges
CREATE INDEX IF NOT EXISTS badges_category_idx ON badges(category);
CREATE INDEX IF NOT EXISTS badges_tier_idx ON badges(tier);

-- ============================================
-- ÉTAPE 3: Modifier player_badges
-- ============================================

-- Sauvegarder les données existantes (si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_badges') THEN
        -- Créer une table temporaire
        CREATE TEMP TABLE player_badges_backup AS SELECT * FROM player_badges;
    END IF;
END $$;

-- Supprimer l'ancienne table player_badges si elle existe
DROP TABLE IF EXISTS player_badges CASCADE;

-- Créer la nouvelle table player_badges
CREATE TABLE player_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0,
    seen BOOLEAN NOT NULL DEFAULT false,
    earned_at TIMESTAMP DEFAULT NOW() NOT NULL,
    seen_at TIMESTAMP
);

-- Index pour player_badges
CREATE INDEX IF NOT EXISTS player_badges_player_id_idx ON player_badges(player_id);
CREATE INDEX IF NOT EXISTS player_badges_badge_id_idx ON player_badges(badge_id);
CREATE INDEX IF NOT EXISTS player_badges_unique_idx ON player_badges(player_id, badge_id);

-- ============================================
-- ÉTAPE 4: Insérer les 16 badges
-- ============================================

INSERT INTO badges (id, name, description, criteria, category, tier, icon, icon_color, sort_order, is_active, is_dynamic, max_progress)
VALUES
-- JALONS (Milestones) - 5 badges
('first-rally', 'First Rally', 'Premier match enregistré', 'Enregistrez votre premier match', 'milestone', 'common', 'Sparkles', '#6B7280', 1, true, false, 1),
('getting-started', 'Getting Started', '10 matchs joués', 'Jouez 10 matchs', 'milestone', 'common', 'Target', '#6B7280', 2, true, false, 10),
('regular', 'Habitué', '25 matchs joués', 'Jouez 25 matchs', 'milestone', 'rare', 'Activity', '#3B82F6', 3, true, false, 25),
('dedicated', 'Passionné', '50 matchs joués', 'Jouez 50 matchs', 'milestone', 'epic', 'Flame', '#8B5CF6', 4, true, false, 50),
('century', 'Century', '100 matchs joués - Légende !', 'Jouez 100 matchs', 'milestone', 'legendary', 'Trophy', '#F59E0B', 5, true, false, 100),

-- EXPLOITS (Achievements) - 4 badges
('hot-streak', 'Hot Streak', '3 victoires consécutives', 'Gagnez 3 matchs d''affilée', 'achievement', 'rare', 'Zap', '#3B82F6', 10, true, false, 3),
('on-fire', 'On Fire', '5 victoires consécutives', 'Gagnez 5 matchs d''affilée', 'achievement', 'epic', 'Flame', '#EF4444', 11, true, false, 5),
('giant-killer', 'Giant Killer', 'Victoire contre un joueur +200 ELO', 'Battez un adversaire avec +200 ELO', 'achievement', 'epic', 'Sword', '#8B5CF6', 12, true, false, NULL),
('rising-star', 'Rising Star', '+100 ELO en 30 jours', 'Progressez de 100 ELO en un mois', 'achievement', 'rare', 'TrendingUp', '#10B981', 13, true, false, NULL),

-- SOCIAL - 4 badges
('social-butterfly', 'Social Butterfly', '10 adversaires différents', 'Jouez contre 10 joueurs différents', 'social', 'rare', 'Users', '#3B82F6', 20, true, false, 10),
('club-pillar', 'Pilier du Club', '25 adversaires différents', 'Jouez contre 25 joueurs différents', 'social', 'epic', 'Building', '#8B5CF6', 21, true, false, 25),
('rival-master', 'Rival Master', '10 matchs vs même adversaire', 'Affrontez le même joueur 10 fois', 'social', 'rare', 'Swords', '#F59E0B', 22, true, false, 10),
('welcome-committee', 'Comité d''accueil', 'Premier match de 5 nouveaux membres', 'Soyez le premier adversaire de 5 nouveaux', 'social', 'common', 'HandHeart', '#EC4899', 23, true, false, 5),

-- SPÉCIAL - 4 badges
('king-of-club', 'King of Club', '#1 ELO de ton club', 'Atteins la première place du classement', 'special', 'legendary', 'Crown', '#F59E0B', 30, true, true, NULL),
('founding-member', 'Founding Member', 'Membre depuis le début', 'Inscription pendant la phase Early Bird', 'special', 'legendary', 'Star', '#F59E0B', 31, true, false, NULL),
('tournament-victor', 'Champion', 'Vainqueur de tournoi', 'Remportez un tournoi', 'special', 'epic', 'Medal', '#8B5CF6', 32, true, false, NULL),
('box-league-winner', 'Roi de la Poule', 'Vainqueur de Box League', 'Terminez premier de votre poule', 'special', 'epic', 'Award', '#8B5CF6', 33, true, false, NULL)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    criteria = EXCLUDED.criteria,
    category = EXCLUDED.category,
    tier = EXCLUDED.tier,
    icon = EXCLUDED.icon,
    icon_color = EXCLUDED.icon_color,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    is_dynamic = EXCLUDED.is_dynamic,
    max_progress = EXCLUDED.max_progress;

-- ============================================
-- ÉTAPE 5: Migrer les badges existants (optionnel)
-- ============================================
-- Si des joueurs avaient déjà des badges avec l'ancien système,
-- décommentez et adaptez cette section selon votre ancien format

-- INSERT INTO player_badges (player_id, badge_id, progress, seen, earned_at)
-- SELECT 
--     player_id,
--     badge_type as badge_id,  -- Adapter selon l'ancien nom de colonne
--     0 as progress,
--     false as seen,
--     earned_at
-- FROM player_badges_backup
-- WHERE badge_type IN (SELECT id FROM badges)
-- ON CONFLICT DO NOTHING;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher le résumé des badges créés
SELECT 
    tier,
    COUNT(*) as count
FROM badges
GROUP BY tier
ORDER BY 
    CASE tier 
        WHEN 'common' THEN 1 
        WHEN 'rare' THEN 2 
        WHEN 'epic' THEN 3 
        WHEN 'legendary' THEN 4 
    END;

-- Afficher tous les badges
SELECT id, name, tier, category FROM badges ORDER BY sort_order;
