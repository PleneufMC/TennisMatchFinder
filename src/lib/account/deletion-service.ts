/**
 * Account Deletion Service - RGPD Compliance
 * 
 * Gère la suppression de compte avec :
 * - Délai de grâce de 7 jours
 * - Anonymisation des données (matchs, scores conservés)
 * - Tokens de confirmation/annulation
 * - Notification par email
 */

import { db } from '@/lib/db';
import {
  accountDeletionRequests,
  users,
  players,
  matches,
  eloHistory,
  notifications,
  playerBadges,
  matchProposals,
  forumThreads,
  forumReplies,
  chatMessages,
  chatRoomMembers,
  pushSubscriptions,
  boxLeagueParticipants,
  boxLeagueMatches,
  tournamentParticipants,
  tournamentMatches,
  matchRatings,
  passkeys,
  accounts,
  sessions,
} from '@/lib/db/schema';
import { eq, and, or, lt, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const GRACE_PERIOD_DAYS = 7;

export interface DeletionRequestResult {
  success: boolean;
  requestId?: string;
  scheduledDeletionAt?: Date;
  confirmationToken?: string;
  cancellationToken?: string;
  error?: string;
}

export interface AnonymizedData {
  matchCount: number;
  eloAtDeletion: number;
  memberSince: string;
  clubId: string | null;
  badgeCount: number;
  forumPostCount: number;
  deletedAt: string;
}

/**
 * Crée une demande de suppression de compte
 */
export async function createDeletionRequest(
  userId: string,
  reason?: string,
  reasonCategory?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<DeletionRequestResult> {
  try {
    // Vérifier si une demande est déjà en cours
    const existingRequest = await db
      .select()
      .from(accountDeletionRequests)
      .where(
        and(
          eq(accountDeletionRequests.userId, userId),
          eq(accountDeletionRequests.status, 'pending')
        )
      )
      .limit(1);

    if (existingRequest[0]) {
      return {
        success: false,
        error: 'Une demande de suppression est déjà en cours',
        requestId: existingRequest[0].id,
        scheduledDeletionAt: existingRequest[0].scheduledDeletionAt,
      };
    }

    // Générer les tokens
    const confirmationToken = nanoid(32);
    const cancellationToken = nanoid(32);

    // Calculer la date de suppression (7 jours)
    const scheduledDeletionAt = new Date();
    scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + GRACE_PERIOD_DAYS);

    // Créer la demande
    const [request] = await db
      .insert(accountDeletionRequests)
      .values({
        userId,
        reason,
        reasonCategory,
        confirmationToken,
        cancellationToken,
        scheduledDeletionAt,
        ipAddress,
        userAgent,
      })
      .returning();

    if (!request) {
      return { success: false, error: 'Erreur lors de la création de la demande' };
    }

    return {
      success: true,
      requestId: request.id,
      scheduledDeletionAt: request.scheduledDeletionAt,
      confirmationToken,
      cancellationToken,
    };
  } catch (error) {
    console.error('Error creating deletion request:', error);
    return { success: false, error: 'Erreur interne' };
  }
}

/**
 * Annule une demande de suppression
 */
export async function cancelDeletionRequest(
  userId: string,
  cancellationToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Trouver la demande en cours
    const whereClause = cancellationToken
      ? and(
          eq(accountDeletionRequests.cancellationToken, cancellationToken),
          eq(accountDeletionRequests.status, 'pending')
        )
      : and(
          eq(accountDeletionRequests.userId, userId),
          eq(accountDeletionRequests.status, 'pending')
        );

    const [request] = await db
      .select()
      .from(accountDeletionRequests)
      .where(whereClause)
      .limit(1);

    if (!request) {
      return { success: false, error: 'Aucune demande de suppression en cours' };
    }

    // Annuler la demande
    await db
      .update(accountDeletionRequests)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
      })
      .where(eq(accountDeletionRequests.id, request.id));

    return { success: true };
  } catch (error) {
    console.error('Error cancelling deletion request:', error);
    return { success: false, error: 'Erreur interne' };
  }
}

/**
 * Confirme une demande de suppression (déclenche immédiatement)
 */
export async function confirmDeletionRequest(
  confirmationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [request] = await db
      .select()
      .from(accountDeletionRequests)
      .where(
        and(
          eq(accountDeletionRequests.confirmationToken, confirmationToken),
          eq(accountDeletionRequests.status, 'pending')
        )
      )
      .limit(1);

    if (!request) {
      return { success: false, error: 'Token invalide ou demande déjà traitée' };
    }

    // Mettre à jour le statut
    await db
      .update(accountDeletionRequests)
      .set({
        status: 'confirmed',
        confirmedAt: new Date(),
      })
      .where(eq(accountDeletionRequests.id, request.id));

    // Exécuter la suppression immédiatement
    const result = await executeAccountDeletion(request.userId, request.id);
    
    return result;
  } catch (error) {
    console.error('Error confirming deletion:', error);
    return { success: false, error: 'Erreur interne' };
  }
}

/**
 * Récupère les données à anonymiser avant suppression
 */
async function collectAnonymizedData(userId: string): Promise<AnonymizedData | null> {
  try {
    // Récupérer le joueur
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, userId))
      .limit(1);

    if (!player) {
      return null;
    }

    // Compter les matchs
    const matchCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(matches)
      .where(
        or(
          eq(matches.player1Id, userId),
          eq(matches.player2Id, userId)
        )
      );

    // Compter les badges
    const badgeCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(playerBadges)
      .where(eq(playerBadges.playerId, userId));

    // Compter les posts forum
    const postCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(forumThreads)
      .where(eq(forumThreads.authorId, userId));

    const replyCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(forumReplies)
      .where(eq(forumReplies.authorId, userId));

    return {
      matchCount: matchCountResult[0]?.count || 0,
      eloAtDeletion: player.currentElo,
      memberSince: player.createdAt.toISOString(),
      clubId: player.clubId,
      badgeCount: badgeCountResult[0]?.count || 0,
      forumPostCount: (postCountResult[0]?.count || 0) + (replyCountResult[0]?.count || 0),
      deletedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error collecting anonymized data:', error);
    return null;
  }
}

/**
 * Anonymise les données liées au joueur (conserve les matchs mais anonymise)
 */
async function anonymizePlayerData(userId: string): Promise<void> {
  const anonymousName = 'Joueur supprimé';
  const now = new Date();

  // Anonymiser les threads forum (conserver le contenu, anonymiser l'auteur)
  await db
    .update(forumThreads)
    .set({ authorId: null })
    .where(eq(forumThreads.authorId, userId));

  // Anonymiser les réponses forum
  await db
    .update(forumReplies)
    .set({ authorId: null })
    .where(eq(forumReplies.authorId, userId));

  // Anonymiser les messages chat (conserver le contenu, anonymiser l'expéditeur)
  await db
    .update(chatMessages)
    .set({ senderId: null })
    .where(eq(chatMessages.senderId, userId));

  // Les matchs sont conservés avec les IDs mais le joueur sera supprimé
  // Les références deviendront NULL grâce à onDelete: 'set null'

  console.log(`Anonymized data for user ${userId}`);
}

/**
 * Supprime définitivement un compte
 */
async function executeAccountDeletion(
  userId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Collecter les données anonymisées avant suppression
    const anonymizedData = await collectAnonymizedData(userId);

    // Anonymiser les données qui doivent être conservées
    await anonymizePlayerData(userId);

    // Supprimer les données personnelles (cascade depuis users)
    // L'ordre est important pour respecter les contraintes FK

    // 1. Supprimer les participations aux compétitions
    await db.delete(boxLeagueParticipants).where(eq(boxLeagueParticipants.playerId, userId));
    await db.delete(tournamentParticipants).where(eq(tournamentParticipants.playerId, userId));

    // 2. Supprimer les notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // 3. Supprimer les badges du joueur
    await db.delete(playerBadges).where(eq(playerBadges.playerId, userId));

    // 4. Supprimer l'historique ELO
    await db.delete(eloHistory).where(eq(eloHistory.playerId, userId));

    // 5. Supprimer les propositions de match
    await db.delete(matchProposals).where(
      or(
        eq(matchProposals.fromPlayerId, userId),
        eq(matchProposals.toPlayerId, userId)
      )
    );

    // 6. Supprimer les évaluations de match
    await db.delete(matchRatings).where(
      or(
        eq(matchRatings.raterId, userId),
        eq(matchRatings.ratedPlayerId, userId)
      )
    );

    // 7. Supprimer les membres des salons de chat
    await db.delete(chatRoomMembers).where(eq(chatRoomMembers.playerId, userId));

    // 8. Supprimer les abonnements push
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

    // 9. Supprimer les passkeys
    await db.delete(passkeys).where(eq(passkeys.userId, userId));

    // 10. Supprimer les sessions et comptes OAuth
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(accounts).where(eq(accounts.userId, userId));

    // 11. Supprimer le joueur (players)
    await db.delete(players).where(eq(players.id, userId));

    // 12. Supprimer l'utilisateur (users) - cascade devrait gérer le reste
    await db.delete(users).where(eq(users.id, userId));

    // Mettre à jour la demande de suppression
    await db
      .update(accountDeletionRequests)
      .set({
        status: 'completed',
        completedAt: new Date(),
        anonymizedData,
      })
      .where(eq(accountDeletionRequests.id, requestId));

    console.log(`Account ${userId} deleted successfully`);

    return { success: true };
  } catch (error) {
    console.error('Error executing account deletion:', error);
    return { success: false, error: 'Erreur lors de la suppression' };
  }
}

/**
 * Traite les demandes de suppression dont le délai est passé
 * À appeler par un CRON job
 */
export async function processPendingDeletions(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Récupérer les demandes dont le délai est passé
    const pendingRequests = await db
      .select()
      .from(accountDeletionRequests)
      .where(
        and(
          eq(accountDeletionRequests.status, 'pending'),
          lt(accountDeletionRequests.scheduledDeletionAt, now)
        )
      );

    console.log(`Processing ${pendingRequests.length} pending deletion requests`);

    for (const request of pendingRequests) {
      processed++;
      
      const result = await executeAccountDeletion(request.userId, request.id);
      
      if (result.success) {
        succeeded++;
      } else {
        failed++;
        console.error(`Failed to delete account ${request.userId}: ${result.error}`);
      }
    }

    return { processed, succeeded, failed };
  } catch (error) {
    console.error('Error processing pending deletions:', error);
    return { processed, succeeded, failed };
  }
}

/**
 * Vérifie si un utilisateur a une demande de suppression en cours
 */
export async function getPendingDeletionRequest(userId: string) {
  const [request] = await db
    .select({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      requestedAt: accountDeletionRequests.requestedAt,
      scheduledDeletionAt: accountDeletionRequests.scheduledDeletionAt,
    })
    .from(accountDeletionRequests)
    .where(
      and(
        eq(accountDeletionRequests.userId, userId),
        eq(accountDeletionRequests.status, 'pending')
      )
    )
    .limit(1);

  return request || null;
}
