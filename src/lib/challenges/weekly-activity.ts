/**
 * Weekly Activity Tracking Service
 * 
 * Tracks player activity for weekly challenges:
 * - Matches played
 * - Proposals sent
 * 
 * Challenge validation: 1 match played OR 2 proposals sent
 */

import { db } from '@/lib/db';
import { playerWeeklyActivity } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Helper to get ISO week number
export function getISOWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * Increment match count for a player's weekly activity
 */
export async function incrementWeeklyMatchCount(playerId: string): Promise<void> {
  const { year: weekYear, week: weekNumber } = getISOWeekNumber(new Date());
  
  try {
    // Try to insert or update
    await db
      .insert(playerWeeklyActivity)
      .values({
        playerId,
        weekYear,
        weekNumber,
        matchesPlayed: 1,
        proposalsSent: 0,
        challengeValidated: true, // 1 match = challenge validated
      })
      .onConflictDoUpdate({
        target: [playerWeeklyActivity.playerId, playerWeeklyActivity.weekYear, playerWeeklyActivity.weekNumber],
        set: {
          matchesPlayed: sql`${playerWeeklyActivity.matchesPlayed} + 1`,
          challengeValidated: true, // Any match validates the challenge
          updatedAt: new Date(),
        },
      });
    
    console.log(`[Weekly Activity] Match count incremented for player ${playerId}`);
  } catch (error) {
    console.error(`[Weekly Activity] Error incrementing match count for player ${playerId}:`, error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Increment proposal count for a player's weekly activity
 */
export async function incrementWeeklyProposalCount(playerId: string): Promise<void> {
  const { year: weekYear, week: weekNumber } = getISOWeekNumber(new Date());
  
  try {
    // Try to insert or update
    await db
      .insert(playerWeeklyActivity)
      .values({
        playerId,
        weekYear,
        weekNumber,
        matchesPlayed: 0,
        proposalsSent: 1,
        challengeValidated: false, // 1 proposal = not yet validated (need 2)
      })
      .onConflictDoUpdate({
        target: [playerWeeklyActivity.playerId, playerWeeklyActivity.weekYear, playerWeeklyActivity.weekNumber],
        set: {
          proposalsSent: sql`${playerWeeklyActivity.proposalsSent} + 1`,
          // Validate if: already has matches, or now has 2+ proposals
          challengeValidated: sql`
            CASE 
              WHEN ${playerWeeklyActivity.matchesPlayed} >= 1 THEN true
              WHEN ${playerWeeklyActivity.proposalsSent} + 1 >= 2 THEN true
              ELSE ${playerWeeklyActivity.challengeValidated}
            END
          `,
          updatedAt: new Date(),
        },
      });
    
    console.log(`[Weekly Activity] Proposal count incremented for player ${playerId}`);
  } catch (error) {
    console.error(`[Weekly Activity] Error incrementing proposal count for player ${playerId}:`, error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Get current week activity for a player
 */
export async function getPlayerWeeklyActivity(playerId: string): Promise<{
  weekYear: number;
  weekNumber: number;
  matchesPlayed: number;
  proposalsSent: number;
  challengeValidated: boolean;
} | null> {
  const { year: weekYear, week: weekNumber } = getISOWeekNumber(new Date());
  
  const activity = await db
    .select()
    .from(playerWeeklyActivity)
    .where(
      and(
        eq(playerWeeklyActivity.playerId, playerId),
        eq(playerWeeklyActivity.weekYear, weekYear),
        eq(playerWeeklyActivity.weekNumber, weekNumber)
      )
    );
  
  const record = activity[0];
  if (!record) {
    return {
      weekYear,
      weekNumber,
      matchesPlayed: 0,
      proposalsSent: 0,
      challengeValidated: false,
    };
  }
  
  return {
    weekYear: record.weekYear,
    weekNumber: record.weekNumber,
    matchesPlayed: record.matchesPlayed,
    proposalsSent: record.proposalsSent,
    challengeValidated: record.challengeValidated,
  };
}

/**
 * Get player's streak information
 */
export async function getPlayerStreakInfo(playerId: string): Promise<{
  currentStreak: number;
  bestStreak: number;
  currentWeekValidated: boolean;
  nextBadge: { name: string; streakRequired: number; progress: number } | null;
}> {
  const { players } = await import('@/lib/db/schema');
  
  const player = await db
    .select({
      currentStreak: players.currentStreak,
      bestStreak: players.bestStreak,
    })
    .from(players)
    .where(eq(players.id, playerId));
  
  const playerRecord = player[0];
  if (!playerRecord) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      currentWeekValidated: false,
      nextBadge: null,
    };
  }
  
  const weeklyActivity = await getPlayerWeeklyActivity(playerId);
  const currentStreak = playerRecord.currentStreak;
  
  // Determine next badge
  const badges = [
    { name: 'Régulier', streakRequired: 4 },
    { name: 'Assidu', streakRequired: 26 },
    { name: 'Légende', streakRequired: 52 },
  ];
  
  let nextBadge: { name: string; streakRequired: number; progress: number } | null = null;
  for (const badge of badges) {
    if (currentStreak < badge.streakRequired) {
      nextBadge = {
        name: badge.name,
        streakRequired: badge.streakRequired,
        progress: Math.round((currentStreak / badge.streakRequired) * 100),
      };
      break;
    }
  }
  
  return {
    currentStreak,
    bestStreak: playerRecord.bestStreak,
    currentWeekValidated: weeklyActivity?.challengeValidated || false,
    nextBadge,
  };
}
