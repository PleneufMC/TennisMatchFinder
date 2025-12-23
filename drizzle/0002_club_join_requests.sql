-- ============================================
-- TENNIS MATCHFINDER - MIGRATION 0002
-- Système de demandes d'adhésion aux clubs
-- ============================================

-- Créer le type ENUM pour le statut des demandes
DO $$ BEGIN
    CREATE TYPE join_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table des demandes d'adhésion aux clubs
CREATE TABLE IF NOT EXISTS club_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT,  -- Message de présentation du joueur
    self_assessed_level player_level NOT NULL DEFAULT 'intermédiaire',
    status join_request_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES players(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS club_join_requests_club_id_idx ON club_join_requests(club_id);
CREATE INDEX IF NOT EXISTS club_join_requests_user_id_idx ON club_join_requests(user_id);
CREATE INDEX IF NOT EXISTS club_join_requests_status_idx ON club_join_requests(status);

-- Contrainte unique: un utilisateur ne peut avoir qu'une seule demande en attente par club
CREATE UNIQUE INDEX IF NOT EXISTS club_join_requests_unique_pending 
ON club_join_requests(club_id, user_id) 
WHERE status = 'pending';
