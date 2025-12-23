import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { matches, players, eloHistory, forumThreads } from '@/lib/db/schema';
import { eq, and, gte, desc, inArray } from 'drizzle-orm';

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
    const events: ClubEvent[] = [];
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: 24h

    // Récupérer les matchs récents
    const recentMatches = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.clubId, clubId),
          gte(matches.createdAt, sinceDate)
        )
      )
      .orderBy(desc(matches.createdAt));

    if (recentMatches.length > 0) {
      // Récupérer les noms des joueurs
      const playerIds = [...new Set(recentMatches.flatMap(m => [m.player1Id, m.player2Id]))];
      const playersData = await db
        .select()
        .from(players)
        .where(inArray(players.id, playerIds));
      
      const playersMap = new Map(playersData.map(p => [p.id, p.fullName]));

      for (const match of recentMatches) {
        const player1Name = playersMap.get(match.player1Id) || 'Inconnu';
        const player2Name = playersMap.get(match.player2Id) || 'Inconnu';
        const isUpset = match.winnerId === match.player1Id
          ? match.player1EloBefore < match.player2EloBefore - 100
          : match.player2EloBefore < match.player1EloBefore - 100;

        events.push({
          id: match.id,
          clubId,
          type: 'match_recorded',
          data: {
            player1: {
              id: match.player1Id,
              name: player1Name,
              newElo: match.player1EloAfter,
              delta: match.player1EloAfter - match.player1EloBefore,
            },
            player2: {
              id: match.player2Id,
              name: player2Name,
              newElo: match.player2EloAfter,
              delta: match.player2EloAfter - match.player2EloBefore,
            },
            score: match.score,
            wasUpset: isUpset,
            winnerId: match.winnerId,
          },
          timestamp: match.playedAt.toISOString(),
        });
      }
    }

    // Récupérer les nouveaux membres
    const newPlayers = await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.clubId, clubId),
          gte(players.createdAt, sinceDate)
        )
      )
      .orderBy(desc(players.createdAt));

    for (const player of newPlayers) {
      events.push({
        id: `new_member_${player.id}`,
        clubId,
        type: 'new_member',
        data: {
          playerId: player.id,
          playerName: player.fullName,
        },
        timestamp: player.createdAt.toISOString(),
      });
    }

    // Récupérer les milestones ELO
    const milestones = [1500, 1600, 1700, 1800, 1900, 2000];
    const eloMilestones = await db
      .select()
      .from(eloHistory)
      .where(
        and(
          gte(eloHistory.recordedAt, sinceDate),
          inArray(eloHistory.elo, milestones)
        )
      )
      .orderBy(desc(eloHistory.recordedAt));

    if (eloMilestones.length > 0) {
      const milestonePlayerIds = [...new Set(eloMilestones.map(m => m.playerId))];
      const milestonePlayers = await db
        .select()
        .from(players)
        .where(inArray(players.id, milestonePlayerIds));
      
      const playerNameMap = new Map(milestonePlayers.map(p => [p.id, p.fullName]));

      for (const milestone of eloMilestones) {
        events.push({
          id: milestone.id,
          clubId,
          type: 'milestone',
          data: {
            playerId: milestone.playerId,
            playerName: playerNameMap.get(milestone.playerId),
            achievement: `${milestone.elo} ELO`,
          },
          timestamp: milestone.recordedAt.toISOString(),
        });
      }
    }

    // Récupérer les nouveaux threads du forum
    const newThreads = await db
      .select()
      .from(forumThreads)
      .where(
        and(
          eq(forumThreads.clubId, clubId),
          eq(forumThreads.isBot, false),
          gte(forumThreads.createdAt, sinceDate)
        )
      )
      .orderBy(desc(forumThreads.createdAt));

    if (newThreads.length > 0) {
      const authorIds = [...new Set(newThreads.map(t => t.authorId).filter(Boolean))] as string[];
      const authors = authorIds.length > 0
        ? await db.select().from(players).where(inArray(players.id, authorIds))
        : [];
      
      const authorMap = new Map(authors.map(a => [a.id, a.fullName]));

      for (const thread of newThreads) {
        events.push({
          id: thread.id,
          clubId,
          type: 'new_thread',
          data: {
            threadId: thread.id,
            authorName: thread.authorId ? authorMap.get(thread.authorId) || 'Anonyme' : 'Anonyme',
            title: thread.title,
          },
          timestamp: thread.createdAt.toISOString(),
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
