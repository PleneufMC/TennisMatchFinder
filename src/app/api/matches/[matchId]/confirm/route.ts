import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches, players, notifications, eloHistory } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, and, or } from 'drizzle-orm';
import { triggerBadgeCheckAfterMatch } from '@/lib/gamification/badge-checker';

// POST: Confirmer ou rejeter un match
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { matchId } = params;
    const body = await request.json();
    const { action } = body; // 'confirm' | 'reject'

    if (!action || !['confirm', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Récupérer le match
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    // Vérifier que le match n'est pas déjà validé
    if (match.validated) {
      return NextResponse.json({ error: 'Ce match a déjà été validé' }, { status: 400 });
    }

    // Vérifier que le joueur est bien l'adversaire (celui qui doit confirmer)
    const isPlayer1 = match.player1Id === player.id;
    const isPlayer2 = match.player2Id === player.id;

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: 'Vous n\'êtes pas impliqué dans ce match' }, { status: 403 });
    }

    // Le rapporteur ne peut pas confirmer son propre match
    if (match.reportedBy === player.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas confirmer votre propre déclaration' }, { status: 403 });
    }

    // Récupérer l'autre joueur (le rapporteur)
    const reporterId = match.reportedBy;
    const [reporter] = await db
      .select()
      .from(players)
      .where(eq(players.id, reporterId!))
      .limit(1);

    if (action === 'reject') {
      // Supprimer le match
      await db.delete(matches).where(eq(matches.id, matchId));

      // Notifier le rapporteur
      if (reporter) {
        await db.insert(notifications).values({
          userId: reporter.id,
          type: 'match_rejected',
          title: 'Match refusé',
          message: `${player.fullName} a refusé de confirmer votre déclaration de match.`,
          link: '/matchs',
          data: {
            matchId,
            rejectedBy: player.id,
            rejectedByName: player.fullName,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Match refusé et supprimé.',
      });
    }

    // Confirmer le match
    // 1. Mettre à jour le match
    await db
      .update(matches)
      .set({
        validated: true,
        validatedBy: player.id,
        validatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    // 2. Mettre à jour les ELO des joueurs
    const player1NewElo = match.player1EloAfter;
    const player2NewElo = match.player2EloAfter;

    await db
      .update(players)
      .set({
        currentElo: player1NewElo,
        matchesPlayed: player.id === match.player1Id
          ? Number(player.matchesPlayed) + 1
          : undefined,
        wins: match.winnerId === match.player1Id
          ? undefined // On met à jour ci-dessous
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(players.id, match.player1Id));

    await db
      .update(players)
      .set({
        currentElo: player2NewElo,
        updatedAt: new Date(),
      })
      .where(eq(players.id, match.player2Id));

    // Mettre à jour les stats (matchesPlayed, wins, losses)
    // Pour player1
    const player1Stats = match.winnerId === match.player1Id
      ? { wins: 1, losses: 0 }
      : { wins: 0, losses: 1 };
    
    const player2Stats = match.winnerId === match.player2Id
      ? { wins: 1, losses: 0 }
      : { wins: 0, losses: 1 };

    await db.execute(
      `UPDATE players SET 
        matches_played = matches_played + 1, 
        wins = wins + ${player1Stats.wins},
        losses = losses + ${player1Stats.losses}
      WHERE id = '${match.player1Id}'`
    );

    await db.execute(
      `UPDATE players SET 
        matches_played = matches_played + 1, 
        wins = wins + ${player2Stats.wins},
        losses = losses + ${player2Stats.losses}
      WHERE id = '${match.player2Id}'`
    );

    // 3. Enregistrer l'historique ELO
    const player1EloDelta = match.player1EloAfter - match.player1EloBefore;
    const player2EloDelta = match.player2EloAfter - match.player2EloBefore;

    await db.insert(eloHistory).values([
      {
        playerId: match.player1Id,
        matchId: match.id,
        elo: player1NewElo,
        delta: player1EloDelta,
        reason: match.winnerId === match.player1Id ? 'match_win' : 'match_loss',
        metadata: match.modifiersApplied,
      },
      {
        playerId: match.player2Id,
        matchId: match.id,
        elo: player2NewElo,
        delta: player2EloDelta,
        reason: match.winnerId === match.player2Id ? 'match_win' : 'match_loss',
        metadata: match.modifiersApplied,
      },
    ]);

    // 4. Notifier le rapporteur
    if (reporter) {
      const winnerName = match.winnerId === reporter.id ? 'vous' : player.fullName;
      await db.insert(notifications).values({
        userId: reporter.id,
        type: 'match_confirmed',
        title: 'Match confirmé !',
        message: `${player.fullName} a confirmé votre match. Victoire de ${winnerName}. Les ELO ont été mis à jour.`,
        link: '/matchs',
        data: {
          matchId,
          confirmedBy: player.id,
          confirmedByName: player.fullName,
          eloChange: player1EloDelta,
        },
      });
    }

    // 5. Vérifier et attribuer les badges pour les deux joueurs
    const { player1Badges, player2Badges } = await triggerBadgeCheckAfterMatch(
      match.player1Id,
      match.player2Id,
      match.winnerId,
      {
        player1Elo: match.player1EloBefore,
        player2Elo: match.player2EloBefore,
        matchId: match.id,
        clubId: match.clubId,
      }
    );

    // Note: Les notifications sont déjà créées par triggerBadgeCheckAfterMatch

    return NextResponse.json({
      success: true,
      message: 'Match confirmé ! Les ELO ont été mis à jour.',
      eloChanges: {
        player1: { id: match.player1Id, before: match.player1EloBefore, after: player1NewElo, delta: player1EloDelta },
        player2: { id: match.player2Id, before: match.player2EloBefore, after: player2NewElo, delta: player2EloDelta },
      },
      newBadges: {
        player1: player1Badges,
        player2: player2Badges,
      },
    });
  } catch (error) {
    console.error('Error confirming match:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
