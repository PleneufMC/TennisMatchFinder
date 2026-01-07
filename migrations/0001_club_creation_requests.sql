-- Migration: Création de la table club_creation_requests
-- Date: 2025-01-07
-- Description: Table pour stocker les demandes de création de club en attente de validation admin

-- Créer l'enum pour le statut des demandes de création de club
DO $$ BEGIN
    CREATE TYPE club_creation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer la table club_creation_requests
CREATE TABLE IF NOT EXISTS club_creation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Infos du demandeur
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_name VARCHAR(100) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(20),
    
    -- Infos du club demandé
    club_name VARCHAR(100) NOT NULL,
    club_slug VARCHAR(50) NOT NULL,
    club_description TEXT,
    club_address TEXT,
    club_website TEXT,
    estimated_members INTEGER,
    
    -- Validation
    approval_token VARCHAR(64) NOT NULL UNIQUE,
    status club_creation_status NOT NULL DEFAULT 'pending',
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Créer les index
CREATE INDEX IF NOT EXISTS club_creation_requests_user_id_idx ON club_creation_requests(user_id);
CREATE INDEX IF NOT EXISTS club_creation_requests_status_idx ON club_creation_requests(status);
CREATE INDEX IF NOT EXISTS club_creation_requests_token_idx ON club_creation_requests(approval_token);

-- Commentaires
COMMENT ON TABLE club_creation_requests IS 'Demandes de création de club en attente de validation par l''admin';
COMMENT ON COLUMN club_creation_requests.approval_token IS 'Token unique pour les liens d''approbation/rejet par email';
COMMENT ON COLUMN club_creation_requests.expires_at IS 'Date d''expiration du token (7 jours par défaut)';
