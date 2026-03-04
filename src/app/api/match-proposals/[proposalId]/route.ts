/**
 * API Route: Match Proposal Actions (respond)
 * 
 * POST - Accepter ou refuser une proposition
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { matchProposals, players, notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const respondSchema = z.object({
  action: z.enum(['accept', 'decline']),
  message: z.string().max(500).optional(),
});

interface RouteParams {
  params: Promise<{ proposalId: string }>;
}

/**
 * POST - Répondre à une proposition (accepter ou refuser)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { proposalId } = await params;
    const playerId = session.user.id;
    const body = await request.json();

    const validation = respondSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { action, message } = validation.data;

    // Récupérer la proposition
    const [proposal] = await db
      .select({
        id: matchProposals.id,
        fromPlayerId: matchProposals.fromPlayerId,
        toPlayerId: matchProposals.toPlayerId,
        status: matchProposals.status,
        proposedDate: matchProposals.proposedDate,
        proposedTime: matchProposals.proposedTime,
      })
      .from(matchProposals)
      .where(eq(matchProposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposition non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien le destinataire qui répond
    if (proposal.toPlayerId !== playerId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas répondre à cette proposition' },
        { status: 403 }
      );
    }

    // Vérifier que la proposition est en attente
    if (proposal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cette proposition a déjà reçu une réponse' },
        { status: 400 }
      );
    }

    // Mettre à jour le statut
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    
    await db
      .update(matchProposals)
      .set({
        status: newStatus,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(matchProposals.id, proposalId));

    // Récupérer les infos des joueurs pour la notification
    const [responder, proposer] = await Promise.all([
      db.select({ fullName: players.fullName })
        .from(players)
        .where(eq(players.id, playerId))
        .limit(1),
      db.select({ fullName: players.fullName })
        .from(players)
        .where(eq(players.id, proposal.fromPlayerId))
        .limit(1),
    ]);

    // Notifier l'expéditeur de la réponse
    const notificationTitle = action === 'accept' 
      ? '✅ Proposition acceptée !'
      : '❌ Proposition déclinée';
    
    const dateText = proposal.proposedDate 
      ? `pour le ${new Date(proposal.proposedDate).toLocaleDateString('fr-FR')}${proposal.proposedTime ? ` à ${proposal.proposedTime}` : ''}`
      : '';

    const notificationMessage = action === 'accept'
      ? `${responder[0]?.fullName} a accepté votre proposition de match${dateText ? ` ${dateText}` : ''}. Contactez-le pour confirmer les détails !`
      : `${responder[0]?.fullName} a décliné votre proposition de match${message ? `. Message: "${message}"` : ''}`;

    await db.insert(notifications).values({
      userId: proposal.fromPlayerId,
      type: 'match_proposal_response',
      title: notificationTitle,
      message: notificationMessage,
      link: action === 'accept' ? `/profil/${playerId}` : '/match-proposals',
      data: {
        proposalId,
        action,
        responderId: playerId,
        responderName: responder[0]?.fullName,
      },
    });

    console.log(`[Match Proposal] ${responder[0]?.fullName} ${action}ed proposal from ${proposer[0]?.fullName}`);

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: action === 'accept' 
        ? 'Proposition acceptée ! Contactez votre adversaire pour confirmer les détails.'
        : 'Proposition déclinée.',
    });
  } catch (error) {
    console.error('Error responding to match proposal:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réponse à la proposition' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Annuler une proposition (uniquement par l'expéditeur)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { proposalId } = await params;
    const playerId = session.user.id;

    // Récupérer la proposition
    const [proposal] = await db
      .select({
        id: matchProposals.id,
        fromPlayerId: matchProposals.fromPlayerId,
        status: matchProposals.status,
      })
      .from(matchProposals)
      .where(eq(matchProposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposition non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien l'expéditeur qui annule
    if (proposal.fromPlayerId !== playerId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas annuler cette proposition' },
        { status: 403 }
      );
    }

    // Vérifier que la proposition est en attente
    if (proposal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cette proposition ne peut plus être annulée' },
        { status: 400 }
      );
    }

    // Supprimer la proposition
    await db.delete(matchProposals).where(eq(matchProposals.id, proposalId));

    return NextResponse.json({
      success: true,
      message: 'Proposition annulée',
    });
  } catch (error) {
    console.error('Error canceling match proposal:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de la proposition' },
      { status: 500 }
    );
  }
}
