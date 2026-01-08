/**
 * Système de Weekly Streak
 * 
 * Un joueur maintient sa streak s'il joue au moins 1 match validé par semaine.
 * La semaine commence le lundi et se termine le dimanche.
 */

import { db } from '@/lib/db';
import { players, matches } from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

// ============================================
// TYPES
// ============================================

export interface WeeklyStreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastActiveWeek: string; // Format: "2026-W02"
  matchesThisWeek: number;
  streakStatus: 'active' | 'at_risk' | 'broken';
  daysUntilReset: number;
}

// ============================================
// HELPERS
// ============================================

/**
 * Obtient le numéro de semaine ISO pour une date
 */
export function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Obtient les dates de début et fin de la semaine courante
 */
export function getCurrentWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = début de semaine
  
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Obtient les dates de début et fin de la semaine précédente
 */
export function getPreviousWeekBounds(): { start: Date; end: Date } {
  const { start: currentStart } = getCurrentWeekBounds();
  
  const start = new Date(currentStart);
  start.setDate(start.getDate() - 7);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Calcule le nombre de jours restants avant la fin de la semaine
 */
export function getDaysUntilWeekEnd(): number {
  const now = new Date();
  const { end } = getCurrentWeekBounds();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Récupère les informations de streak hebdomadaire d'un joueur
 */
export async function getWeeklyStreakInfo(playerId: string): Promise<WeeklyStreakInfo> {
  const player = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player[0]) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastActiveWeek: '',
      matchesThisWeek: 0,
      streakStatus: 'broken',
      daysUntilReset: getDaysUntilWeekEnd(),
    };
  }

  // Compter les matchs cette semaine
  const { start: weekStart, end: weekEnd } = getCurrentWeekBounds();
  
  const matchesThisWeekResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(
      and(
        sql`(${matches.player1Id} = ${playerId} OR ${matches.player2Id} = ${playerId})`,
        eq(matches.validated, true),
        gte(matches.playedAt, weekStart),
        lte(matches.playedAt, weekEnd)
      )
    );

  const matchesThisWeek = matchesThisWeekResult[0]?.count ?? 0;
  
  // Calculer la streak en parcourant les semaines passées
  let currentStreak = 0;
  let checkDate = new Date();
  
  // Si on a déjà joué cette semaine, on commence à compter
  if (matchesThisWeek > 0) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 7); // Semaine précédente
  }
  
  // Parcourir les semaines précédentes
  while (true) {
    const weekBounds = getWeekBoundsForDate(checkDate);
    
    const weekMatches = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(
        and(
          sql`(${matches.player1Id} = ${playerId} OR ${matches.player2Id} = ${playerId})`,
          eq(matches.validated, true),
          gte(matches.playedAt, weekBounds.start),
          lte(matches.playedAt, weekBounds.end)
        )
      );

    if ((weekMatches[0]?.count ?? 0) > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 7);
    } else {
      break;
    }
    
    // Limite à 52 semaines pour éviter les boucles infinies
    if (currentStreak >= 52) break;
  }

  // Déterminer le statut de la streak
  let streakStatus: 'active' | 'at_risk' | 'broken' = 'broken';
  const daysUntilReset = getDaysUntilWeekEnd();
  
  if (matchesThisWeek > 0) {
    streakStatus = 'active';
  } else if (currentStreak > 0 || daysUntilReset > 0) {
    // On a joué la semaine dernière mais pas encore cette semaine
    const { start: prevStart, end: prevEnd } = getPreviousWeekBounds();
    const prevWeekMatches = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(
        and(
          sql`(${matches.player1Id} = ${playerId} OR ${matches.player2Id} = ${playerId})`,
          eq(matches.validated, true),
          gte(matches.playedAt, prevStart),
          lte(matches.playedAt, prevEnd)
        )
      );
    
    if ((prevWeekMatches[0]?.count ?? 0) > 0) {
      streakStatus = 'at_risk';
      // Recalculer la streak depuis la semaine dernière
      currentStreak = 1;
      checkDate = new Date(prevStart);
      checkDate.setDate(checkDate.getDate() - 7);
      
      while (true) {
        const weekBounds = getWeekBoundsForDate(checkDate);
        const weekMatches = await db
          .select({ count: sql<number>`count(*)` })
          .from(matches)
          .where(
            and(
              sql`(${matches.player1Id} = ${playerId} OR ${matches.player2Id} = ${playerId})`,
              eq(matches.validated, true),
              gte(matches.playedAt, weekBounds.start),
              lte(matches.playedAt, weekBounds.end)
            )
          );

        if ((weekMatches[0]?.count ?? 0) > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 7);
        } else {
          break;
        }
        if (currentStreak >= 52) break;
      }
    }
  }

  // TODO: Récupérer le best streak depuis un champ de la DB ou calculer
  const bestStreak = Math.max(currentStreak, player[0].bestWinStreak || 0);

  return {
    currentStreak,
    bestStreak,
    lastActiveWeek: getISOWeek(new Date()),
    matchesThisWeek,
    streakStatus,
    daysUntilReset,
  };
}

/**
 * Helper pour obtenir les bornes d'une semaine à partir d'une date
 */
function getWeekBoundsForDate(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}
