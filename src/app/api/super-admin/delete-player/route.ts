/**
 * API Route: Super Admin - Delete Player
 * DELETE - Supprime définitivement un joueur et toutes ses données
 * 
 * ATTENTION: Action irréversible réservée aux super admins
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { 
  players, 
  users, 
  matches, 
  eloHistory, 
  matchProposals, 
  playerBadges,
  notifications,
  chatRoomMembers,
  chatMessages,
  forumThreads,
  forumReplies,
  matchNowAvailability,
  matchNowResponses,
  boxLeagueParticipants,
  boxLeagueMatches,
  tournamentParticipants,
  tournamentMatches,
} from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { isSuperAdminEmail } from '@/lib/constants/admins';

async function isSuperAdmin(playerId: string): Promise<boolean> {
  const [result] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, playerId))
    .limit(1);
  
  return isSuperAdminEmail(result?.email);
}

export async function DELETE(request: NextRequest) {
  try {
    const currentPlayer = await getServerPlayer();

    if (!currentPlayer) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier si c'est un super admin
    const superAdmin = await isSuperAdmin(currentPlayer.id);
    if (!superAdmin) {
      return NextResponse.json({ error: 'Accès réservé aux super admins' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'ID du joueur requis' }, { status: 400 });
    }

    // Empêcher un super admin de se supprimer lui-même
    if (playerId === currentPlayer.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    // Récupérer le joueur à supprimer
    const [playerToDelete] = await db
      .select()
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);

    if (!playerToDelete) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    console.log(`[Super Admin] Deleting player: ${playerToDelete.fullName} (${playerId})`);

    // Supprimer toutes les données liées au joueur
    // Ordre important pour respecter les contraintes de clés étrangères

    // 1. Supprimer les réponses Match Now
    await db.delete(matchNowResponses)
      .where(eq(matchNowResponses.responderId, playerId));

    // 2. Supprimer les disponibilités Match Now
    await db.delete(matchNowAvailability)
      .where(eq(matchNowAvailability.playerId, playerId));

    // 3. Supprimer les participations Box League
    await db.delete(boxLeagueParticipants)
      .where(eq(boxLeagueParticipants.playerId, playerId));

    // 4. Mettre à null le winnerId des matchs Box League où le joueur était gagnant
    await db.update(boxLeagueMatches)
      .set({ winnerId: null })
      .where(eq(boxLeagueMatches.winnerId, playerId));

    // 5. Supprimer les participations tournois
    await db.delete(tournamentParticipants)
      .where(eq(tournamentParticipants.playerId, playerId));

    // 6. Mettre à null le winnerId des matchs tournoi où le joueur était gagnant
    await db.update(tournamentMatches)
      .set({ winnerId: null })
      .where(eq(tournamentMatches.winnerId, playerId));

    // 7. Supprimer les messages de chat
    await db.delete(chatMessages)
      .where(eq(chatMessages.senderId, playerId));

    // 8. Supprimer les appartenances aux salons de chat
    await db.delete(chatRoomMembers)
      .where(eq(chatRoomMembers.playerId, playerId));

    // 9. Supprimer les réponses forum
    await db.delete(forumReplies)
      .where(eq(forumReplies.authorId, playerId));

    // 10. Supprimer les threads forum (ou mettre authorId à null)
    await db.update(forumThreads)
      .set({ authorId: null })
      .where(eq(forumThreads.authorId, playerId));

    // 11. Supprimer les badges du joueur
    await db.delete(playerBadges)
      .where(eq(playerBadges.playerId, playerId));

    // 12. Supprimer les notifications
    await db.delete(notifications)
      .where(eq(notifications.userId, playerId));

    // 13. Supprimer les propositions de match
    await db.delete(matchProposals)
      .where(or(
        eq(matchProposals.fromPlayerId, playerId),
        eq(matchProposals.toPlayerId, playerId)
      ));

    // 14. Supprimer l'historique ELO
    await db.delete(eloHistory)
      .where(eq(eloHistory.playerId, playerId));

    // 15. Supprimer les matchs (ou anonymiser)
    // Option 1: Supprimer les matchs où le joueur est impliqué
    await db.delete(matches)
      .where(or(
        eq(matches.player1Id, playerId),
        eq(matches.player2Id, playerId)
      ));

    // 16. Supprimer le profil joueur
    await db.delete(players)
      .where(eq(players.id, playerId));

    // 17. Supprimer le compte utilisateur
    await db.delete(users)
      .where(eq(users.id, playerId));

    console.log(`[Super Admin] Player ${playerToDelete.fullName} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: `Le joueur ${playerToDelete.fullName} a été supprimé définitivement`,
      deletedPlayer: {
        id: playerId,
        name: playerToDelete.fullName,
      },
    });
  } catch (error) {
    console.error('[Super Admin] Error deleting player:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du joueur',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
