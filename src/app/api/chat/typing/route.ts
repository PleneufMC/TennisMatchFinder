/**
 * Typing Indicator API
 * 
 * Broadcast typing status to other users in the chat room
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { broadcastTyping } from '@/lib/pusher/server';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Parse request body
    const { clubId, roomId, isTyping } = await request.json();

    if (!clubId || !roomId || typeof isTyping !== 'boolean') {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Get player data
    const playerData = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        clubId: players.clubId,
      })
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    const player = playerData[0];
    if (!player) {
      return NextResponse.json({ error: 'Profil joueur non trouvé' }, { status: 403 });
    }

    // Verify player belongs to the club
    if (player.clubId !== clubId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Broadcast typing indicator
    await broadcastTyping(clubId, roomId, {
      playerId: player.id,
      playerName: player.fullName,
    }, isTyping);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Typing indicator error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
