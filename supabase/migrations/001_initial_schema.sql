-- ============================================
-- TennisMatchFinder - Migration Initiale
-- Version: 001
-- Description: Création du schéma complet de la base de données
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Pour la recherche full-text

-- ============================================
-- TYPES ÉNUMÉRÉS
-- ============================================

-- Niveaux auto-évalués
CREATE TYPE player_level AS ENUM ('débutant', 'intermédiaire', 'avancé', 'expert');

-- Types de jeu
CREATE TYPE game_type AS ENUM ('simple', 'double');

-- Surfaces de jeu
CREATE TYPE court_surface AS ENUM ('terre battue', 'dur', 'gazon', 'indoor');

-- Jours de la semaine
CREATE TYPE weekday AS ENUM ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche');

-- Créneaux horaires
CREATE TYPE time_slot AS ENUM ('matin', 'midi', 'après-midi', 'soir');

-- Catégories forum
CREATE TYPE forum_category AS ENUM ('général', 'recherche-partenaire', 'résultats', 'équipement', 'annonces');

-- Statuts de proposition de match
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Types de réaction
CREATE TYPE reaction_emoji AS ENUM ('👍', '🎾', '🔥', '😂', '🤔');

-- Types de cible pour réaction
CREATE TYPE reaction_target_type AS ENUM ('thread', 'reply');

-- Raisons de changement ELO
CREATE TYPE elo_change_reason AS ENUM ('match_win', 'match_loss', 'inactivity_decay', 'manual_adjustment');

-- ============================================
-- TABLES PRINCIPALES
-- ============================================

-- -----------------------------------------
-- Clubs (Multi-tenant)
-- -----------------------------------------
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  settings JSONB DEFAULT '{
    "allowPublicRegistration": true,
    "requireApproval": false,
    "defaultElo": 1200,
    "inactivityDecay": {
      "enabled": true,
      "weeksBeforeDecay": 3,
      "decayPerWeek": 2
    },
    "eloConfig": {
      "kFactorNew": 40,
      "kFactorIntermediate": 32,
      "kFactorEstablished": 24,
      "kFactorHigh": 16
    }
  }'::jsonb,
  contact_email TEXT,
  website_url TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche par slug
CREATE INDEX idx_clubs_slug ON public.clubs(slug);
CREATE INDEX idx_clubs_active ON public.clubs(is_active) WHERE is_active = TRUE;

-- -----------------------------------------
-- Joueurs (Extension de auth.users)
-- -----------------------------------------
CREATE TABLE public.players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE RESTRICT,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  
  -- ELO et stats
  current_elo INTEGER DEFAULT 1200 CHECK (current_elo >= 0 AND current_elo <= 3000),
  best_elo INTEGER DEFAULT 1200 CHECK (best_elo >= 0 AND best_elo <= 3000),
  lowest_elo INTEGER DEFAULT 1200 CHECK (lowest_elo >= 0 AND lowest_elo <= 3000),
  self_assessed_level player_level DEFAULT 'intermédiaire',
  
  -- Disponibilités (stockées en JSONB pour flexibilité)
  availability JSONB DEFAULT '{
    "days": [],
    "timeSlots": []
  }'::jsonb,
  
  -- Préférences de jeu
  preferences JSONB DEFAULT '{
    "gameTypes": ["simple"],
    "surfaces": [],
    "preferredLocations": []
  }'::jsonb,
  
  -- Statistiques
  matches_played INTEGER DEFAULT 0 CHECK (matches_played >= 0),
  wins INTEGER DEFAULT 0 CHECK (wins >= 0),
  losses INTEGER DEFAULT 0 CHECK (losses >= 0),
  win_streak INTEGER DEFAULT 0 CHECK (win_streak >= 0),
  best_win_streak INTEGER DEFAULT 0 CHECK (best_win_streak >= 0),
  unique_opponents INTEGER DEFAULT 0 CHECK (unique_opponents >= 0),
  
  -- Rôles et permissions
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  last_match_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT wins_losses_match CHECK (wins + losses = matches_played OR matches_played = 0)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_players_club ON public.players(club_id);
CREATE INDEX idx_players_club_elo ON public.players(club_id, current_elo DESC);
CREATE INDEX idx_players_club_active ON public.players(club_id, last_active_at DESC);
CREATE INDEX idx_players_email ON public.players(email);
CREATE INDEX idx_players_name_search ON public.players USING gin(full_name gin_trgm_ops);

-- -----------------------------------------
-- Historique ELO
-- -----------------------------------------
CREATE TABLE public.elo_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  elo INTEGER NOT NULL CHECK (elo >= 0 AND elo <= 3000),
  delta INTEGER NOT NULL,
  match_id UUID,  -- NULL si decay ou ajustement manuel
  reason elo_change_reason NOT NULL,
  details JSONB,  -- Stocke les modificateurs appliqués
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les graphiques de progression
CREATE INDEX idx_elo_history_player ON public.elo_history(player_id, recorded_at DESC);
CREATE INDEX idx_elo_history_player_30d ON public.elo_history(player_id, recorded_at DESC) 
  WHERE recorded_at > NOW() - INTERVAL '30 days';

-- -----------------------------------------
-- Matchs
-- -----------------------------------------
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE RESTRICT,
  
  -- Joueurs
  player1_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  player2_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  winner_id UUID NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  
  -- Score
  score TEXT NOT NULL,  -- Format: "6-4 6-2" ou "6-4 3-6 7-5"
  game_type game_type DEFAULT 'simple',
  surface court_surface,
  location TEXT,
  
  -- ELO avant/après
  player1_elo_before INTEGER NOT NULL,
  player2_elo_before INTEGER NOT NULL,
  player1_elo_after INTEGER NOT NULL,
  player2_elo_after INTEGER NOT NULL,
  
  -- Détails des modificateurs appliqués
  modifiers_applied JSONB DEFAULT '{
    "player1": { "modifier": 1.0, "details": [] },
    "player2": { "modifier": 1.0, "details": [] }
  }'::jsonb,
  
  -- Métadonnées
  played_at TIMESTAMPTZ NOT NULL,
  reported_by UUID REFERENCES public.players(id),
  validated BOOLEAN DEFAULT FALSE,
  validated_by UUID REFERENCES public.players(id),
  validated_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT different_players CHECK (player1_id != player2_id),
  CONSTRAINT valid_winner CHECK (winner_id IN (player1_id, player2_id)),
  CONSTRAINT valid_elo_values CHECK (
    player1_elo_before >= 0 AND player1_elo_after >= 0 AND
    player2_elo_before >= 0 AND player2_elo_after >= 0
  )
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_matches_club ON public.matches(club_id);
CREATE INDEX idx_matches_club_date ON public.matches(club_id, played_at DESC);
CREATE INDEX idx_matches_player1 ON public.matches(player1_id, played_at DESC);
CREATE INDEX idx_matches_player2 ON public.matches(player2_id, played_at DESC);
CREATE INDEX idx_matches_players ON public.matches(player1_id, player2_id);
CREATE INDEX idx_matches_winner ON public.matches(winner_id, played_at DESC);
CREATE INDEX idx_matches_recent ON public.matches(played_at DESC) 
  WHERE played_at > NOW() - INTERVAL '30 days';

-- -----------------------------------------
-- Forum : Threads
-- -----------------------------------------
CREATE TABLE public.forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  
  -- Contenu
  category forum_category NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 10000),
  
  -- Flags
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,  -- Posts du bot N8N
  is_announcement BOOLEAN DEFAULT FALSE,
  
  -- Stats
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES public.players(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes forum
CREATE INDEX idx_forum_threads_club ON public.forum_threads(club_id);
CREATE INDEX idx_forum_threads_club_category ON public.forum_threads(club_id, category, created_at DESC);
CREATE INDEX idx_forum_threads_club_recent ON public.forum_threads(club_id, created_at DESC);
CREATE INDEX idx_forum_threads_pinned ON public.forum_threads(club_id, is_pinned DESC, created_at DESC);
CREATE INDEX idx_forum_threads_author ON public.forum_threads(author_id);
CREATE INDEX idx_forum_threads_title_search ON public.forum_threads USING gin(title gin_trgm_ops);

-- -----------------------------------------
-- Forum : Réponses
-- -----------------------------------------
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  parent_reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  
  -- Contenu
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  
  -- Flags
  is_bot BOOLEAN DEFAULT FALSE,
  is_solution BOOLEAN DEFAULT FALSE,  -- Marqué comme solution
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les réponses
CREATE INDEX idx_forum_replies_thread ON public.forum_replies(thread_id, created_at ASC);
CREATE INDEX idx_forum_replies_author ON public.forum_replies(author_id);
CREATE INDEX idx_forum_replies_parent ON public.forum_replies(parent_reply_id) WHERE parent_reply_id IS NOT NULL;

-- -----------------------------------------
-- Forum : Réactions
-- -----------------------------------------
CREATE TABLE public.forum_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  target_type reaction_target_type NOT NULL,
  target_id UUID NOT NULL,
  emoji reaction_emoji NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Une réaction par utilisateur par cible par emoji
  UNIQUE(user_id, target_type, target_id, emoji)
);

-- Index pour les réactions
CREATE INDEX idx_forum_reactions_target ON public.forum_reactions(target_type, target_id);
CREATE INDEX idx_forum_reactions_user ON public.forum_reactions(user_id);

-- -----------------------------------------
-- Propositions de Match
-- -----------------------------------------
CREATE TABLE public.match_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  
  -- Joueurs
  from_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  to_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  
  -- Détails de la proposition
  proposed_date DATE,
  proposed_time TEXT,
  proposed_location TEXT,
  message TEXT CHECK (char_length(message) <= 500),
  game_type game_type DEFAULT 'simple',
  
  -- Statut
  status proposal_status DEFAULT 'pending',
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  -- Contraintes
  CONSTRAINT different_proposal_players CHECK (from_player_id != to_player_id)
);

-- Index pour les propositions
CREATE INDEX idx_proposals_to ON public.match_proposals(to_player_id, status);
CREATE INDEX idx_proposals_from ON public.match_proposals(from_player_id, status);
CREATE INDEX idx_proposals_club ON public.match_proposals(club_id, created_at DESC);
CREATE INDEX idx_proposals_pending ON public.match_proposals(status, expires_at) 
  WHERE status = 'pending';

-- -----------------------------------------
-- Badges et Achievements
-- -----------------------------------------
CREATE TABLE public.player_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,  -- 'explorer', 'giant_killer', 'streak_5', etc.
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un badge par type par joueur
  UNIQUE(player_id, badge_type)
);

-- Index pour les badges
CREATE INDEX idx_player_badges_player ON public.player_badges(player_id);

-- -----------------------------------------
-- Notifications
-- -----------------------------------------
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'match_proposal', 'match_result', 'forum_mention', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,  -- URL de redirection
  data JSONB,  -- Données supplémentaires
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) 
  WHERE is_read = FALSE;

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction helper pour récupérer le club_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_user_club_id()
RETURNS UUID AS $$
  SELECT club_id FROM public.players WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fonction pour vérifier si l'utilisateur est admin de son club
CREATE OR REPLACE FUNCTION is_club_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.players WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Mise à jour automatique de updated_at
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_threads_updated_at
  BEFORE UPDATE ON public.forum_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at
  BEFORE UPDATE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mise à jour automatique du reply_count et last_reply_at des threads
CREATE OR REPLACE FUNCTION update_thread_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_threads
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_by = NEW.author_id
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_threads
    SET reply_count = GREATEST(0, reply_count - 1)
    WHERE id = OLD.thread_id;
    
    -- Mettre à jour last_reply_at avec la dernière réponse restante
    UPDATE public.forum_threads t
    SET 
      last_reply_at = (
        SELECT MAX(created_at) FROM public.forum_replies WHERE thread_id = t.id
      ),
      last_reply_by = (
        SELECT author_id FROM public.forum_replies 
        WHERE thread_id = t.id 
        ORDER BY created_at DESC LIMIT 1
      )
    WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reply_insert
AFTER INSERT ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION update_thread_reply_stats();

CREATE TRIGGER on_reply_delete
AFTER DELETE ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION update_thread_reply_stats();

-- Mise à jour des stats joueur après match
CREATE OR REPLACE FUNCTION update_player_stats_on_match()
RETURNS TRIGGER AS $$
DECLARE
  v_winner_id UUID;
  v_loser_id UUID;
  v_winner_new_elo INTEGER;
  v_loser_new_elo INTEGER;
  v_opponent_count INTEGER;
BEGIN
  -- Déterminer gagnant et perdant
  v_winner_id := NEW.winner_id;
  IF NEW.winner_id = NEW.player1_id THEN
    v_loser_id := NEW.player2_id;
    v_winner_new_elo := NEW.player1_elo_after;
    v_loser_new_elo := NEW.player2_elo_after;
  ELSE
    v_loser_id := NEW.player1_id;
    v_winner_new_elo := NEW.player2_elo_after;
    v_loser_new_elo := NEW.player1_elo_after;
  END IF;
  
  -- Mettre à jour le gagnant
  UPDATE public.players SET
    matches_played = matches_played + 1,
    wins = wins + 1,
    win_streak = win_streak + 1,
    best_win_streak = GREATEST(best_win_streak, win_streak + 1),
    current_elo = v_winner_new_elo,
    best_elo = GREATEST(best_elo, v_winner_new_elo),
    lowest_elo = LEAST(lowest_elo, v_winner_new_elo),
    last_active_at = NOW(),
    last_match_at = NEW.played_at
  WHERE id = v_winner_id;
  
  -- Mettre à jour le perdant
  UPDATE public.players SET
    matches_played = matches_played + 1,
    losses = losses + 1,
    win_streak = 0,
    current_elo = v_loser_new_elo,
    best_elo = GREATEST(best_elo, v_loser_new_elo),
    lowest_elo = LEAST(lowest_elo, v_loser_new_elo),
    last_active_at = NOW(),
    last_match_at = NEW.played_at
  WHERE id = v_loser_id;
  
  -- Mettre à jour le compteur d'adversaires uniques pour les deux joueurs
  -- Pour le player1
  SELECT COUNT(DISTINCT 
    CASE 
      WHEN player1_id = NEW.player1_id THEN player2_id 
      ELSE player1_id 
    END
  ) INTO v_opponent_count
  FROM public.matches 
  WHERE (player1_id = NEW.player1_id OR player2_id = NEW.player1_id);
  
  UPDATE public.players SET unique_opponents = v_opponent_count WHERE id = NEW.player1_id;
  
  -- Pour le player2
  SELECT COUNT(DISTINCT 
    CASE 
      WHEN player1_id = NEW.player2_id THEN player2_id 
      ELSE player1_id 
    END
  ) INTO v_opponent_count
  FROM public.matches 
  WHERE (player1_id = NEW.player2_id OR player2_id = NEW.player2_id);
  
  UPDATE public.players SET unique_opponents = v_opponent_count WHERE id = NEW.player2_id;
  
  -- Enregistrer l'historique ELO pour les deux joueurs
  INSERT INTO public.elo_history (player_id, elo, delta, match_id, reason, details)
  VALUES 
    (NEW.player1_id, NEW.player1_elo_after, NEW.player1_elo_after - NEW.player1_elo_before, NEW.id,
      CASE WHEN NEW.winner_id = NEW.player1_id THEN 'match_win' ELSE 'match_loss' END::elo_change_reason,
      NEW.modifiers_applied->'player1'),
    (NEW.player2_id, NEW.player2_elo_after, NEW.player2_elo_after - NEW.player2_elo_before, NEW.id,
      CASE WHEN NEW.winner_id = NEW.player2_id THEN 'match_win' ELSE 'match_loss' END::elo_change_reason,
      NEW.modifiers_applied->'player2');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_match_created
AFTER INSERT ON public.matches
FOR EACH ROW EXECUTE FUNCTION update_player_stats_on_match();

-- Expiration automatique des propositions de match
CREATE OR REPLACE FUNCTION expire_old_proposals()
RETURNS VOID AS $$
BEGIN
  UPDATE public.match_proposals
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- Policies: Clubs
-- -----------------------------------------

-- Lecture publique des clubs actifs
CREATE POLICY "Clubs are viewable by everyone"
  ON public.clubs FOR SELECT
  USING (is_active = TRUE);

-- Modification par les admins du club uniquement
CREATE POLICY "Admins can update their club"
  ON public.clubs FOR UPDATE
  TO authenticated
  USING (id = get_user_club_id() AND is_club_admin());

-- -----------------------------------------
-- Policies: Players
-- -----------------------------------------

-- Les joueurs peuvent voir les membres de leur club
CREATE POLICY "Players viewable by same club members"
  ON public.players FOR SELECT
  TO authenticated
  USING (club_id = get_user_club_id());

-- Les joueurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
  ON public.players FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Insertion lors de l'inscription (via service role)
CREATE POLICY "Service role can insert players"
  ON public.players FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

-- Les admins peuvent modifier les joueurs de leur club
CREATE POLICY "Admins can update club players"
  ON public.players FOR UPDATE
  TO authenticated
  USING (club_id = get_user_club_id() AND is_club_admin());

-- -----------------------------------------
-- Policies: Matches
-- -----------------------------------------

-- Lecture des matchs du même club
CREATE POLICY "Matches viewable by same club"
  ON public.matches FOR SELECT
  TO authenticated
  USING (club_id = get_user_club_id());

-- Création de match par les participants
CREATE POLICY "Players can create matches in their club"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (
    club_id = get_user_club_id() AND
    auth.uid() IN (player1_id, player2_id)
  );

-- Validation par l'adversaire ou admin
CREATE POLICY "Opponent or admin can validate match"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    club_id = get_user_club_id() AND
    (
      auth.uid() IN (player1_id, player2_id) OR
      is_club_admin()
    )
  );

-- -----------------------------------------
-- Policies: ELO History
-- -----------------------------------------

-- Lecture de son propre historique
CREATE POLICY "Players can view own elo history"
  ON public.elo_history FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

-- Lecture de l'historique des membres du club (pour classement)
CREATE POLICY "Club members can view elo history"
  ON public.elo_history FOR SELECT
  TO authenticated
  USING (
    player_id IN (
      SELECT id FROM public.players WHERE club_id = get_user_club_id()
    )
  );

-- -----------------------------------------
-- Policies: Forum Threads
-- -----------------------------------------

-- Lecture des threads du même club
CREATE POLICY "Threads viewable by same club"
  ON public.forum_threads FOR SELECT
  TO authenticated
  USING (club_id = get_user_club_id());

-- Création de thread dans son club
CREATE POLICY "Users can create threads in their club"
  ON public.forum_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    club_id = get_user_club_id() AND
    author_id = auth.uid()
  );

-- Modification de ses propres threads
CREATE POLICY "Users can update own threads"
  ON public.forum_threads FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() AND NOT is_locked);

-- Admins peuvent modifier tous les threads de leur club
CREATE POLICY "Admins can manage club threads"
  ON public.forum_threads FOR ALL
  TO authenticated
  USING (club_id = get_user_club_id() AND is_club_admin());

-- Bot peut créer des threads (via service role)
CREATE POLICY "Service role can manage threads"
  ON public.forum_threads FOR ALL
  TO service_role
  WITH CHECK (TRUE);

-- -----------------------------------------
-- Policies: Forum Replies
-- -----------------------------------------

-- Lecture si le thread est accessible
CREATE POLICY "Replies viewable if thread accessible"
  ON public.forum_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_threads 
      WHERE id = thread_id AND club_id = get_user_club_id()
    )
  );

-- Création de réponse
CREATE POLICY "Users can create replies"
  ON public.forum_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.forum_threads 
      WHERE id = thread_id AND club_id = get_user_club_id() AND NOT is_locked
    )
  );

-- Modification de ses propres réponses
CREATE POLICY "Users can update own replies"
  ON public.forum_replies FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Suppression de ses propres réponses
CREATE POLICY "Users can delete own replies"
  ON public.forum_replies FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Service role pour le bot
CREATE POLICY "Service role can manage replies"
  ON public.forum_replies FOR ALL
  TO service_role
  WITH CHECK (TRUE);

-- -----------------------------------------
-- Policies: Forum Reactions
-- -----------------------------------------

-- Lecture des réactions
CREATE POLICY "Reactions viewable by club members"
  ON public.forum_reactions FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.players WHERE club_id = get_user_club_id()
    )
  );

-- Création/suppression de ses propres réactions
CREATE POLICY "Users can manage own reactions"
  ON public.forum_reactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------
-- Policies: Match Proposals
-- -----------------------------------------

-- Lecture des propositions où l'on est impliqué
CREATE POLICY "Players can view own proposals"
  ON public.match_proposals FOR SELECT
  TO authenticated
  USING (
    from_player_id = auth.uid() OR to_player_id = auth.uid()
  );

-- Création de proposition
CREATE POLICY "Players can create proposals"
  ON public.match_proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    club_id = get_user_club_id() AND
    from_player_id = auth.uid()
  );

-- Réponse à une proposition
CREATE POLICY "Recipient can respond to proposals"
  ON public.match_proposals FOR UPDATE
  TO authenticated
  USING (to_player_id = auth.uid());

-- -----------------------------------------
-- Policies: Player Badges
-- -----------------------------------------

-- Lecture des badges des membres du club
CREATE POLICY "Badges viewable by club members"
  ON public.player_badges FOR SELECT
  TO authenticated
  USING (
    player_id IN (
      SELECT id FROM public.players WHERE club_id = get_user_club_id()
    )
  );

-- Attribution via service role uniquement
CREATE POLICY "Service role can manage badges"
  ON public.player_badges FOR ALL
  TO service_role
  WITH CHECK (TRUE);

-- -----------------------------------------
-- Policies: Notifications
-- -----------------------------------------

-- Lecture de ses propres notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Marquer comme lu
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Suppression de ses propres notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role pour créer des notifications
CREATE POLICY "Service role can create notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

-- ============================================
-- REALTIME
-- ============================================

-- Activer le realtime pour les tables importantes
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_proposals;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
