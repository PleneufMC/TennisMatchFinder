import type { Tables, Enums } from './database';

/**
 * Types étendus pour les joueurs
 */

// Type de base depuis la BDD
export type Player = Tables<'players'>;
export type PlayerLevel = Enums<'player_level'>;

// Joueur avec son club
export interface PlayerWithClub extends Player {
  clubs: Tables<'clubs'>;
}

// Profil joueur complet pour l'affichage
export interface PlayerProfile extends Player {
  clubs: Tables<'clubs'>;
  badges?: Tables<'player_badges'>[];
  recentMatches?: Tables<'matches'>[];
}

// Disponibilités du joueur
export interface PlayerAvailability {
  days: Enums<'weekday'>[];
  timeSlots: Enums<'time_slot'>[];
}

// Préférences du joueur
export interface PlayerPreferences {
  gameTypes: Enums<'game_type'>[];
  surfaces: Enums<'court_surface'>[];
  preferredLocations?: string[];
}

// Stats du joueur pour l'affichage
export interface PlayerStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  winStreak: number;
  bestWinStreak: number;
  uniqueOpponents: number;
  currentElo: number;
  bestElo: number;
  lowestElo: number;
  eloTrend: 'up' | 'down' | 'stable';
  recentEloDelta: number;
}

// Joueur pour le classement
export interface RankedPlayer {
  rank: number;
  previousRank: number | null;
  player: Pick<
    Player,
    'id' | 'full_name' | 'avatar_url' | 'current_elo' | 'matches_played' | 'wins' | 'losses'
  >;
  trend: 'up' | 'down' | 'stable' | 'new';
  rankChange: number;
}

// Joueur pour les suggestions (format simplifié)
export interface SuggestedPlayer {
  player: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    current_elo: number;
    self_assessed_level: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
    availability?: unknown;
    preferences?: unknown;
  };
  compatibilityScore: number;
  factors: {
    eloProximity: number;
    noveltyScore: number;
    scheduleMatch: number;
    preferenceMatch: number;
  };
  tags: SuggestionTag[];
  lastPlayed?: string;
  headToHead?: {
    wins: number;
    losses: number;
  };
}

export type SuggestionTag =
  | 'Nouveau défi 🎯'
  | 'Même niveau 🎾'
  | 'Revanche possible 🔥'
  | 'Disponible maintenant ⚡'
  | 'Adversaire fréquent 👥';

// Pour la création/mise à jour de profil
export interface UpdatePlayerInput {
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  selfAssessedLevel?: PlayerLevel;
  availability?: PlayerAvailability;
  preferences?: PlayerPreferences;
}
