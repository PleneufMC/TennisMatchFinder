/**
 * Types pour le système de Tournois à élimination directe
 */

export type TournamentStatus = 'draft' | 'registration' | 'seeding' | 'active' | 'completed' | 'cancelled';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'consolation';
export type TournamentMatchStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'walkover' | 'bye';
export type BracketType = 'main' | 'consolation' | 'losers';

export interface Tournament {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  format: TournamentFormat;
  maxParticipants: number;
  minParticipants: number;
  eloRangeMin: number | null;
  eloRangeMax: number | null;
  seedingMethod: string;
  registrationStart: Date;
  registrationEnd: Date;
  startDate: Date;
  endDate: Date | null;
  setsToWin: number;
  finalSetsToWin: number;
  thirdPlaceMatch: boolean;
  status: TournamentStatus;
  currentRound: number;
  totalRounds: number | null;
  winnerId: string | null;
  runnerUpId: string | null;
  thirdPlaceId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  playerId: string;
  seed: number | null;
  eloAtRegistration: number;
  finalPosition: number | null;
  eliminatedInRound: number | null;
  isActive: boolean;
  withdrawReason: string | null;
  registeredAt: Date;
  // Joined data
  player?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  bracketType: BracketType;
  player1Id: string | null;
  player2Id: string | null;
  player1Seed: number | null;
  player2Seed: number | null;
  winnerId: string | null;
  score: string | null;
  player1Sets: number | null;
  player2Sets: number | null;
  status: TournamentMatchStatus;
  isBye: boolean;
  nextMatchId: string | null;
  mainMatchId: string | null;
  scheduledDate: Date | null;
  playedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  player1?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
  player2?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
}

export interface BracketRound {
  round: number;
  name: string; // "Premier tour", "Quarts de finale", "Demi-finales", "Finale"
  matches: TournamentMatch[];
}

export interface TournamentBracket {
  tournament: Tournament;
  rounds: BracketRound[];
  consolationRounds?: BracketRound[];
}

export interface CreateTournamentParams {
  clubId: string;
  name: string;
  description?: string;
  format?: TournamentFormat;
  maxParticipants: number;
  minParticipants?: number;
  eloRangeMin?: number;
  eloRangeMax?: number;
  seedingMethod?: string;
  registrationStart: Date;
  registrationEnd: Date;
  startDate: Date;
  endDate?: Date;
  setsToWin?: number;
  finalSetsToWin?: number;
  thirdPlaceMatch?: boolean;
  createdBy: string;
}

export interface RegisterTournamentParams {
  tournamentId: string;
  playerId: string;
  currentElo: number;
}

export interface RecordTournamentMatchResult {
  matchId: string;
  winnerId: string;
  score: string;
  player1Sets: number;
  player2Sets: number;
  mainMatchId?: string;
}

// Noms des rounds selon la taille du tournoi
export const ROUND_NAMES: Record<number, Record<number, string>> = {
  4: { 1: 'Demi-finales', 2: 'Finale' },
  8: { 1: 'Quarts de finale', 2: 'Demi-finales', 3: 'Finale' },
  16: { 1: 'Huitièmes de finale', 2: 'Quarts de finale', 3: 'Demi-finales', 4: 'Finale' },
  32: { 1: 'Premier tour', 2: 'Huitièmes de finale', 3: 'Quarts de finale', 4: 'Demi-finales', 5: 'Finale' },
  64: { 1: 'Premier tour', 2: 'Deuxième tour', 3: 'Huitièmes de finale', 4: 'Quarts de finale', 5: 'Demi-finales', 6: 'Finale' },
};

// Calcul du nombre de rounds nécessaires
export function calculateTotalRounds(participantCount: number): number {
  return Math.ceil(Math.log2(participantCount));
}

// Calcul du nombre de BYEs nécessaires
export function calculateByes(participantCount: number, maxParticipants: number): number {
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantCount)));
  return Math.min(nextPowerOf2, maxParticipants) - participantCount;
}

// Obtenir le nom du round
export function getRoundName(round: number, totalRounds: number, bracketSize: number): string {
  const names = ROUND_NAMES[bracketSize];
  if (names && names[round]) {
    return names[round];
  }
  
  // Fallback générique
  const roundsFromEnd = totalRounds - round + 1;
  switch (roundsFromEnd) {
    case 1: return 'Finale';
    case 2: return 'Demi-finales';
    case 3: return 'Quarts de finale';
    case 4: return 'Huitièmes de finale';
    default: return `Tour ${round}`;
  }
}
