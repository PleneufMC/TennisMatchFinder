/**
 * API Route: Match Proposals
 * 
 * POST - Créer une nouvelle proposition de match
 * GET - Récupérer les propositions de match (envoyées et reçues)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { matchProposals, players, notifications } from '@/lib/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createProposalSchema = z.object({
  toPlayerId: z.string().uuid('ID joueur invalide'),
  proposedDate: z.string().optional(), // Format: YYYY-MM-DD
  proposedTime: z.string().optional(), // Format: HH:MM
  message: z.string().max(500, 'Message trop long').optional(),
});

/**
 * GET - Récupérer les propositions de match
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const playerId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'sent', 'received', 'all'
    const status = searchParams.get('status'); // 'pending', 'accepted', 'declined', 'expired'

    // Construire la requête
    let whereClause;
    if (type === 'sent') {
      whereClause = eq(matchProposals.fromPlayerId, playerId);
    } else if (type === 'received') {
      whereClause = eq(matchProposals.toPlayerId, playerId);
    } else {
      whereClause = or(
        eq(matchProposals.fromPlayerId, playerId),
        eq(matchProposals.toPlayerId, playerId)
      );
    }

    if (status) {
      whereClause = and(whereClause, eq(matchProposals.status, status as 'pending' | 'accepted' | 'declined' | 'expired'));
    }

    const proposals = await db
      .select({
        id: matchProposals.id,
        fromPlayerId: matchProposals.fromPlayerId,
        toPlayerId: matchProposals.toPlayerId,
        proposedDate: matchProposals.proposedDate,
        proposedTime: matchProposals.proposedTime,
        message: matchProposals.message,
        status: matchProposals.status,
        createdAt: matchProposals.createdAt,
        respondedAt: matchProposals.respondedAt,
      })
      .from(matchProposals)
      .where(whereClause)
      .orderBy(desc(matchProposals.createdAt))
      .limit(50);

    // Enrichir avec les infos des joueurs
    const playerIds = [...new Set(proposals.flatMap(p => [p.fromPlayerId, p.toPlayerId]))];
    
    const playersData = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      })
      .from(players)
      .where(or(...playerIds.map(id => eq(players.id, id))));

    const playersMap = Object.fromEntries(playersData.map(p => [p.id, p]));

    const enrichedProposals = proposals.map(p => ({
      ...p,
      fromPlayer: playersMap[p.fromPlayerId],
      toPlayer: playersMap[p.toPlayerId],
      isFromMe: p.fromPlayerId === playerId,
    }));

    return NextResponse.json({
      proposals: enrichedProposals,
      counts: {
        total: proposals.length,
        pending: proposals.filter(p => p.status === 'pending').length,
        accepted: proposals.filter(p => p.status === 'accepted').length,
      },
    });
  } catch (error) {
    console.error('Error fetching match proposals:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des propositions' },
      { status: 500 }
    );
  }
}

/**
 * POST - Créer une nouvelle proposition de match
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const fromPlayerId = session.user.id;
    const body = await request.json();
    
    const validation = createProposalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { toPlayerId, proposedDate, proposedTime, message } = validation.data;

    // Vérifier qu'on ne se propose pas à soi-même
    if (toPlayerId === fromPlayerId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous proposer un match à vous-même' },
        { status: 400 }
      );
    }

    // Récupérer les infos des deux joueurs
    const [fromPlayer, toPlayer] = await Promise.all([
      db.select({ id: players.id, fullName: players.fullName, clubId: players.clubId })
        .from(players)
        .where(eq(players.id, fromPlayerId))
        .limit(1),
      db.select({ id: players.id, fullName: players.fullName, clubId: players.clubId })
        .from(players)
        .where(eq(players.id, toPlayerId))
        .limit(1),
    ]);

    if (!fromPlayer[0] || !toPlayer[0]) {
      return NextResponse.json(
        { error: 'Joueur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le joueur émetteur a un club
    if (!fromPlayer[0].clubId) {
      return NextResponse.json(
        { error: 'Vous devez appartenir à un club pour proposer un match' },
        { status: 400 }
      );
    }

    // Vérifier s'il y a déjà une proposition en attente
    const existingProposal = await db
      .select({ id: matchProposals.id })
      .from(matchProposals)
      .where(
        and(
          eq(matchProposals.fromPlayerId, fromPlayerId),
          eq(matchProposals.toPlayerId, toPlayerId),
          eq(matchProposals.status, 'pending')
        )
      )
      .limit(1);

    if (existingProposal[0]) {
      return NextResponse.json(
        { error: 'Vous avez déjà une proposition en attente avec ce joueur' },
        { status: 400 }
      );
    }

    // Créer la proposition
    const result = await db
      .insert(matchProposals)
      .values({
        clubId: fromPlayer[0].clubId!, // Non-null assertion car vérifié ci-dessus
        fromPlayerId,
        toPlayerId,
        proposedDate: proposedDate ? new Date(proposedDate) : null,
        proposedTime: proposedTime || null,
        message: message || null,
        status: 'pending',
      })
      .returning();
    
    const proposal = result[0];
    if (!proposal) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la proposition' },
        { status: 500 }
      );
    }

    // Créer une notification pour le destinataire
    const dateText = proposedDate 
      ? `pour le ${new Date(proposedDate).toLocaleDateString('fr-FR')}${proposedTime ? ` à ${proposedTime}` : ''}`
      : '';

    await db.insert(notifications).values({
      userId: toPlayerId,
      type: 'match_proposal',
      title: '🎾 Proposition de match',
      message: `${fromPlayer[0].fullName} vous propose un match${dateText ? ` ${dateText}` : ''}`,
      link: '/match-proposals',
      data: {
        proposalId: proposal.id,
        fromPlayerId,
        fromPlayerName: fromPlayer[0].fullName,
      },
    });

    console.log(`[Match Proposal] ${fromPlayer[0].fullName} proposed match to ${toPlayer[0].fullName}`);

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        toPlayer: {
          id: toPlayer[0].id,
          fullName: toPlayer[0].fullName,
        },
        proposedDate: proposal.proposedDate,
        proposedTime: proposal.proposedTime,
        status: proposal.status,
      },
    });
  } catch (error) {
    console.error('Error creating match proposal:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la proposition' },
      { status: 500 }
    );
  }
}
