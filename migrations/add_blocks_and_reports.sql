-- Migration: Add player blocks and reports
-- Date: 2026-01-28
-- Description: Adds tables for blocking players and reporting violations

-- Create report_category enum
DO $$ BEGIN
    CREATE TYPE report_category AS ENUM (
        'spam',           -- Spam, publicité
        'harassment',     -- Harcèlement, insultes
        'fake_profile',   -- Faux profil, usurpation
        'cheating',       -- Triche (scores falsifiés)
        'inappropriate',  -- Contenu inapproprié
        'other'           -- Autre
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create report_status enum
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
        'pending',    -- En attente de traitement
        'reviewing',  -- En cours d'examen
        'resolved',   -- Résolu (action prise)
        'dismissed'   -- Rejeté (pas de violation)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create player_blocks table
CREATE TABLE IF NOT EXISTS player_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    reason TEXT, -- Raison optionnelle (privée)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Un joueur ne peut bloquer un autre qu'une seule fois
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    -- On ne peut pas se bloquer soi-même
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Create player_reports table
CREATE TABLE IF NOT EXISTS player_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    category report_category NOT NULL,
    description TEXT NOT NULL,
    
    -- Evidence (optional)
    evidence_urls JSONB DEFAULT '[]',
    
    -- Status
    status report_status DEFAULT 'pending' NOT NULL,
    
    -- Admin handling
    handled_by UUID REFERENCES players(id) ON DELETE SET NULL,
    handled_at TIMESTAMP,
    admin_notes TEXT,
    resolution VARCHAR(100), -- 'warning', 'temp_ban', 'perm_ban', 'no_action'
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- On ne peut pas se signaler soi-même
    CONSTRAINT no_self_report CHECK (reporter_id != reported_id)
);

-- Create indexes for player_blocks
CREATE INDEX IF NOT EXISTS player_blocks_blocker_id_idx 
    ON player_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS player_blocks_blocked_id_idx 
    ON player_blocks(blocked_id);

-- Create indexes for player_reports
CREATE INDEX IF NOT EXISTS player_reports_reporter_id_idx 
    ON player_reports(reporter_id);
CREATE INDEX IF NOT EXISTS player_reports_reported_id_idx 
    ON player_reports(reported_id);
CREATE INDEX IF NOT EXISTS player_reports_status_idx 
    ON player_reports(status);
CREATE INDEX IF NOT EXISTS player_reports_created_at_idx 
    ON player_reports(created_at DESC);

-- Add comments
COMMENT ON TABLE player_blocks IS 'Blocage entre joueurs - le bloqueur ne verra plus le bloqué';
COMMENT ON TABLE player_reports IS 'Signalements de violations par les joueurs';
COMMENT ON COLUMN player_reports.evidence_urls IS 'URLs de preuves (screenshots, etc.)';
COMMENT ON COLUMN player_reports.resolution IS 'Action prise: warning, temp_ban, perm_ban, no_action';
