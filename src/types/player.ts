/**
 * Base Player type (from database schema)
 */
export interface Player {
  id: string;
  full_name: string;
  avatar_url: string | null;
  current_elo: number;
  club_id: string | null;
  city: string | null;
  is_admin: boolean;
  is_verified: boolean;
}

/**
 * Shared PlayerData type used across the application
 * Note: clubId can be null for independent players (joueurs sans club)
 */
export interface PlayerData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
  clubId: string | null; // null for independent players
  city: string | null;
  clubName: string; // empty string if no club
  clubSlug: string; // empty string if no club
  isAdmin: boolean;
  isVerified: boolean;
}

/**
 * Types for suggestion engine
 */
export type SuggestionTag = string; // Tags are displayed strings like "Niveau idéal ⚡"

export interface SuggestionPlayerInfo {
  id: string;
  full_name: string;
  avatar_url: string | null;
  current_elo: number;
  self_assessed_level?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  availability?: unknown;
  preferences?: unknown;
}

export interface SuggestedPlayer {
  player: SuggestionPlayerInfo;
  compatibilityScore: number;
  factors: {
    eloProximity: number;
    noveltyScore: number;
    scheduleMatch: number;
    preferenceMatch: number;
  };
  tags: SuggestionTag[];
  lastPlayed?: string;
  h2h?: {
    wins: number;
    losses: number;
    lastPlayed?: string;
  };
  headToHead?: {
    wins: number;
    losses: number;
    lastPlayed?: string;
  };
}
