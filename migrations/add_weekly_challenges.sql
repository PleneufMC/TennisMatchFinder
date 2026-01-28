-- Migration: Add weekly challenges system
-- Date: 2026-01-28
-- Description: Adds player_weekly_activity table and streak columns for weekly challenges

-- Add streak columns to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_streak_update TIMESTAMP;

-- Create player_weekly_activity table
CREATE TABLE IF NOT EXISTS player_weekly_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Week identification (ISO week: YYYY-WXX)
    week_year INTEGER NOT NULL, -- 2026
    week_number INTEGER NOT NULL, -- 1-53
    
    -- Activity tracking
    matches_played INTEGER DEFAULT 0 NOT NULL,
    proposals_sent INTEGER DEFAULT 0 NOT NULL,
    
    -- Challenge validation
    challenge_validated BOOLEAN DEFAULT false NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS player_weekly_activity_player_id_idx 
    ON player_weekly_activity(player_id);
CREATE INDEX IF NOT EXISTS player_weekly_activity_week_idx 
    ON player_weekly_activity(week_year, week_number);
CREATE UNIQUE INDEX IF NOT EXISTS player_weekly_activity_player_week_unique 
    ON player_weekly_activity(player_id, week_year, week_number);

-- Add badges for streaks (insert if not exists)
-- Note: badges table uses varchar id, so we use slug-style IDs
INSERT INTO badges (id, name, description, criteria, icon, tier, category, sort_order, is_active)
VALUES 
    ('streak-regular', 'Régulier', 'Actif pendant 4 semaines consécutives', 'Valider le challenge hebdomadaire 4 semaines de suite', '🥉', 'common', 'achievement', 100, true),
    ('streak-dedicated', 'Assidu', 'Actif pendant 6 mois consécutifs (26 semaines)', 'Valider le challenge hebdomadaire 26 semaines de suite', '🥈', 'epic', 'achievement', 101, true),
    ('streak-legend', 'Légende', 'Actif pendant 1 an consécutif (52 semaines)', 'Valider le challenge hebdomadaire 52 semaines de suite', '🥇', 'legendary', 'achievement', 102, true)
ON CONFLICT (id) DO NOTHING;

-- Add comments
COMMENT ON TABLE player_weekly_activity IS 'Tracks player activity per week for weekly challenges';
COMMENT ON COLUMN player_weekly_activity.week_year IS 'ISO week year (e.g., 2026)';
COMMENT ON COLUMN player_weekly_activity.week_number IS 'ISO week number (1-53)';
COMMENT ON COLUMN player_weekly_activity.challenge_validated IS 'Whether the weekly challenge was completed (1 match OR 2 proposals)';
COMMENT ON COLUMN players.current_streak IS 'Current consecutive weeks with validated challenges';
COMMENT ON COLUMN players.best_streak IS 'Best historical streak of consecutive validated weeks';
