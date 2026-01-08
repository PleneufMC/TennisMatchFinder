/**
 * Service pour la gestion des rivalités (head-to-head)
 */

import { db } from '@/lib/db';
import { players, matches } from '@/lib/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import {
  type Rivalry,
  type RivalryStats,
  type H2HMatch,
  type RivalryLevel,
  RIVALRY_LEVELS,
} from './types';

/**
 * Récupère la rivalité entre deux joueurs
 */
export async function getRivalry(
  player1Id: string,
  player2Id: string
): Promise<Rivalry | null> {
  // Récupérer les deux joueurs
  const [player1Data, player2Data] = await Promise.all([
    db.select().from(players).where(eq(players.id, player1Id)).limit(1),
    db.select().from(players).where(eq(players.id, player2Id)).limit(1),
  ]);

  if (!player1Data[0] || !player2Data[0]) {
    return null;
  }

  const player1 = player1Data[0];
  const player2 = player2Data[0];

  // Récupérer tous les matchs entre les deux joueurs
  const h2hMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.validated, true),
        or(
          and(eq(matches.player1Id, player1Id), eq(matches.player2Id, player2Id)),
          and(eq(matches.player1Id, player2Id), eq(matches.player2Id, player1Id))
        )
      )
    )
    .orderBy(desc(matches.playedAt));

  if (h2hMatches.length === 0) {
    return null;
  }

  // Transformer les matchs
  const formattedMatches: H2HMatch[] = h2hMatches.map((m) => ({
    id: m.id,
    playedAt: m.playedAt,
    score: m.score,
    winnerId: m.winnerId,
    player1EloAfter: m.player1Id === player1Id ? m.player1EloAfter : m.player2EloAfter,
    player2EloAfter: m.player1Id === player1Id ? m.player2EloAfter : m.player1EloAfter,
    player1EloDelta: m.player1Id === player1Id 
      ? m.player1EloAfter - m.player1EloBefore 
      : m.player2EloAfter - m.player2EloBefore,
    player2EloDelta: m.player1Id === player1Id 
      ? m.player2EloAfter - m.player2EloBefore 
      : m.player1EloAfter - m.player1EloBefore,
  }));

  // Calculer les stats
  const stats = calculateRivalryStats(formattedMatches, player1Id, player2Id);

  // Déterminer le niveau de rivalité
  const rivalryLevel = getRivalryLevel(formattedMatches.length);

  return {
    player1: {
      id: player1.id,
      fullName: player1.fullName,
      avatarUrl: player1.avatarUrl,
      currentElo: player1.currentElo,
    },
    player2: {
      id: player2.id,
      fullName: player2.fullName,
      avatarUrl: player2.avatarUrl,
      currentElo: player2.currentElo,
    },
    stats,
    matches: formattedMatches,
    rivalryLevel,
  };
}

/**
 * Calcule les statistiques d'une rivalité
 */
function calculateRivalryStats(
  matches: H2HMatch[],
  player1Id: string,
  player2Id: string
): RivalryStats {
  const totalMatches = matches.length;
  const player1Wins = matches.filter((m) => m.winnerId === player1Id).length;
  const player2Wins = matches.filter((m) => m.winnerId === player2Id).length;

  // Streak actuelle
  let currentStreak: { playerId: string; count: number } | null = null;
  if (matches.length > 0) {
    const firstMatch = matches[0];
    if (firstMatch) {
      const lastWinner = firstMatch.winnerId;
      let streakCount = 0;
      for (const match of matches) {
        if (match.winnerId === lastWinner) {
          streakCount++;
        } else {
          break;
        }
      }
      currentStreak = { playerId: lastWinner, count: streakCount };
    }
  }

  // Plus longue streak
  let longestStreak = { playerId: player1Id, count: 0 };
  let tempStreak = { playerId: '', count: 0 };
  
  for (const match of [...matches].reverse()) {
    if (match.winnerId === tempStreak.playerId) {
      tempStreak.count++;
    } else {
      if (tempStreak.count > longestStreak.count) {
        longestStreak = { ...tempStreak };
      }
      tempStreak = { playerId: match.winnerId, count: 1 };
    }
  }
  if (tempStreak.count > longestStreak.count) {
    longestStreak = { ...tempStreak };
  }

  // Delta ELO moyen
  const avgEloDelta = matches.length > 0
    ? Math.round(
        matches.reduce((sum, m) => sum + Math.abs(m.player1EloDelta), 0) / matches.length
      )
    : 0;

  // Match le plus serré (delta le plus petit)
  const closestMatch = matches.length > 0
    ? matches.reduce((closest, m) => {
        const currentDelta = Math.abs(m.player1EloDelta);
        const closestDelta = closest ? Math.abs(closest.player1EloDelta) : Infinity;
        return currentDelta < closestDelta ? m : closest;
      }, null as H2HMatch | null)
    : null;

  return {
    totalMatches,
    player1Wins,
    player2Wins,
    player1WinRate: totalMatches > 0 ? Math.round((player1Wins / totalMatches) * 100) : 0,
    player2WinRate: totalMatches > 0 ? Math.round((player2Wins / totalMatches) * 100) : 0,
    currentStreak,
    longestStreak,
    lastMatch: matches[0] || null,
    firstMatch: matches[matches.length - 1] || null,
    avgEloDelta,
    closestMatch,
  };
}

/**
 * Détermine le niveau de rivalité basé sur le nombre de matchs
 */
function getRivalryLevel(matchCount: number): RivalryLevel {
  if (matchCount >= RIVALRY_LEVELS.legendary.min) return 'legendary';
  if (matchCount >= RIVALRY_LEVELS.intense.min) return 'intense';
  if (matchCount >= RIVALRY_LEVELS.regular.min) return 'regular';
  return 'casual';
}

/**
 * Récupère les principales rivalités d'un joueur
 */
export async function getPlayerRivalries(
  playerId: string,
  limit: number = 5
): Promise<Array<{
  opponent: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
  matchCount: number;
  wins: number;
  losses: number;
  lastPlayed: Date;
  rivalryLevel: RivalryLevel;
}>> {
  // Récupérer tous les matchs du joueur groupés par adversaire
  const playerMatches = await db
    .select({
      opponentId: sql<string>`CASE 
        WHEN ${matches.player1Id} = ${playerId} THEN ${matches.player2Id}
        ELSE ${matches.player1Id}
      END`,
      winnerId: matches.winnerId,
      playedAt: matches.playedAt,
    })
    .from(matches)
    .where(
      and(
        eq(matches.validated, true),
        or(eq(matches.player1Id, playerId), eq(matches.player2Id, playerId))
      )
    )
    .orderBy(desc(matches.playedAt));

  // Grouper par adversaire
  const opponentStats = new Map<string, {
    matchCount: number;
    wins: number;
    losses: number;
    lastPlayed: Date;
  }>();

  for (const match of playerMatches) {
    const existing = opponentStats.get(match.opponentId) || {
      matchCount: 0,
      wins: 0,
      losses: 0,
      lastPlayed: match.playedAt,
    };

    existing.matchCount++;
    if (match.winnerId === playerId) {
      existing.wins++;
    } else {
      existing.losses++;
    }

    opponentStats.set(match.opponentId, existing);
  }

  // Trier par nombre de matchs et prendre les top N
  const topOpponents = Array.from(opponentStats.entries())
    .sort((a, b) => b[1].matchCount - a[1].matchCount)
    .slice(0, limit);

  // Récupérer les infos des adversaires
  const result = await Promise.all(
    topOpponents.map(async ([opponentId, stats]) => {
      const opponent = await db
        .select({
          id: players.id,
          fullName: players.fullName,
          avatarUrl: players.avatarUrl,
          currentElo: players.currentElo,
        })
        .from(players)
        .where(eq(players.id, opponentId))
        .limit(1);

      return {
        opponent: opponent[0] || {
          id: opponentId,
          fullName: 'Joueur inconnu',
          avatarUrl: null,
          currentElo: 1200,
        },
        matchCount: stats.matchCount,
        wins: stats.wins,
        losses: stats.losses,
        lastPlayed: stats.lastPlayed,
        rivalryLevel: getRivalryLevel(stats.matchCount),
      };
    })
  );

  return result;
}
