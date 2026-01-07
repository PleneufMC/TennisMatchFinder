import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches, players, notifications, eloHistory } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, and, or, desc, sql, count } from 'drizzle-orm';

// Configuration ELO
const ELO_CONFIG = {
  K_FACTOR: 32, // Facteur K standard
  NEW_OPPONENT_BONUS: 0.15, // +15% pour nouvel adversaire
  UPSET_BONUS: 0.20, // +20% pour victoire exploit (ELO adversaire > 100 pts)
  REPEAT_PENALTY: 0.05, // -5% par match récent vs même adversaire
  DIVERSITY_BONUS: 0.10, // +10% si 3+ adversaires cette semaine
};

// Calculer le changement ELO
function calculateEloChange(
  winnerElo: number,
  loserElo: number,
  modifiers: {
    isNewOpponent: boolean;
    isUpset: boolean;
    repeatCount: number;
    diversityBonus: boolean;
  }
): { winnerDelta: number; loserDelta: number; modifiersApplied: Record<string, number> } {
  // Calcul ELO standard
  const expectedWin = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  let baseDelta = Math.round(ELO_CONFIG.K_FACTOR * (1 - expectedWin));
  
  const modifiersApplied: Record<string, number> = {};
  let multiplier = 1;

  // Bonus nouvel adversaire
  if (modifiers.isNewOpponent) {
    multiplier += ELO_CONFIG.NEW_OPPONENT_BONUS;
    modifiersApplied.newOpponent = ELO_CONFIG.NEW_OPPONENT_BONUS;
  }

  // Bonus victoire exploit
  if (modifiers.isUpset) {
    multiplier += ELO_CONFIG.UPSET_BONUS;
    modifiersApplied.upset = ELO_CONFIG.UPSET_BONUS;
  }

  // Pénalité matchs répétés
  if (modifiers.repeatCount > 0) {
    const penalty = modifiers.repeatCount * ELO_CONFIG.REPEAT_PENALTY;
    multiplier -= penalty;
    modifiersApplied.repeatPenalty = -penalty;
  }

  // Bonus diversité
  if (modifiers.diversityBonus) {
    multiplier += ELO_CONFIG.DIVERSITY_BONUS;
    modifiersApplied.diversity = ELO_CONFIG.DIVERSITY_BONUS;
  }

  // Appliquer le multiplicateur
  const winnerDelta = Math.max(1, Math.round(baseDelta * multiplier));
  const loserDelta = -Math.round(baseDelta * 0.8); // Le perdant perd légèrement moins

  return { winnerDelta, loserDelta, modifiersApplied };
}

// GET: Liste des matchs du joueur
export async function GET(request: NextRequest) {
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
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { clubId, opponentId, winnerId, score, gameType, surface, playedAt, notes } = body;

    // Validation
    if (!opponentId || !winnerId || !score) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
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

    // 4. Est-ce une victoire exploit ? (gagnant a 100+ pts de moins)
    const winnerElo = winnerId === player1Id ? player1Elo : player2Elo;
    const loserElo = winnerId === player1Id ? player2Elo : player1Elo;
    const isUpset = loserElo - winnerElo >= 100;

    // Calculer le changement ELO
    const { winnerDelta, loserDelta, modifiersApplied } = calculateEloChange(
      winnerElo,
      loserElo,
      { isNewOpponent, isUpset, repeatCount, diversityBonus }
    );

    // Les ELO finaux (seront appliqués après validation)
    const winnerNewElo = winnerElo + winnerDelta;
    const loserNewElo = Math.max(100, loserElo + loserDelta); // Minimum 100 ELO

    // Créer le match (non validé)
    const [newMatch] = await db
      .insert(matches)
      .values({
        clubId: player.clubId,
        player1Id,
        player2Id,
        winnerId,
        score,
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
        notes: notes || null,
      })
      .returning();

    if (!newMatch) {
      return NextResponse.json({ error: 'Erreur lors de la création du match' }, { status: 500 });
    }

    // Créer une notification pour l'adversaire
    const winnerName = winnerId === player.id ? player.fullName : opponentPlayer.fullName;
    const reporterIsWinner = winnerId === player.id;

    await db.insert(notifications).values({
      userId: opponentId,
      type: 'match_confirmation',
      title: 'Match à confirmer',
      message: `${player.fullName} a déclaré un match contre vous. Résultat: ${reporterIsWinner ? 'Défaite' : 'Victoire'} (${score}). Confirmez-vous ce résultat ?`,
      link: `/matchs/confirmer/${newMatch.id}`,
      data: {
        matchId: newMatch.id,
        reporterId: player.id,
        reporterName: player.fullName,
        score,
        winnerId,
        winnerName,
      },
    });

    return NextResponse.json({
      success: true,
      match: newMatch,
      eloChange: {
        winner: { before: winnerElo, after: winnerNewElo, delta: winnerDelta },
        loser: { before: loserElo, after: loserNewElo, delta: loserDelta },
        modifiers: modifiersApplied,
      },
      message: 'Match enregistré. En attente de confirmation par votre adversaire.',
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
