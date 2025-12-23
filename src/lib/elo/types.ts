/**
 * Types pour le système ELO
 */

// Configuration ELO
export interface EloConfig {
  kFactorNew: number;         // K pour joueurs < 10 matchs
  kFactorIntermediate: number; // K pour joueurs 10-30 matchs
  kFactorEstablished: number; // K pour joueurs > 30 matchs
  kFactorHigh: number;        // K pour joueurs > 1800 ELO
}

// Configuration par défaut
export const DEFAULT_ELO_CONFIG: EloConfig = {
  kFactorNew: 40,
  kFactorIntermediate: 32,
  kFactorEstablished: 24,
  kFactorHigh: 16,
};

// Constantes ELO
export const ELO_CONSTANTS = {
  DEFAULT_ELO: 1200,
  MIN_ELO: 100,
  MAX_ELO: 3000,
  HIGH_ELO_THRESHOLD: 1800,
  NEW_PLAYER_MATCHES: 10,
  INTERMEDIATE_PLAYER_MATCHES: 30,
  ELO_DIVISOR: 400, // Pour le calcul de l'expectation
} as const;

// Configuration ELO pour les cron jobs et autres services
export const ELO_CONFIG = {
  ...ELO_CONSTANTS,
  INACTIVITY_DAYS_THRESHOLD: 14, // Jours avant décroissance
  INACTIVITY_DECAY_PER_DAY: 5,   // Points perdus par jour d'inactivité
  MAX_INACTIVITY_DECAY: 100,     // Maximum de points perdus pour inactivité
} as const;

// Types de modificateurs
export type ModifierType =
  | 'new_opponent'      // Nouvel adversaire
  | 'repetition'        // Adversaire répété récemment
  | 'upset'             // Victoire contre joueur mieux classé
  | 'weekly_diversity'; // Diversité hebdomadaire

// Détail d'un modificateur
export interface ModifierDetail {
  type: ModifierType;
  value: number;
  description: string;
}

// Résultat du calcul des modificateurs
export interface ModifiersResult {
  totalModifier: number;
  details: ModifierDetail[];
}

// Match simplifié pour le calcul
export interface MatchForCalculation {
  opponentId: string;
  playedAt: Date;
  winnerId: string;
}

// Joueur simplifié pour le calcul
export interface PlayerForCalculation {
  id: string;
  currentElo: number;
  matchesPlayed: number;
}

// Résultat du calcul ELO pour un joueur
export interface EloChangeResult {
  eloBefore: number;
  eloAfter: number;
  delta: number;
  kFactor: number;
  expectedScore: number;
  actualScore: number;
  modifiers: ModifiersResult;
}

// Résultat complet du calcul pour les deux joueurs
export interface MatchEloResult {
  winner: EloChangeResult;
  loser: EloChangeResult;
}
