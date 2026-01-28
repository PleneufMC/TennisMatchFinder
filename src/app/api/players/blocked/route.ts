/**
 * API Route: Get Blocked Players
 * 
 * GET - Get list of all players I have blocked
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { playerBlocks, players } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get all blocked players with their info
    const blockedPlayers = await db
      .select({
        blockId: playerBlocks.id,
        blockedAt: playerBlocks.createdAt,
        reason: playerBlocks.reason,
        player: {
          id: players.id,
          fullName: players.fullName,
          avatarUrl: players.avatarUrl,
          currentElo: players.currentElo,
        },
      })
      .from(playerBlocks)
      .innerJoin(players, eq(playerBlocks.blockedId, players.id))
      .where(eq(playerBlocks.blockerId, player.id))
      .orderBy(desc(playerBlocks.createdAt));

    return NextResponse.json({
      blockedPlayers,
      count: blockedPlayers.length,
    });
  } catch (error) {
    console.error('Error fetching blocked players:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
