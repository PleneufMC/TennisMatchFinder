/**
 * API Route: Welcome Sequence CRON
 * Sends automated welcome emails to help users activate
 * 
 * Email J+1: "Ton premier match" - Sent to users who registered 24-48h ago without any match
 * 
 * Schedule: Daily at 10:00 AM
 * Sprint Février 2026 - Activation Priority
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players, matches, clubs } from '@/lib/db/schema';
import { eq, and, or, gte, lte, isNull, sql } from 'drizzle-orm';
import { sendWelcomeDay1Email } from '@/lib/email/welcome-emails';

export async function POST(request: NextRequest) {
  try {
    // Verify CRON authentication
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Welcome-Sequence] CRON_SECRET not configured');
      return NextResponse.json({ error: 'CRON not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Welcome-Sequence] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Welcome-Sequence] Starting welcome email sequence...');

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Find players who registered 24-48h ago and have no matches
    // Using a subquery to check for matches
    const newPlayersWithoutMatch = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        clubId: players.clubId,
        createdAt: players.createdAt,
      })
      .from(players)
      .leftJoin(
        db
          .select({ playerId: sql<string>`${matches.player1Id}` })
          .from(matches)
          .where(
            or(
              sql`${matches.player1Id} = ${players.id}`,
              sql`${matches.player2Id} = ${players.id}`
            )
          )
          .as('player_matches'),
        sql`true`
      )
      .where(
        and(
          gte(players.createdAt, twoDaysAgo),
          lte(players.createdAt, oneDayAgo),
          eq(players.matchesPlayed, 0), // No matches played
          eq(players.isActive, true)
        )
      );

    console.log(`[Welcome-Sequence] Found ${newPlayersWithoutMatch.length} new players without matches`);

    let emailsSent = 0;
    const errors: string[] = [];

    for (const player of newPlayersWithoutMatch) {
      try {
        // Get player's email from users table
        const [user] = await db
          .select({ email: sql<string>`email` })
          .from(sql`users`)
          .where(sql`id = ${player.id}`)
          .limit(1);

        if (!user?.email) {
          console.warn(`[Welcome-Sequence] No email found for player ${player.id}`);
          continue;
        }

        // Get club name if player has a club
        let clubName: string | undefined;
        if (player.clubId) {
          const [club] = await db
            .select({ name: clubs.name })
            .from(clubs)
            .where(eq(clubs.id, player.clubId))
            .limit(1);
          clubName = club?.name;
        }

        // Send the J+1 welcome email
        const success = await sendWelcomeDay1Email({
          to: user.email,
          firstName: player.fullName.split(' ')[0] || player.fullName,
          clubName,
        });

        if (success) {
          emailsSent++;
          console.log(`[Welcome-Sequence] Sent J+1 email to ${user.email}`);
        } else {
          errors.push(`Failed to send email to ${user.email}`);
        }
      } catch (error) {
        const errorMsg = `Error processing player ${player.id}: ${error instanceof Error ? error.message : 'Unknown'}`;
        console.error(`[Welcome-Sequence] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      stats: {
        playersFound: newPlayersWithoutMatch.length,
        emailsSent,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit error reporting
    };

    console.log('[Welcome-Sequence] Completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Welcome-Sequence] Critical error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Preview endpoint (for testing)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Preview eligible players
    const eligiblePlayers = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        createdAt: players.createdAt,
        matchesPlayed: players.matchesPlayed,
      })
      .from(players)
      .where(
        and(
          gte(players.createdAt, twoDaysAgo),
          lte(players.createdAt, oneDayAgo),
          eq(players.matchesPlayed, 0),
          eq(players.isActive, true)
        )
      )
      .limit(20);

    return NextResponse.json({
      status: 'preview',
      timestamp: now.toISOString(),
      timeRange: {
        from: twoDaysAgo.toISOString(),
        to: oneDayAgo.toISOString(),
      },
      preview: {
        eligibleCount: eligiblePlayers.length,
        players: eligiblePlayers.map(p => ({
          id: p.id,
          fullName: p.fullName,
          createdAt: p.createdAt,
          matchesPlayed: p.matchesPlayed,
        })),
      },
    });
  } catch (error) {
    console.error('[Welcome-Sequence] Preview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
