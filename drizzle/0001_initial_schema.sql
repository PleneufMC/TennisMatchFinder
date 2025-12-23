-- ============================================
-- TENNIS MATCHFINDER - MIGRATION INITIALE
-- Base de données: Neon PostgreSQL
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
    CREATE TYPE player_level AS ENUM ('débutant', 'intermédiaire', 'avancé', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE game_type AS ENUM ('simple', 'double');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE court_surface AS ENUM ('terre battue', 'dur', 'gazon', 'indoor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE weekday AS ENUM ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE time_slot AS ENUM ('matin', 'midi', 'après-midi', 'soir');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE forum_category AS ENUM ('général', 'recherche-partenaire', 'résultats', 'équipement', 'annonces');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE elo_change_reason AS ENUM ('match_win', 'match_loss', 'inactivity_decay', 'manual_adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- NEXT-AUTH TABLES
-- ============================================

-- Users table (NextAuth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    email_verified TIMESTAMP,
    image TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Accounts table (NextAuth - OAuth providers)
CREATE TABLE IF NOT EXISTS accounts (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    PRIMARY KEY (provider, provider_account_id)
);

-- Sessions table (NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
    session_token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL
);

-- Verification tokens (NextAuth - Email magic links)
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- ============================================
-- APPLICATION TABLES
-- ============================================

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    contact_email VARCHAR(255),
    website_url TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Players (extends users with tennis-specific data)
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    bio TEXT,
    current_elo INTEGER NOT NULL DEFAULT 1200,
    best_elo INTEGER NOT NULL DEFAULT 1200,
    lowest_elo INTEGER NOT NULL DEFAULT 1200,
    self_assessed_level player_level NOT NULL DEFAULT 'intermédiaire',
    availability JSONB NOT NULL DEFAULT '{"days": [], "timeSlots": []}',
    preferences JSONB NOT NULL DEFAULT '{"gameTypes": ["simple"], "surfaces": []}',
    matches_played INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    win_streak INTEGER NOT NULL DEFAULT 0,
    best_win_streak INTEGER NOT NULL DEFAULT 0,
    unique_opponents INTEGER NOT NULL DEFAULT 0,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_match_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS players_club_id_idx ON players(club_id);
CREATE INDEX IF NOT EXISTS players_current_elo_idx ON players(current_elo);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    player1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    winner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    score VARCHAR(50) NOT NULL,
    game_type game_type NOT NULL DEFAULT 'simple',
    surface court_surface,
    location VARCHAR(100),
    player1_elo_before INTEGER NOT NULL,
    player2_elo_before INTEGER NOT NULL,
    player1_elo_after INTEGER NOT NULL,
    player2_elo_after INTEGER NOT NULL,
    modifiers_applied JSONB NOT NULL DEFAULT '{}',
    played_at TIMESTAMP NOT NULL,
    reported_by UUID REFERENCES players(id),
    validated BOOLEAN NOT NULL DEFAULT false,
    validated_by UUID REFERENCES players(id),
    validated_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS matches_club_id_idx ON matches(club_id);
CREATE INDEX IF NOT EXISTS matches_player1_id_idx ON matches(player1_id);
CREATE INDEX IF NOT EXISTS matches_player2_id_idx ON matches(player2_id);
CREATE INDEX IF NOT EXISTS matches_played_at_idx ON matches(played_at);

-- ELO History
CREATE TABLE IF NOT EXISTS elo_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    elo INTEGER NOT NULL,
    delta INTEGER NOT NULL,
    reason elo_change_reason NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS elo_history_player_id_idx ON elo_history(player_id);
CREATE INDEX IF NOT EXISTS elo_history_recorded_at_idx ON elo_history(recorded_at);

-- Match Proposals
CREATE TABLE IF NOT EXISTS match_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    from_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    to_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    proposed_date TIMESTAMP,
    proposed_time VARCHAR(10),
    message TEXT,
    status proposal_status NOT NULL DEFAULT 'pending',
    responded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS match_proposals_from_player_id_idx ON match_proposals(from_player_id);
CREATE INDEX IF NOT EXISTS match_proposals_to_player_id_idx ON match_proposals(to_player_id);
CREATE INDEX IF NOT EXISTS match_proposals_status_idx ON match_proposals(status);

-- Forum Threads
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    author_id UUID REFERENCES players(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category forum_category NOT NULL DEFAULT 'général',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    is_bot BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0,
    reply_count INTEGER NOT NULL DEFAULT 0,
    last_reply_at TIMESTAMP,
    last_reply_by UUID REFERENCES players(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forum_threads_club_id_idx ON forum_threads(club_id);
CREATE INDEX IF NOT EXISTS forum_threads_category_idx ON forum_threads(category);
CREATE INDEX IF NOT EXISTS forum_threads_created_at_idx ON forum_threads(created_at);

-- Forum Replies
CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES players(id) ON DELETE SET NULL,
    parent_reply_id UUID,
    content TEXT NOT NULL,
    is_bot BOOLEAN NOT NULL DEFAULT false,
    is_solution BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forum_replies_thread_id_idx ON forum_replies(thread_id);

-- Forum Reactions
CREATE TABLE IF NOT EXISTS forum_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    target_type VARCHAR(10) NOT NULL,
    target_id UUID NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS forum_reactions_user_target_idx ON forum_reactions(user_id, target_type, target_id);

-- Player Badges
CREATE TABLE IF NOT EXISTS player_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(50),
    earned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS player_badges_player_id_idx ON player_badges(player_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- ============================================
-- CHAT TABLES (NOUVELLE FONCTIONNALITÉ)
-- ============================================

-- Chat Rooms (conversations)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(100),
    is_direct BOOLEAN NOT NULL DEFAULT false,  -- true = conversation privée entre 2 personnes
    is_group BOOLEAN NOT NULL DEFAULT false,   -- true = conversation de groupe
    created_by UUID REFERENCES players(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_rooms_club_id_idx ON chat_rooms(club_id);

-- Chat Room Members (participants)
CREATE TABLE IF NOT EXISTS chat_room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    last_read_at TIMESTAMP,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, player_id)
);

CREATE INDEX IF NOT EXISTS chat_room_members_room_id_idx ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS chat_room_members_player_id_idx ON chat_room_members(player_id);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES players(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',  -- 'text', 'image', 'system'
    metadata JSONB NOT NULL DEFAULT '{}',
    is_edited BOOLEAN NOT NULL DEFAULT false,
    edited_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- ============================================
-- SEED DATA (Club de démonstration)
-- ============================================

-- Insérer un club de démonstration
INSERT INTO clubs (name, slug, description, is_active)
VALUES (
    'TC Pleneuf Val-André',
    'tc-pleneuf',
    'Club de tennis de Pléneuf-Val-André - Bienvenue sur Tennis MatchFinder !',
    true
)
ON CONFLICT (slug) DO NOTHING;
