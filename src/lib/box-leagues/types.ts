/**
 * Types pour le système Box Leagues
 */

export type BoxLeagueStatus = 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
export type BoxLeagueMatchStatus = 'scheduled' | 'completed' | 'forfeit' | 'cancelled';

export interface BoxLeague {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  minPlayers: number;
  maxPlayers: number;
  eloRangeMin: number | null;
  eloRangeMax: number | null;
  division: number;
  matchesPerPlayer: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  pointsForfeit: number;
  promotionSpots: number;
  relegationSpots: number;
  status: BoxLeagueStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoxLeagueParticipant {
  id: string;
  leagueId: string;
  playerId: string;
  eloAtStart: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  points: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  finalRank: number | null;
  isPromoted: boolean;
  isRelegated: boolean;
  isActive: boolean;
  withdrawReason: string | null;
  registeredAt: Date;
  updatedAt: Date;
  // Joined data
  player?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
}

export interface BoxLeagueMatch {
  id: string;
  leagueId: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  score: string | null;
  player1Sets: number | null;
  player2Sets: number | null;
  player1Games: number | null;
  player2Games: number | null;
  status: BoxLeagueMatchStatus;
  forfeitBy: string | null;
  mainMatchId: string | null;
  scheduledDate: Date | null;
  playedAt: Date | null;
  deadline: Date | null;
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

export interface BoxLeagueStanding {
  rank: number;
  participant: BoxLeagueParticipant;
  trend: 'up' | 'down' | 'stable'; // Tendance par rapport au classement précédent
}

export interface CreateBoxLeagueParams {
  clubId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  minPlayers?: number;
  maxPlayers?: number;
  eloRangeMin?: number;
  eloRangeMax?: number;
  division?: number;
  matchesPerPlayer?: number;
  promotionSpots?: number;
  relegationSpots?: number;
  createdBy: string;
}

export interface RegisterParticipantParams {
  leagueId: string;
  playerId: string;
  currentElo: number;
}

export interface RecordMatchResultParams {
  matchId: string;
  winnerId: string;
  score: string;
  player1Sets: number;
  player2Sets: number;
  player1Games: number;
  player2Games: number;
  mainMatchId?: string;
}
