/**
 * API Route: Block/Unblock Player
 * 
 * POST - Block a player
 * DELETE - Unblock a player
 * GET - Check if player is blocked
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { playerBlocks, players } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// GET: Check if player is blocked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // BUG-007 FIX: Next.js 15 requires awaiting params
    const { playerId } = await params;

    // Check if blocked
    const [block] = await db
      .select()
      .from(playerBlocks)
      .where(
        and(
          eq(playerBlocks.blockerId, player.id),
          eq(playerBlocks.blockedId, playerId)
        )
      );

    return NextResponse.json({
      isBlocked: !!block,
      blockedAt: block?.createdAt || null,
    });
  } catch (error) {
    console.error('Error checking block status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}

// POST: Block a player
const blockSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // BUG-007 FIX: Next.js 15 requires awaiting params
    const { playerId } = await params;

    // Can't block yourself
    if (playerId === player.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous bloquer vous-même' },
        { status: 400 }
      );
    }

    // Check if target player exists
    const [targetPlayer] = await db
      .select({ id: players.id, fullName: players.fullName })
      .from(players)
      .where(eq(players.id, playerId));

    if (!targetPlayer) {
      return NextResponse.json(
        { error: 'Joueur non trouvé' },
        { status: 404 }
      );
    }

    // Parse optional reason
    const body = await request.json().catch(() => ({}));
    const validation = blockSchema.safeParse(body);
    const reason = validation.success ? validation.data.reason : undefined;

    // Check if already blocked
    const [existingBlock] = await db
      .select()
      .from(playerBlocks)
      .where(
        and(
          eq(playerBlocks.blockerId, player.id),
          eq(playerBlocks.blockedId, playerId)
        )
      );

    if (existingBlock) {
      return NextResponse.json({
        success: true,
        message: 'Ce joueur est déjà bloqué',
        alreadyBlocked: true,
      });
    }

    // Create block
    await db.insert(playerBlocks).values({
      blockerId: player.id,
      blockedId: playerId,
      reason,
    });

    console.log(`[Block] ${player.fullName} blocked ${targetPlayer.fullName}`);

    return NextResponse.json({
      success: true,
      message: `${targetPlayer.fullName} a été bloqué`,
    });
  } catch (error) {
    console.error('Error blocking player:', error);
    return NextResponse.json(
      { error: 'Erreur lors du blocage' },
      { status: 500 }
    );
  }
}

// DELETE: Unblock a player
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // BUG-007 FIX: Next.js 15 requires awaiting params
    const { playerId } = await params;

    // Get target player name for message
    const [targetPlayer] = await db
      .select({ fullName: players.fullName })
      .from(players)
      .where(eq(players.id, playerId));

    // Delete block
    const result = await db
      .delete(playerBlocks)
      .where(
        and(
          eq(playerBlocks.blockerId, player.id),
          eq(playerBlocks.blockedId, playerId)
        )
      );

    return NextResponse.json({
      success: true,
      message: targetPlayer 
        ? `${targetPlayer.fullName} a été débloqué`
        : 'Joueur débloqué',
    });
  } catch (error) {
    console.error('Error unblocking player:', error);
    return NextResponse.json(
      { error: 'Erreur lors du déblocage' },
      { status: 500 }
    );
  }
}
