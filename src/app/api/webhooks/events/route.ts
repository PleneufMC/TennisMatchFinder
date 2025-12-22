import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Interface pour les événements du club
 */
interface ClubEvent {
  id: string;
  clubId: string;
  type: 'match_recorded' | 'ranking_change' | 'new_member' | 'milestone' | 'new_thread';
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * GET /api/webhooks/events
 * Récupère les événements récents pour un club (polling par N8N)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const since = searchParams.get('since');
  const clubId = searchParams.get('clubId');

  // Vérifier l'authentification
  const secret = request.headers.get('X-Webhook-Secret');
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!clubId) {
    return NextResponse.json(
      { error: 'clubId is required' },
      { status: 400 }
    );
  }

  try {
    const adminClient = createAdminClient();
    const events: ClubEvent[] = [];
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: 24h

    // Récupérer les matchs récents
    const { data: recentMatches } = await adminClient
      .from('matches')
      .select(`
        id,
        score,
        played_at,
        player1_elo_before,
        player1_elo_after,
        player2_elo_before,
        player2_elo_after,
        winner_id,
        player1:player1_id(id, full_name),
        player2:player2_id(id, full_name)
      `)
      .eq('club_id', clubId)
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });

    if (recentMatches) {
      for (const match of recentMatches) {
        const player1 = match.player1 as { id: string; full_name: string } | null;
        const player2 = match.player2 as { id: string; full_name: string } | null;
        const isUpset = match.winner_id === player1?.id
          ? match.player1_elo_before < match.player2_elo_before - 100
          : match.player2_elo_before < match.player1_elo_before - 100;

        events.push({
          id: match.id,
          clubId,
          type: 'match_recorded',
          data: {
            player1: {
              id: player1?.id,
              name: player1?.full_name,
              newElo: match.player1_elo_after,
              delta: match.player1_elo_after - match.player1_elo_before,
            },
            player2: {
              id: player2?.id,
              name: player2?.full_name,
              newElo: match.player2_elo_after,
              delta: match.player2_elo_after - match.player2_elo_before,
            },
            score: match.score,
            wasUpset: isUpset,
            winnerId: match.winner_id,
          },
          timestamp: match.played_at,
        });
      }
    }

    // Récupérer les nouveaux membres
    const { data: newPlayers } = await adminClient
      .from('players')
      .select('id, full_name, created_at')
      .eq('club_id', clubId)
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });

    if (newPlayers) {
      for (const player of newPlayers) {
        events.push({
          id: `new_member_${player.id}`,
          clubId,
          type: 'new_member',
          data: {
            playerId: player.id,
            playerName: player.full_name,
          },
          timestamp: player.created_at,
        });
      }
    }

    // Récupérer les milestones (joueurs ayant atteint certains seuils)
    const { data: eloMilestones } = await adminClient
      .from('elo_history')
      .select(`
        id,
        player_id,
        elo,
        recorded_at,
        player:player_id(full_name)
      `)
      .gte('recorded_at', sinceDate.toISOString())
      .in('elo', [1500, 1600, 1700, 1800, 1900, 2000])
      .order('recorded_at', { ascending: false });

    if (eloMilestones) {
      for (const milestone of eloMilestones) {
        const playerData = milestone.player as { full_name: string } | null;
        events.push({
          id: milestone.id,
          clubId,
          type: 'milestone',
          data: {
            playerId: milestone.player_id,
            playerName: playerData?.full_name,
            achievement: `${milestone.elo} ELO`,
          },
          timestamp: milestone.recorded_at,
        });
      }
    }

    // Récupérer les nouveaux threads du forum
    const { data: newThreads } = await adminClient
      .from('forum_threads')
      .select(`
        id,
        title,
        created_at,
        author:author_id(full_name)
      `)
      .eq('club_id', clubId)
      .eq('is_bot', false)
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });

    if (newThreads) {
      for (const thread of newThreads) {
        const authorData = thread.author as { full_name: string } | null;
        events.push({
          id: thread.id,
          clubId,
          type: 'new_thread',
          data: {
            threadId: thread.id,
            authorName: authorData?.full_name || 'Anonyme',
            title: thread.title,
          },
          timestamp: thread.created_at,
        });
      }
    }

    // Trier tous les événements par date décroissante
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      events,
      count: events.length,
      since: sinceDate.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS pour CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
    },
  });
}
