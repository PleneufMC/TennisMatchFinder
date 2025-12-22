import type { Tables, Enums } from './database';
import type { Player } from './player';

/**
 * Types étendus pour les matchs
 */

// Type de base depuis la BDD
export type Match = Tables<'matches'>;
export type GameType = Enums<'game_type'>;
export type CourtSurface = Enums<'court_surface'>;

// Match avec les informations des joueurs
export interface MatchWithPlayers extends Match {
  player1: Pick<Player, 'id' | 'full_name' | 'avatar_url'>;
  player2: Pick<Player, 'id' | 'full_name' | 'avatar_url'>;
  winner: Pick<Player, 'id' | 'full_name' | 'avatar_url'>;
}

// Score d'un set
export interface SetScore {
  player1: number;
  player2: number;
  tiebreak?: {
    player1: number;
    player2: number;
  };
}

// Score complet du match
export interface MatchScore {
  sets: SetScore[];
  winner: 'player1' | 'player2';
}

// Modificateurs ELO appliqués
export interface EloModifiers {
  modifier: number;
  details: EloModifierDetail[];
}

export interface EloModifierDetail {
  type: 'new_opponent' | 'repetition' | 'upset' | 'weekly_diversity';
  value: number;
  description: string;
}

// Données pour la création d'un match
export interface CreateMatchInput {
  opponentId: string;
  score: string;
  winnerId: string;
  playedAt: Date;
  gameType?: GameType;
  surface?: CourtSurface;
  location?: string;
  notes?: string;
}

// Résultat du calcul ELO
export interface EloCalculationResult {
  player1: {
    eloBefore: number;
    eloAfter: number;
    delta: number;
    modifiers: EloModifiers;
  };
  player2: {
    eloBefore: number;
    eloAfter: number;
    delta: number;
    modifiers: EloModifiers;
  };
}

// Historique ELO pour les graphiques
export interface EloHistoryPoint {
  date: string;
  elo: number;
  delta: number;
  reason: Enums<'elo_change_reason'>;
  matchId?: string;
}

// Proposition de match
export type MatchProposal = Tables<'match_proposals'>;
export type ProposalStatus = Enums<'proposal_status'>;

export interface MatchProposalWithPlayers extends MatchProposal {
  fromPlayer: Pick<Player, 'id' | 'full_name' | 'avatar_url' | 'current_elo'>;
  toPlayer: Pick<Player, 'id' | 'full_name' | 'avatar_url' | 'current_elo'>;
}

export interface CreateProposalInput {
  toPlayerId: string;
  proposedDate?: Date;
  proposedTime?: string;
  proposedLocation?: string;
  message?: string;
  gameType?: GameType;
}

// Stats head-to-head entre deux joueurs
export interface HeadToHeadStats {
  totalMatches: number;
  player1Wins: number;
  player2Wins: number;
  lastMatch?: Match;
  recentForm: ('W' | 'L')[]; // 5 derniers résultats du joueur 1
}
