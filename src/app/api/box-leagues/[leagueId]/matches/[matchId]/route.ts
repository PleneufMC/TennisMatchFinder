/**
 * API Route pour enregistrer le résultat d'un match de Box League
 * PATCH /api/box-leagues/[leagueId]/matches/[matchId] - Enregistrer le résultat
 * GET /api/box-leagues/[leagueId]/matches/[matchId] - Récupérer un match
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, boxLeagueMatches, matches } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import {
  getBoxLeagueById,
  recordMatchResult,
} from '@/lib/box-leagues/service';
import { calculateEloChange } from '@/lib/elo';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ leagueId: string; matchId: string }>;
}

// Schéma de validation pour l'enregistrement du score
const recordScoreSchema = z.object({
  winnerId: z.string().uuid('ID du gagnant invalide'),
  score: z.string().min(3, 'Score requis (ex: 6-4 6-3)'),
  player1Sets: z.number().int().min(0).max(3),
  player2Sets: z.number().int().min(0).max(3),
  player1Games: z.number().int().min(0).optional(),
  player2Games: z.number().int().min(0).optional(),
  createMainMatch: z.boolean().optional().default(true), // Créer aussi un match "classique" pour l'ELO
});

/**
 * GET - Récupérer les détails d'un match
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { leagueId, matchId } = await params;

    // Récupérer le match
    const [match] = await db
      .select()
      .from(boxLeagueMatches)
      .where(
        and(
          eq(boxLeagueMatches.id, matchId),
          eq(boxLeagueMatches.leagueId, leagueId)
        )
      )
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    // Récupérer les infos des joueurs
    const [player1] = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      })
      .from(players)
      .where(eq(players.id, match.player1Id))
      .limit(1);

    const [player2] = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      })
      .from(players)
      .where(eq(players.id, match.player2Id))
      .limit(1);

    return NextResponse.json({
      match: {
        ...match,
        player1,
        player2,
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/box-leagues/[id]/matches/[matchId]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Enregistrer le résultat d'un match
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { leagueId, matchId } = await params;

    // Récupérer le joueur
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    // Récupérer la Box League
    const league = await getBoxLeagueById(leagueId);
    if (!league) {
      return NextResponse.json({ error: 'Box League non trouvée' }, { status: 404 });
    }

    // Vérifier que la league est active
    if (league.status !== 'active') {
      return NextResponse.json(
        { error: 'La Box League n\'est pas en cours' },
        { status: 400 }
      );
    }

    // Récupérer le match
    const [match] = await db
      .select()
      .from(boxLeagueMatches)
      .where(
        and(
          eq(boxLeagueMatches.id, matchId),
          eq(boxLeagueMatches.leagueId, leagueId)
        )
      )
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    // Vérifier que le joueur est soit un des joueurs du match, soit admin
    const isMatchPlayer = match.player1Id === player.id || match.player2Id === player.id;
    if (!isMatchPlayer && !player.isAdmin) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à enregistrer ce résultat' },
        { status: 403 }
      );
    }

    // Vérifier que le match n'est pas déjà terminé
    if (match.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Ce match a déjà un résultat enregistré' },
        { status: 400 }
      );
    }

    // Valider le body
    const body = await request.json();
    const validation = recordScoreSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { winnerId, score, player1Sets, player2Sets, player1Games, player2Games, createMainMatch } = validation.data;

    // Vérifier que le gagnant est bien l'un des deux joueurs
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return NextResponse.json(
        { error: 'Le gagnant doit être l\'un des deux joueurs du match' },
        { status: 400 }
      );
    }

    // Calculer les jeux si non fournis (estimation basée sur les sets)
    const finalPlayer1Games = player1Games ?? (player1Sets * 6 + player2Sets * 4);
    const finalPlayer2Games = player2Games ?? (player2Sets * 6 + player1Sets * 4);

    // Enregistrer le résultat dans la Box League
    await recordMatchResult({
      matchId,
      winnerId,
      score,
      player1Sets,
      player2Sets,
      player1Games: finalPlayer1Games,
      player2Games: finalPlayer2Games,
    });

    // Optionnellement créer un match "classique" pour l'intégration ELO
    let mainMatchId: string | null = null;
    if (createMainMatch) {
      // Récupérer les ELOs actuels des joueurs
      const [p1Data] = await db
        .select({ currentElo: players.currentElo })
        .from(players)
        .where(eq(players.id, match.player1Id))
        .limit(1);

      const [p2Data] = await db
        .select({ currentElo: players.currentElo })
        .from(players)
        .where(eq(players.id, match.player2Id))
        .limit(1);

      const player1Elo = p1Data?.currentElo || 1200;
      const player2Elo = p2Data?.currentElo || 1200;

      // Calculer le changement ELO
      const isPlayer1Winner = winnerId === match.player1Id;
      const { winnerDelta, loserDelta } = calculateEloChange({
        winnerElo: isPlayer1Winner ? player1Elo : player2Elo,
        loserElo: isPlayer1Winner ? player2Elo : player1Elo,
        winnerMatchCount: 30, // Valeur par défaut pour match de compétition
        loserMatchCount: 30,  // Valeur par défaut pour match de compétition
        matchFormat: player1Sets >= 2 || player2Sets >= 2 ? 'three_sets' : 'two_sets',
        winnerGames: isPlayer1Winner ? finalPlayer1Games : finalPlayer2Games,
        loserGames: isPlayer1Winner ? finalPlayer2Games : finalPlayer1Games,
        isNewOpponent: true, // Simplification
      });

      const player1EloAfter = isPlayer1Winner 
        ? player1Elo + winnerDelta 
        : Math.max(100, player1Elo + loserDelta);
      const player2EloAfter = isPlayer1Winner 
        ? Math.max(100, player2Elo + loserDelta) 
        : player2Elo + winnerDelta;

      // Créer le match principal (qui sera validé immédiatement car c'est un match de compétition)
      const [newMainMatch] = await db
        .insert(matches)
        .values({
          clubId: league.clubId,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          winnerId,
          score,
          matchFormat: player1Sets >= 2 || player2Sets >= 2 ? 'three_sets' : 'two_sets',
          gameType: 'simple',
          playedAt: new Date(),
          reportedBy: player.id,
          validated: true, // Match de compétition = validé automatiquement
          validatedAt: new Date(),
          validatedBy: player.id,
          player1EloBefore: player1Elo,
          player2EloBefore: player2Elo,
          player1EloAfter,
          player2EloAfter,
          notes: `Match Box League: ${league.name}`,
        })
        .returning();

      mainMatchId = newMainMatch?.id || null;

      // Mettre à jour le lien vers le match principal
      if (mainMatchId) {
        await db
          .update(boxLeagueMatches)
          .set({ mainMatchId })
          .where(eq(boxLeagueMatches.id, matchId));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Résultat enregistré avec succès',
      mainMatchId,
    });
  } catch (error) {
    console.error('Erreur PATCH /api/box-leagues/[id]/matches/[matchId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
