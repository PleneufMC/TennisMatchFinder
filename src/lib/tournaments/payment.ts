import { db } from '@/lib/db';
import { tournamentParticipants, tournaments, players } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface TournamentPaymentParams {
  sessionId: string;
  participantId: string;
  tournamentId: string;
  playerId: string;
  amountPaid: number;
  paymentIntentId: string | null;
}

/**
 * Gère le succès d'un paiement de tournoi via Stripe webhook
 */
export async function handleTournamentPaymentSuccess(params: TournamentPaymentParams) {
  const { sessionId, participantId, tournamentId, playerId, amountPaid, paymentIntentId } = params;

  console.log('Traitement paiement tournoi:', {
    sessionId,
    participantId,
    tournamentId,
    playerId,
    amountPaid,
  });

  try {
    // Vérifier que le participant existe
    const [participant] = await db
      .select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.id, participantId))
      .limit(1);

    if (!participant) {
      console.error('Participant non trouvé:', participantId);
      
      // Essayer de retrouver par session ID
      const [participantBySession] = await db
        .select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.stripeSessionId, sessionId))
        .limit(1);

      if (!participantBySession) {
        console.error('Participant non trouvé par session:', sessionId);
        throw new Error('Participant introuvable');
      }

      // Mettre à jour le participant trouvé par session
      await db
        .update(tournamentParticipants)
        .set({
          paymentStatus: 'paid',
          stripePaymentIntentId: paymentIntentId,
          paidAt: new Date(),
          paidAmount: amountPaid,
        })
        .where(eq(tournamentParticipants.id, participantBySession.id));

      console.log('Paiement tournoi confirmé (via session):', participantBySession.id);
      return { success: true, participantId: participantBySession.id };
    }

    // Vérifier que le paiement n'est pas déjà effectué
    if (participant.paymentStatus === 'paid') {
      console.log('Paiement déjà traité:', participantId);
      return { success: true, participantId, alreadyPaid: true };
    }

    // Mettre à jour le participant
    await db
      .update(tournamentParticipants)
      .set({
        paymentStatus: 'paid',
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
        paidAmount: amountPaid,
      })
      .where(eq(tournamentParticipants.id, participantId));

    console.log('Paiement tournoi confirmé:', participantId);

    // Optionnel: Envoyer une notification au joueur
    // await sendTournamentRegistrationConfirmation(playerId, tournamentId);

    return { success: true, participantId };
  } catch (error) {
    console.error('Erreur traitement paiement tournoi:', error);
    throw error;
  }
}

/**
 * Vérifie si un joueur a payé pour un tournoi
 */
export async function checkTournamentPaymentStatus(
  tournamentId: string,
  playerId: string
): Promise<{ isPaid: boolean; paymentStatus: string | null }> {
  const [participant] = await db
    .select()
    .from(tournamentParticipants)
    .where(
      and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.playerId, playerId)
      )
    )
    .limit(1);

  if (!participant) {
    return { isPaid: false, paymentStatus: null };
  }

  return {
    isPaid: participant.paymentStatus === 'paid',
    paymentStatus: participant.paymentStatus,
  };
}

/**
 * Annule une inscription et demande un remboursement
 */
export async function cancelTournamentRegistration(
  participantId: string,
  reason?: string
): Promise<{ success: boolean; refundNeeded: boolean }> {
  const [participant] = await db
    .select()
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.id, participantId))
    .limit(1);

  if (!participant) {
    throw new Error('Participant introuvable');
  }

  const needsRefund = participant.paymentStatus === 'paid' && (participant.paidAmount || 0) > 0;

  // Mettre à jour le statut
  await db
    .update(tournamentParticipants)
    .set({
      isActive: false,
      withdrawReason: reason || 'Annulation volontaire',
      paymentStatus: needsRefund ? 'refunded' : participant.paymentStatus,
    })
    .where(eq(tournamentParticipants.id, participantId));

  // Note: Le remboursement Stripe doit être fait manuellement ou via un autre processus
  // Si besoin d'automatisation, utiliser stripe.refunds.create()

  return { success: true, refundNeeded: needsRefund };
}
