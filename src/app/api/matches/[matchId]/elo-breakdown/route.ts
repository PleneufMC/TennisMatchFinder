/**
 * API Route: GET /api/matches/[matchId]/elo-breakdown
 * 
 * Récupère le breakdown ELO complet pour un match
 * USP CRITIQUE : Différenciation vs Playtomic (rating opaque)
 * 
 * Retourne:
 * - Détail du calcul ELO pour les deux joueurs
 * - Facteurs K appliqués
 * - Modificateurs et leur impact
 * - Probabilité de victoire calculée
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { matches, players } from '@/lib/db/schema';
import { eq, and, or, lt } from 'drizzle-orm';
import { calculateExpectedScore, calculateKFactor, getEloRankTitle } from '@/lib/elo';
import type { ModifiersResult, PlayerForCalculation } from '@/lib/elo/types';

export const dynamic = 'force-dynamic';

interface EloBreakdownResponse {
  matchId: string;
  playedAt: string;
  score: string;
  winner: PlayerBreakdown;
  loser: PlayerBreakdown;
}

interface PlayerBreakdown {
  id: string;
  name: string;
  avatarUrl: string | null;
  isWinner: boolean;
  eloBefore: number;
  eloAfter: number;
  delta: number;
  kFactor: number;
  kFactorLabel: string;
  expectedScore: number;
  actualScore: number;
  winProbability: number;
  modifiers: ModifiersResult;
  rankTitle: {
    title: string;
    color: string;
    icon: string;
  };
  clubRank?: number;
  clubTotal?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const matchId = params.matchId;

    // Récupérer le match
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      return NextResponse.json(
        { error: 'Match non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est impliqué dans le match ou admin
    const isInvolved = 
      match.player1Id === session.user.id || 
      match.player2Id === session.user.id;

    // Pour l'instant, permettre à tous les membres du club de voir
    // TODO: Vérifier si l'utilisateur est membre du même club

    // Récupérer les infos des joueurs
    const [player1Data] = await db
      .select()
      .from(players)
      .where(eq(players.id, match.player1Id))
      .limit(1);

    const [player2Data] = await db
      .select()
      .from(players)
      .where(eq(players.id, match.player2Id))
      .limit(1);

    if (!player1Data || !player2Data) {
      return NextResponse.json(
        { error: 'Joueurs non trouvés' },
        { status: 404 }
      );
    }

    // Déterminer le gagnant et le perdant
    const isPlayer1Winner = match.winnerId === match.player1Id;
    const winnerData = isPlayer1Winner ? player1Data : player2Data;
    const loserData = isPlayer1Winner ? player2Data : player1Data;
    const winnerEloBefore = isPlayer1Winner ? match.player1EloBefore : match.player2EloBefore;
    const winnerEloAfter = isPlayer1Winner ? match.player1EloAfter : match.player2EloAfter;
    const loserEloBefore = isPlayer1Winner ? match.player2EloBefore : match.player1EloBefore;
    const loserEloAfter = isPlayer1Winner ? match.player2EloAfter : match.player1EloAfter;

    // Calculer les facteurs K (estimation basée sur les matchs au moment du match)
    const winnerKFactor = calculateKFactor({
      id: winnerData.id,
      currentElo: winnerEloBefore,
      matchesPlayed: winnerData.matchesPlayed - 1, // -1 car ce match est déjà compté
    });

    const loserKFactor = calculateKFactor({
      id: loserData.id,
      currentElo: loserEloBefore,
      matchesPlayed: loserData.matchesPlayed - 1,
    });

    // Calculer les probabilités de victoire
    const winnerExpectedScore = calculateExpectedScore(winnerEloBefore, loserEloBefore);
    const loserExpectedScore = calculateExpectedScore(loserEloBefore, winnerEloBefore);

    // Récupérer les modificateurs stockés
    const modifiersApplied = match.modifiersApplied as Record<string, unknown> || {};
    
    // Parser les modificateurs pour chaque joueur
    const winnerModifiers: ModifiersResult = parseModifiers(
      modifiersApplied,
      winnerData.id,
      true
    );
    const loserModifiers: ModifiersResult = parseModifiers(
      modifiersApplied,
      loserData.id,
      false
    );

    // Calculer le classement dans le club
    let winnerClubRank: number | undefined;
    let loserClubRank: number | undefined;
    let clubTotal: number | undefined;

    if (match.clubId) {
      const clubPlayers = await db
        .select({ id: players.id, currentElo: players.currentElo })
        .from(players)
        .where(
          and(
            eq(players.clubId, match.clubId),
            eq(players.isActive, true)
          )
        )
        .orderBy(players.currentElo);

      clubTotal = clubPlayers.length;
      
      // Calculer les rangs (du plus haut ELO au plus bas)
      const sortedByElo = [...clubPlayers].sort((a, b) => b.currentElo - a.currentElo);
      winnerClubRank = sortedByElo.findIndex(p => p.id === winnerData.id) + 1;
      loserClubRank = sortedByElo.findIndex(p => p.id === loserData.id) + 1;
    }

    // Construire la réponse
    const response: EloBreakdownResponse = {
      matchId: match.id,
      playedAt: match.playedAt.toISOString(),
      score: match.score,
      winner: {
        id: winnerData.id,
        name: winnerData.fullName,
        avatarUrl: winnerData.avatarUrl,
        isWinner: true,
        eloBefore: winnerEloBefore,
        eloAfter: winnerEloAfter,
        delta: winnerEloAfter - winnerEloBefore,
        kFactor: winnerKFactor,
        kFactorLabel: getKFactorLabel(winnerKFactor),
        expectedScore: winnerExpectedScore,
        actualScore: 1,
        winProbability: Math.round(winnerExpectedScore * 100),
        modifiers: winnerModifiers,
        rankTitle: getEloRankTitle(winnerEloAfter),
        clubRank: winnerClubRank,
        clubTotal,
      },
      loser: {
        id: loserData.id,
        name: loserData.fullName,
        avatarUrl: loserData.avatarUrl,
        isWinner: false,
        eloBefore: loserEloBefore,
        eloAfter: loserEloAfter,
        delta: loserEloAfter - loserEloBefore,
        kFactor: loserKFactor,
        kFactorLabel: getKFactorLabel(loserKFactor),
        expectedScore: loserExpectedScore,
        actualScore: 0,
        winProbability: Math.round(loserExpectedScore * 100),
        modifiers: loserModifiers,
        rankTitle: getEloRankTitle(loserEloAfter),
        clubRank: loserClubRank,
        clubTotal,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('ELO breakdown error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du breakdown ELO' },
      { status: 500 }
    );
  }
}

/**
 * Retourne le label du facteur K
 */
function getKFactorLabel(kFactor: number): string {
  if (kFactor >= 40) return 'Nouveau joueur';
  if (kFactor >= 32) return 'Intermédiaire';
  if (kFactor >= 24) return 'Établi';
  return 'Expert';
}

/**
 * Parse les modificateurs stockés pour un joueur
 */
function parseModifiers(
  modifiersApplied: Record<string, unknown>,
  playerId: string,
  isWinner: boolean
): ModifiersResult {
  // Essayer de récupérer les modificateurs stockés
  const playerKey = isWinner ? 'winner' : 'loser';
  const storedModifiers = modifiersApplied[playerKey] as ModifiersResult | undefined;

  if (storedModifiers && storedModifiers.details) {
    return storedModifiers;
  }

  // Fallback: retourner des modificateurs vides
  return {
    totalModifier: 1.0,
    details: [],
  };
}
