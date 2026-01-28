/**
 * CRON: Weekly Challenges Evaluation
 * Schedule: Every Monday at 4:00 AM (0 4 * * 1)
 * 
 * This CRON job evaluates the previous week's activity for all players:
 * - Checks if players completed their weekly challenge (1 match OR 2 proposals)
 * - Updates player streaks (current_streak, best_streak)
 * - Awards streak badges (Régulier, Assidu, Légende)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  players, 
  matches, 
  matchProposals, 
  playerWeeklyActivity,
  badges,
  playerBadges,
  notifications
} from '@/lib/db/schema';
import { eq, and, gte, lt, sql, isNull, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Helper to get ISO week number
function getISOWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

// Helper to get date range for a given week
function getWeekDateRange(year: number, week: number): { start: Date; end: Date } {
  // ISO week starts on Monday
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 7);
  return { start: ISOweekStart, end: ISOweekEnd };
}

// Streak badge definitions
const STREAK_BADGES = [
  { name: 'Régulier', streakRequired: 4, tier: 'common' },
  { name: 'Assidu', streakRequired: 26, tier: 'epic' },
  { name: 'Légende', streakRequired: 52, tier: 'legendary' },
] as const;

export async function POST(request: NextRequest) {
  try {
    // Verify CRON authentication
    const isNetlifyScheduled = request.headers.get('x-netlify-event') === 'schedule';
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!isNetlifyScheduled && cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Weekly Challenges] Starting evaluation...');

    // Get the previous week (we're running on Monday, so we evaluate last week)
    const now = new Date();
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const { year: weekYear, week: weekNumber } = getISOWeekNumber(lastWeekDate);
    const { start: weekStart, end: weekEnd } = getWeekDateRange(weekYear, weekNumber);

    console.log(`[Weekly Challenges] Evaluating week ${weekYear}-W${weekNumber.toString().padStart(2, '0')}`);
    console.log(`[Weekly Challenges] Date range: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

    // Get all active players
    const allPlayers = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        currentStreak: players.currentStreak,
        bestStreak: players.bestStreak,
      })
      .from(players)
      .where(eq(players.isActive, true));

    console.log(`[Weekly Challenges] Processing ${allPlayers.length} active players`);

    const results = {
      processed: 0,
      challengesValidated: 0,
      streaksReset: 0,
      badgesAwarded: 0,
      errors: [] as string[],
    };

    // Streak badge names to look up in DB
    const STREAK_BADGE_NAMES = ['Régulier', 'Assidu', 'Légende'];
    
    // Get all streak badges from DB by name
    const streakBadges = await db
      .select()
      .from(badges)
      .where(sql`${badges.name} = ANY(ARRAY['Régulier', 'Assidu', 'Légende'])`);

    for (const player of allPlayers) {
      try {
        // Count matches played this week (as player1 or player2)
        const matchesPlayedResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(matches)
          .where(
            and(
              or(
                eq(matches.player1Id, player.id),
                eq(matches.player2Id, player.id)
              ),
              gte(matches.playedAt, weekStart),
              lt(matches.playedAt, weekEnd),
              eq(matches.validated, true)
            )
          );
        const matchesPlayed = Number(matchesPlayedResult[0]?.count || 0);

        // Count proposals sent this week
        const proposalsSentResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(matchProposals)
          .where(
            and(
              eq(matchProposals.fromPlayerId, player.id),
              gte(matchProposals.createdAt, weekStart),
              lt(matchProposals.createdAt, weekEnd)
            )
          );
        const proposalsSent = Number(proposalsSentResult[0]?.count || 0);

        // Challenge is validated if: 1 match played OR 2 proposals sent
        const challengeValidated = matchesPlayed >= 1 || proposalsSent >= 2;

        // Insert or update weekly activity record
        await db
          .insert(playerWeeklyActivity)
          .values({
            playerId: player.id,
            weekYear,
            weekNumber,
            matchesPlayed,
            proposalsSent,
            challengeValidated,
          })
          .onConflictDoUpdate({
            target: [playerWeeklyActivity.playerId, playerWeeklyActivity.weekYear, playerWeeklyActivity.weekNumber],
            set: {
              matchesPlayed,
              proposalsSent,
              challengeValidated,
              updatedAt: new Date(),
            },
          });

        // Update player streak
        let newStreak: number;
        let newBestStreak = player.bestStreak;

        if (challengeValidated) {
          newStreak = player.currentStreak + 1;
          if (newStreak > newBestStreak) {
            newBestStreak = newStreak;
          }
          results.challengesValidated++;

          // Check for badge awards
          for (const badge of STREAK_BADGES) {
            if (newStreak === badge.streakRequired) {
              // Find the badge in DB
              const dbBadge = streakBadges.find(b => b.name === badge.name);
              if (dbBadge) {
                // Check if player already has this badge
                const existingBadge = await db
                  .select()
                  .from(playerBadges)
                  .where(
                    and(
                      eq(playerBadges.playerId, player.id),
                      eq(playerBadges.badgeId, dbBadge.id)
                    )
                  );

                if (existingBadge.length === 0) {
                  // Award the badge
                  await db.insert(playerBadges).values({
                    playerId: player.id,
                    badgeId: dbBadge.id,
                  });

                  // Send notification
                  await db.insert(notifications).values({
                    userId: player.id,
                    type: 'badge_earned',
                    title: `🏆 Badge "${dbBadge.name}" débloqué !`,
                    message: `Félicitations ! Tu as atteint ${badge.streakRequired} semaines consécutives d'activité !`,
                    data: { badgeId: dbBadge.id, badgeName: dbBadge.name, streak: newStreak },
                  });

                  results.badgesAwarded++;
                  console.log(`[Weekly Challenges] Badge "${badge.name}" awarded to ${player.fullName}`);
                }
              }
            }
          }
        } else {
          // Reset streak
          if (player.currentStreak > 0) {
            results.streaksReset++;
          }
          newStreak = 0;
        }

        // Update player
        await db
          .update(players)
          .set({
            currentStreak: newStreak,
            bestStreak: newBestStreak,
            lastStreakUpdate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(players.id, player.id));

        results.processed++;
      } catch (playerError) {
        const errorMessage = playerError instanceof Error ? playerError.message : 'Unknown error';
        results.errors.push(`Player ${player.id}: ${errorMessage}`);
        console.error(`[Weekly Challenges] Error processing player ${player.id}:`, playerError);
      }
    }

    console.log(`[Weekly Challenges] Completed. Processed: ${results.processed}, Validated: ${results.challengesValidated}, Reset: ${results.streaksReset}, Badges: ${results.badgesAwarded}`);

    return NextResponse.json({
      success: true,
      message: `Weekly challenges evaluated for week ${weekYear}-W${weekNumber.toString().padStart(2, '0')}`,
      stats: results,
    });
  } catch (error) {
    console.error('[Weekly Challenges] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to process weekly challenges', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking current week status
export async function GET(request: NextRequest) {
  try {
    const { year: weekYear, week: weekNumber } = getISOWeekNumber(new Date());
    
    // Get activity summary for current week
    const activitySummary = await db
      .select({
        totalPlayers: sql<number>`count(distinct ${playerWeeklyActivity.playerId})`,
        validated: sql<number>`count(*) filter (where ${playerWeeklyActivity.challengeValidated} = true)`,
      })
      .from(playerWeeklyActivity)
      .where(
        and(
          eq(playerWeeklyActivity.weekYear, weekYear),
          eq(playerWeeklyActivity.weekNumber, weekNumber)
        )
      );

    // Get streak leaderboard (top 10)
    const leaderboard = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        currentStreak: players.currentStreak,
        bestStreak: players.bestStreak,
      })
      .from(players)
      .where(eq(players.isActive, true))
      .orderBy(sql`${players.currentStreak} desc`)
      .limit(10);

    return NextResponse.json({
      currentWeek: `${weekYear}-W${weekNumber.toString().padStart(2, '0')}`,
      activity: activitySummary[0],
      leaderboard,
    });
  } catch (error) {
    console.error('[Weekly Challenges] Error fetching status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly challenges status' },
      { status: 500 }
    );
  }
}
