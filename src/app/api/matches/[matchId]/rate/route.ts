import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches, matchRatings, players } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, and, sql, avg } from 'drizzle-orm';
import { checkAndAwardBadges } from '@/lib/gamification/badge-checker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/matches/[matchId]/rate
 * 
 * Permet à un joueur d'évaluer son adversaire après un match confirmé.
 * L'évaluation est optionnelle et ne peut être faite qu'une fois.
 * 
 * Body: { punctuality: 1-5, fairPlay: 1-5, friendliness: 1-5, comment?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { matchId } = await params;
    const body = await request.json();
    const { punctuality, fairPlay, friendliness, comment } = body;

    // Validation des notes (1-5)
    if (
      !punctuality || !fairPlay || !friendliness ||
      punctuality < 1 || punctuality > 5 ||
      fairPlay < 1 || fairPlay > 5 ||
      friendliness < 1 || friendliness > 5
    ) {
      return NextResponse.json(
        { error: 'Les notes doivent être entre 1 et 5' },
        { status: 400 }
      );
    }

    // Récupérer le match
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    const matchData = match[0];
    if (!matchData) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    // Vérifier que le match est validé
    if (!matchData.validated) {
      return NextResponse.json(
        { error: 'Le match doit être validé avant de pouvoir évaluer' },
        { status: 400 }
      );
    }

    // Vérifier que le joueur a participé au match
    const isPlayer1 = matchData.player1Id === player.id;
    const isPlayer2 = matchData.player2Id === player.id;
    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas participé à ce match' },
        { status: 403 }
      );
    }

    // Déterminer l'adversaire à évaluer
    const ratedPlayerId = isPlayer1 ? matchData.player2Id : matchData.player1Id;

    // Vérifier qu'on n'a pas déjà évalué ce match
    const existingRating = await db
      .select()
      .from(matchRatings)
      .where(
        and(
          eq(matchRatings.matchId, matchId),
          eq(matchRatings.raterId, player.id)
        )
      )
      .limit(1);

    if (existingRating.length > 0) {
      return NextResponse.json(
        { error: 'Vous avez déjà évalué votre adversaire pour ce match' },
        { status: 400 }
      );
    }

    // Calculer la moyenne
    const averageRating = ((punctuality + fairPlay + friendliness) / 3).toFixed(1);

    // Créer l'évaluation
    const [newRating] = await db
      .insert(matchRatings)
      .values({
        matchId,
        raterId: player.id,
        ratedPlayerId,
        punctuality,
        fairPlay,
        friendliness,
        comment: comment || null,
        averageRating,
      })
      .returning();

    // Mettre à jour les moyennes de réputation du joueur évalué
    // Calculer les nouvelles moyennes à partir de toutes les évaluations
    const allRatings = await db
      .select({
        avgPunctuality: avg(matchRatings.punctuality),
        avgFairPlay: avg(matchRatings.fairPlay),
        avgFriendliness: avg(matchRatings.friendliness),
        avgOverall: avg(matchRatings.averageRating),
        count: sql<number>`count(*)::int`,
      })
      .from(matchRatings)
      .where(eq(matchRatings.ratedPlayerId, ratedPlayerId));

    const stats = allRatings[0];
    
    if (stats) {
      await db
        .update(players)
        .set({
          reputationAvg: stats.avgOverall ? String(Number(stats.avgOverall).toFixed(1)) : null,
          reputationPunctuality: stats.avgPunctuality ? String(Number(stats.avgPunctuality).toFixed(1)) : null,
          reputationFairPlay: stats.avgFairPlay ? String(Number(stats.avgFairPlay).toFixed(1)) : null,
          reputationFriendliness: stats.avgFriendliness ? String(Number(stats.avgFriendliness).toFixed(1)) : null,
          reputationCount: stats.count || 0,
          updatedAt: new Date(),
        })
        .where(eq(players.id, ratedPlayerId));

      // Vérifier si le joueur évalué mérite le badge "Partenaire Fiable"
      // Conditions : moyenne >= 4.5 ET au moins 5 évaluations
      if (stats.count >= 5 && stats.avgOverall && Number(stats.avgOverall) >= 4.5) {
        try {
          await checkAndAwardBadges(ratedPlayerId, 'manual_check', {});
        } catch (badgeError) {
          console.warn('[Rating] Badge check failed:', badgeError);
        }
      }
    }

    // Récupérer les infos du joueur évalué pour la réponse
    const ratedPlayer = await db
      .select({ fullName: players.fullName })
      .from(players)
      .where(eq(players.id, ratedPlayerId))
      .limit(1);

    return NextResponse.json({
      success: true,
      rating: newRating,
      message: `Merci ! Votre évaluation de ${ratedPlayer[0]?.fullName || 'votre adversaire'} a été enregistrée.`,
      ratedPlayer: {
        id: ratedPlayerId,
        newAverage: stats?.avgOverall ? Number(stats.avgOverall).toFixed(1) : averageRating,
        totalRatings: stats?.count || 1,
      },
    });
  } catch (error) {
    console.error('[Rating] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement de l\'évaluation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches/[matchId]/rate
 * 
 * Récupère les évaluations d'un match (pour affichage)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { matchId } = await params;

    // Récupérer le match
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    const matchData = match[0];
    if (!matchData) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    // Vérifier que le joueur a participé au match
    const isParticipant = 
      matchData.player1Id === player.id || 
      matchData.player2Id === player.id;
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas participé à ce match' },
        { status: 403 }
      );
    }

    // Récupérer les évaluations de ce match
    const ratings = await db
      .select()
      .from(matchRatings)
      .where(eq(matchRatings.matchId, matchId));

    // Vérifier si le joueur actuel a déjà évalué
    const hasRated = ratings.some(r => r.raterId === player.id);

    // Déterminer l'adversaire
    const opponentId = matchData.player1Id === player.id 
      ? matchData.player2Id 
      : matchData.player1Id;

    // Récupérer l'évaluation reçue (de l'adversaire)
    const receivedRating = ratings.find(r => r.raterId === opponentId);

    return NextResponse.json({
      matchId,
      validated: matchData.validated,
      hasRated,
      canRate: matchData.validated && !hasRated,
      receivedRating: receivedRating ? {
        punctuality: receivedRating.punctuality,
        fairPlay: receivedRating.fairPlay,
        friendliness: receivedRating.friendliness,
        average: receivedRating.averageRating,
        createdAt: receivedRating.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('[Rating] Error fetching:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des évaluations' },
      { status: 500 }
    );
  }
}
