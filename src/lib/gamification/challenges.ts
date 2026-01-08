/**
 * Système de Challenges Mensuels
 * 
 * Les challenges sont des objectifs mensuels qui récompensent l'activité.
 * Inspiré par Strava et les systèmes de gamification modernes.
 */

import { db } from '@/lib/db';
import { players, matches } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, ne } from 'drizzle-orm';

// ============================================
// TYPES
// ============================================

export type ChallengeType = 
  | 'matches_count'      // Jouer X matchs
  | 'wins_count'         // Gagner X matchs
  | 'unique_opponents'   // Jouer contre X adversaires différents
  | 'elo_gain'           // Gagner X points ELO
  | 'win_streak';        // Atteindre une série de X victoires

export type ChallengeStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  target: number;
  icon: string;
  reward?: string;
  month: string; // Format: "2026-01"
}

export interface ChallengeProgress {
  challenge: Challenge;
  current: number;
  target: number;
  percentage: number;
  status: ChallengeStatus;
  completedAt?: Date;
}

// ============================================
// CHALLENGES DU MOIS
// ============================================

/**
 * Génère les challenges pour un mois donné
 * Les challenges changent chaque mois pour garder l'engagement
 */
export function getMonthChallenges(month: string): Challenge[] {
  // Extraire le numéro du mois pour varier les challenges
  const monthNum = parseInt(month.split('-')[1] || '1');
  
  // Base de challenges qui tournent
  const allChallenges: Challenge[] = [
    {
      id: `${month}-matches-10`,
      name: 'Joueur Actif',
      description: 'Jouez 10 matchs ce mois-ci',
      type: 'matches_count',
      target: 10,
      icon: 'Target',
      reward: '+50 XP',
      month,
    },
    {
      id: `${month}-matches-20`,
      name: 'Machine à Jouer',
      description: 'Jouez 20 matchs ce mois-ci',
      type: 'matches_count',
      target: 20,
      icon: 'Flame',
      reward: '+100 XP',
      month,
    },
    {
      id: `${month}-wins-5`,
      name: 'Vainqueur',
      description: 'Gagnez 5 matchs ce mois-ci',
      type: 'wins_count',
      target: 5,
      icon: 'Trophy',
      reward: '+30 XP',
      month,
    },
    {
      id: `${month}-wins-10`,
      name: 'Champion du Mois',
      description: 'Gagnez 10 matchs ce mois-ci',
      type: 'wins_count',
      target: 10,
      icon: 'Crown',
      reward: '+75 XP',
      month,
    },
    {
      id: `${month}-opponents-5`,
      name: 'Explorateur',
      description: 'Affrontez 5 adversaires différents ce mois-ci',
      type: 'unique_opponents',
      target: 5,
      icon: 'Users',
      reward: '+40 XP',
      month,
    },
    {
      id: `${month}-opponents-10`,
      name: 'Social Butterfly',
      description: 'Affrontez 10 adversaires différents ce mois-ci',
      type: 'unique_opponents',
      target: 10,
      icon: 'Network',
      reward: '+80 XP',
      month,
    },
    {
      id: `${month}-elo-50`,
      name: 'En Progression',
      description: 'Gagnez 50 points ELO ce mois-ci',
      type: 'elo_gain',
      target: 50,
      icon: 'TrendingUp',
      reward: '+60 XP',
      month,
    },
    {
      id: `${month}-streak-3`,
      name: 'Mini Série',
      description: 'Atteignez une série de 3 victoires consécutives',
      type: 'win_streak',
      target: 3,
      icon: 'Zap',
      reward: '+35 XP',
      month,
    },
  ];

  // Sélectionner 4 challenges basés sur le mois (rotation)
  const selectedIndices = [
    monthNum % 8,
    (monthNum + 2) % 8,
    (monthNum + 4) % 8,
    (monthNum + 6) % 8,
  ];

  return selectedIndices.map((i) => allChallenges[i]).filter((c): c is Challenge => c !== undefined);
}

/**
 * Obtient le mois courant au format "YYYY-MM"
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Obtient les dates de début et fin du mois courant
 */
export function getCurrentMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Calcule le nombre de jours restants dans le mois
 */
export function getDaysLeftInMonth(): number {
  const now = new Date();
  const { end } = getCurrentMonthBounds();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================
// PROGRESSION
// ============================================

/**
 * Calcule la progression d'un joueur sur tous les challenges du mois
 */
export async function getPlayerChallengeProgress(playerId: string): Promise<ChallengeProgress[]> {
  const month = getCurrentMonth();
  const challenges = getMonthChallenges(month);
  const { start, end } = getCurrentMonthBounds();

  // Récupérer les stats du joueur pour ce mois
  const monthStats = await getPlayerMonthStats(playerId, start, end);

  // Calculer la progression pour chaque challenge
  return challenges.map((challenge) => {
    let current = 0;

    switch (challenge.type) {
      case 'matches_count':
        current = monthStats.matchesPlayed;
        break;
      case 'wins_count':
        current = monthStats.wins;
        break;
      case 'unique_opponents':
        current = monthStats.uniqueOpponents;
        break;
      case 'elo_gain':
        current = Math.max(0, monthStats.eloGain);
        break;
      case 'win_streak':
        current = monthStats.bestStreak;
        break;
    }

    const percentage = Math.min(100, Math.round((current / challenge.target) * 100));
    const status: ChallengeStatus = 
      current >= challenge.target ? 'completed' :
      current > 0 ? 'in_progress' : 'not_started';

    return {
      challenge,
      current,
      target: challenge.target,
      percentage,
      status,
    };
  });
}

/**
 * Récupère les statistiques mensuelles d'un joueur
 */
async function getPlayerMonthStats(
  playerId: string,
  start: Date,
  end: Date
): Promise<{
  matchesPlayed: number;
  wins: number;
  uniqueOpponents: number;
  eloGain: number;
  bestStreak: number;
}> {
  // Matchs joués ce mois
  const monthMatches = await db
    .select({
      id: matches.id,
      winnerId: matches.winnerId,
      player1Id: matches.player1Id,
      player2Id: matches.player2Id,
      player1EloAfter: matches.player1EloAfter,
      player2EloAfter: matches.player2EloAfter,
      player1EloBefore: matches.player1EloBefore,
      player2EloBefore: matches.player2EloBefore,
      playedAt: matches.playedAt,
    })
    .from(matches)
    .where(
      and(
        sql`(${matches.player1Id} = ${playerId} OR ${matches.player2Id} = ${playerId})`,
        eq(matches.validated, true),
        gte(matches.playedAt, start),
        lte(matches.playedAt, end)
      )
    )
    .orderBy(matches.playedAt);

  const matchesPlayed = monthMatches.length;
  const wins = monthMatches.filter((m) => m.winnerId === playerId).length;

  // Adversaires uniques
  const opponents = new Set<string>();
  monthMatches.forEach((m) => {
    if (m.player1Id === playerId) {
      opponents.add(m.player2Id);
    } else {
      opponents.add(m.player1Id);
    }
  });
  const uniqueOpponents = opponents.size;

  // Gain ELO
  let eloGain = 0;
  if (monthMatches.length > 0) {
    const firstMatch = monthMatches[0];
    const lastMatch = monthMatches[monthMatches.length - 1];
    
    if (firstMatch && lastMatch) {
      const startElo = firstMatch.player1Id === playerId 
        ? firstMatch.player1EloBefore 
        : firstMatch.player2EloBefore;
      const endElo = lastMatch.player1Id === playerId 
        ? lastMatch.player1EloAfter 
        : lastMatch.player2EloAfter;
      eloGain = endElo - startElo;
    }
  }

  // Meilleure série de victoires du mois
  let bestStreak = 0;
  let currentStreak = 0;
  monthMatches.forEach((m) => {
    if (m.winnerId === playerId) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return {
    matchesPlayed,
    wins,
    uniqueOpponents,
    eloGain,
    bestStreak,
  };
}

// ============================================
// RÉSUMÉ
// ============================================

export interface ChallengeSummary {
  month: string;
  daysLeft: number;
  totalChallenges: number;
  completedChallenges: number;
  inProgressChallenges: number;
  totalXpEarnable: number;
  xpEarned: number;
}

/**
 * Obtient un résumé des challenges du mois
 */
export async function getChallengeSummary(playerId: string): Promise<ChallengeSummary> {
  const progress = await getPlayerChallengeProgress(playerId);
  const month = getCurrentMonth();
  
  const completedChallenges = progress.filter((p) => p.status === 'completed').length;
  const inProgressChallenges = progress.filter((p) => p.status === 'in_progress').length;
  
  // Calculer XP (extrait du reward string)
  const totalXpEarnable = progress.reduce((sum, p) => {
    const xpMatch = p.challenge.reward?.match(/\+(\d+)\s*XP/);
    return sum + (xpMatch && xpMatch[1] ? parseInt(xpMatch[1]) : 0);
  }, 0);
  
  const xpEarned = progress
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => {
      const xpMatch = p.challenge.reward?.match(/\+(\d+)\s*XP/);
      return sum + (xpMatch && xpMatch[1] ? parseInt(xpMatch[1]) : 0);
    }, 0);

  return {
    month,
    daysLeft: getDaysLeftInMonth(),
    totalChallenges: progress.length,
    completedChallenges,
    inProgressChallenges,
    totalXpEarnable,
    xpEarned,
  };
}
