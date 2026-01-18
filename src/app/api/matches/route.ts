import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches, players, notifications, eloHistory } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, and, or, desc, sql, count, gte } from 'drizzle-orm';
import { 
  calculateEloChange, 
  type EloCalculationParams,
  ELO_CONFIG 
} from '@/lib/elo/calculator';
import { 
  parseScoreForGames, 
  inferFormatFromScore,
  isValidMatchFormat,
  type MatchFormat 
} from '@/lib/elo/format-coefficients';
import { getAutoValidateDate, VALIDATION_MESSAGES } from '@/lib/constants/validation';
import { withRateLimit } from '@/lib/rate-limit';

// GET: Liste des matchs du joueur
export async function GET(request: NextRequest) {
  // Rate limiting - 30 requêtes par minute
  const rateLimitResponse = await withRateLimit(request, 'matches');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending' | 'validated' | 'all'
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereCondition;
    
    if (status === 'pending') {
      whereCondition = and(
        or(
          eq(matches.player1Id, player.id),
          eq(matches.player2Id, player.id)
        ),
        eq(matches.validated, false)
      );
    } else if (status === 'validated') {
      whereCondition = and(
        or(
          eq(matches.player1Id, player.id),
          eq(matches.player2Id, player.id)
        ),
        eq(matches.validated, true)
      );
    } else {
      whereCondition = or(
        eq(matches.player1Id, player.id),
        eq(matches.player2Id, player.id)
      );
    }

    const playerMatches = await db
      .select()
      .from(matches)
      .where(whereCondition)
      .orderBy(desc(matches.playedAt))
      .limit(limit);

    // Enrichir avec les noms des joueurs
    const enrichedMatches = await Promise.all(
      playerMatches.map(async (match) => {
        const [player1, player2] = await Promise.all([
          db.select({ fullName: players.fullName, avatarUrl: players.avatarUrl })
            .from(players)
            .where(eq(players.id, match.player1Id))
            .limit(1),
          db.select({ fullName: players.fullName, avatarUrl: players.avatarUrl })
            .from(players)
            .where(eq(players.id, match.player2Id))
            .limit(1),
        ]);

        return {
          ...match,
          player1Name: player1[0]?.fullName || 'Joueur inconnu',
          player1Avatar: player1[0]?.avatarUrl,
          player2Name: player2[0]?.fullName || 'Joueur inconnu',
          player2Avatar: player2[0]?.avatarUrl,
          isReporter: match.reportedBy === player.id,
          needsConfirmation: !match.validated && match.reportedBy !== player.id,
        };
      })
    );

    return NextResponse.json({ matches: enrichedMatches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Créer un nouveau match
export async function POST(request: NextRequest) {
  // Rate limiting - 30 requêtes par minute
  const rateLimitResponse = await withRateLimit(request, 'matches');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.clubId) {
      return NextResponse.json({ error: 'Vous devez appartenir à un club pour enregistrer un match' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      clubId, 
      opponentId, 
      winnerId, 
      score, 
      matchFormat: requestedFormat,
      gameType, 
      surface, 
      playedAt, 
      notes 
    } = body;

    // Validation
    if (!opponentId || !winnerId || !score) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Déterminer le format du match (fourni ou inféré du score)
    let matchFormat: MatchFormat = 'two_sets';
    if (requestedFormat && isValidMatchFormat(requestedFormat)) {
      matchFormat = requestedFormat;
    } else {
      // Inférer du score si non fourni
      matchFormat = inferFormatFromScore(score);
    }

    // Vérifier que l'adversaire est du même club
    const opponent = await db
      .select()
      .from(players)
      .where(and(eq(players.id, opponentId), eq(players.clubId, player.clubId)))
      .limit(1);

    const opponentPlayer = opponent[0];
    if (!opponentPlayer) {
      return NextResponse.json({ error: 'Adversaire non trouvé dans votre club' }, { status: 400 });
    }

    // Vérifier que le vainqueur est l'un des deux joueurs
    if (winnerId !== player.id && winnerId !== opponentId) {
      return NextResponse.json({ error: 'Vainqueur invalide' }, { status: 400 });
    }

    // Déterminer player1 et player2 (le rapporteur est toujours player1)
    const isPlayerWinner = winnerId === player.id;
    const player1Id = player.id;
    const player2Id = opponentId;
    const player1Elo = player.currentElo;
    const player2Elo = opponentPlayer.currentElo;

    // Vérifier les modificateurs ELO
    // 1. Est-ce un nouvel adversaire ?
    const previousMatches = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.clubId, player.clubId),
          eq(matches.validated, true),
          or(
            and(eq(matches.player1Id, player1Id), eq(matches.player2Id, player2Id)),
            and(eq(matches.player1Id, player2Id), eq(matches.player2Id, player1Id))
          )
        )
      );
    const isNewOpponent = previousMatches.length === 0;

    // 2. Compter les matchs récents vs même adversaire (7 jours)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentMatches = previousMatches.filter(
      (m) => new Date(m.playedAt) > oneWeekAgo
    );
    const repeatCount = recentMatches.length;

    // 3. Vérifier la diversité (3+ adversaires différents cette semaine)
    const weeklyMatches = await db
      .select({ opponentId: sql<string>`CASE WHEN ${matches.player1Id} = ${player1Id} THEN ${matches.player2Id} ELSE ${matches.player1Id} END` })
      .from(matches)
      .where(
        and(
          eq(matches.validated, true),
          or(eq(matches.player1Id, player1Id), eq(matches.player2Id, player1Id)),
          sql`${matches.playedAt} > ${oneWeekAgo}`
        )
      );
    const uniqueOpponents = new Set(weeklyMatches.map((m) => m.opponentId));
    const diversityBonus = uniqueOpponents.size >= 3;

    // 4. Déterminer gagnant/perdant et leurs ELO
    const winnerElo = winnerId === player1Id ? player1Elo : player2Elo;
    const loserElo = winnerId === player1Id ? player2Elo : player1Elo;
    const winnerPlayer = winnerId === player1Id ? player : opponentPlayer;
    const loserPlayer = winnerId === player1Id ? opponentPlayer : player;

    // 5. Calculer les jeux pour le modificateur de marge
    const { winnerGames, loserGames } = parseScoreForGames(score, winnerId, player1Id);

    // Calculer le changement ELO avec le nouveau système
    const eloParams: EloCalculationParams = {
      winnerElo,
      loserElo,
      winnerMatchCount: winnerPlayer.matchesPlayed || 0,
      loserMatchCount: loserPlayer.matchesPlayed || 0,
      matchFormat,
      winnerGames,
      loserGames,
      isNewOpponent,
      recentMatchesVsSameOpponent: repeatCount,
      weeklyUniqueOpponents: uniqueOpponents.size,
    };

    const eloResult = calculateEloChange(eloParams);
    const { winnerDelta, loserDelta, breakdown } = eloResult;
    
    // Construire les modificateurs appliqués pour stockage
    const modifiersApplied = {
      formatCoefficient: breakdown.formatCoefficient,
      marginModifier: breakdown.marginModifier,
      newOpponentBonus: breakdown.newOpponentBonus,
      upsetBonus: breakdown.upsetBonus,
      repetitionMalus: breakdown.repetitionMalus,
      diversityBonus: breakdown.diversityBonus,
      kFactor: breakdown.kFactor,
    };

    // Les ELO finaux (seront appliqués après validation)
    const winnerNewElo = winnerElo + winnerDelta;
    const loserNewElo = Math.max(100, loserElo + loserDelta); // Minimum 100 ELO

    // Calculer la date d'auto-validation (24h après création)
    const now = new Date();
    const autoValidateAt = getAutoValidateDate(now);

    // Créer le match (non validé)
    const [newMatch] = await db
      .insert(matches)
      .values({
        clubId: player.clubId,
        player1Id,
        player2Id,
        winnerId,
        score,
        matchFormat, // Nouveau champ
        gameType: gameType || 'simple',
        surface: surface || null,
        player1EloBefore: player1Elo,
        player2EloBefore: player2Elo,
        player1EloAfter: winnerId === player1Id ? winnerNewElo : loserNewElo,
        player2EloAfter: winnerId === player2Id ? winnerNewElo : loserNewElo,
        modifiersApplied,
        playedAt: new Date(playedAt),
        reportedBy: player.id,
        validated: false, // En attente de confirmation
        autoValidateAt, // Date d'auto-validation
        notes: notes || null,
      })
      .returning();

    if (!newMatch) {
      return NextResponse.json({ error: 'Erreur lors de la création du match' }, { status: 500 });
    }

    // Créer une notification pour l'adversaire
    const winnerName = winnerId === player.id ? player.fullName : opponentPlayer.fullName;
    const reporterIsWinner = winnerId === player.id;
    const notificationMessage = VALIDATION_MESSAGES.matchReported(player.fullName, score);

    await db.insert(notifications).values({
      userId: opponentId,
      type: 'match_confirmation',
      title: notificationMessage.title,
      message: `${notificationMessage.body} Résultat: ${reporterIsWinner ? 'Défaite' : 'Victoire'}. ⏱️ Auto-validation dans 24h.`,
      link: `/matchs/confirmer/${newMatch.id}`,
      data: {
        matchId: newMatch.id,
        reporterId: player.id,
        reporterName: player.fullName,
        score,
        winnerId,
        winnerName,
        autoValidateAt: autoValidateAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      match: newMatch,
      eloChange: {
        winner: { 
          playerId: winnerId,
          before: winnerElo, 
          after: winnerNewElo, 
          delta: winnerDelta 
        },
        loser: { 
          playerId: winnerId === player1Id ? player2Id : player1Id,
          before: loserElo, 
          after: loserNewElo, 
          delta: loserDelta 
        },
        breakdown, // Breakdown complet pour affichage transparent
        matchFormat,
      },
      message: 'Match enregistré. En attente de confirmation par votre adversaire.',
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
