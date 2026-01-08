/**
 * Types pour le système de rivalités
 */

// Match simplifié pour l'historique H2H
export interface H2HMatch {
  id: string;
  playedAt: Date;
  score: string;
  winnerId: string;
  player1EloAfter: number;
  player2EloAfter: number;
  player1EloDelta: number;
  player2EloDelta: number;
}

// Stats globales d'une rivalité
export interface RivalryStats {
  totalMatches: number;
  player1Wins: number;
  player2Wins: number;
  player1WinRate: number;
  player2WinRate: number;
  currentStreak: {
    playerId: string;
    count: number;
  } | null;
  longestStreak: {
    playerId: string;
    count: number;
  };
  lastMatch: H2HMatch | null;
  firstMatch: H2HMatch | null;
  avgEloDelta: number;
  closestMatch: H2HMatch | null; // Le match le plus serré
}

// Joueur dans une rivalité
export interface RivalryPlayer {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
}

// Rivalité complète
export interface Rivalry {
  player1: RivalryPlayer;
  player2: RivalryPlayer;
  stats: RivalryStats;
  matches: H2HMatch[];
  rivalryLevel: 'casual' | 'regular' | 'intense' | 'legendary';
  badge?: {
    id: string;
    name: string;
    earnedAt: Date;
  };
}

// Seuils pour les niveaux de rivalité
export const RIVALRY_LEVELS = {
  casual: { min: 1, max: 2, label: 'Connaissance', color: 'gray' },
  regular: { min: 3, max: 4, label: 'Habitué', color: 'blue' },
  intense: { min: 5, max: 9, label: 'Rivalité', color: 'orange' },
  legendary: { min: 10, max: Infinity, label: 'Rivalité Légendaire', color: 'purple' },
} as const;

export type RivalryLevel = keyof typeof RIVALRY_LEVELS;
