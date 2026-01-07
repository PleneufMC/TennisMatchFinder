/**
 * Pusher Authentication Endpoint
 * 
 * Authentifie les utilisateurs pour les canaux Pusher presence.
 * Vérifie que l'utilisateur appartient bien au club du canal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher/server';
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

    // Get Pusher instance
    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json({ error: 'Pusher non configuré' }, { status: 500 });
    }

    // Parse request body
    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Get player data
    const playerData = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        clubId: players.clubId,
      })
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    const player = playerData[0];
    if (!player) {
      return NextResponse.json({ error: 'Profil joueur non trouvé' }, { status: 403 });
    }

    // For presence channels, verify the user belongs to the club
    if (channelName.startsWith('presence-club-')) {
      // Extract club ID from channel name: presence-club-{clubId}-room-{roomId}
      const match = channelName.match(/^presence-club-([a-f0-9-]+)/);
      const channelClubId = match?.[1];

      if (channelClubId && channelClubId !== player.clubId) {
        return NextResponse.json(
          { error: 'Vous n\'appartenez pas à ce club' },
          { status: 403 }
        );
      }
    }

    // Authenticate for presence channel
    const presenceData = {
      user_id: player.id,
      user_info: {
        name: player.fullName,
        avatar: player.avatarUrl,
      },
    };

    const authResponse = pusher.authorizeChannel(socketId, channelName, presenceData);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Erreur d\'authentification' },
      { status: 500 }
    );
  }
}
