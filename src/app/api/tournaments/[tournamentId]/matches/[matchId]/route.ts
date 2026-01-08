/**
 * API Route pour enregistrer le résultat d'un match de tournoi
 * PATCH /api/tournaments/[tournamentId]/matches/[matchId] - Enregistrer le résultat
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, tournamentMatches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getTournamentById,
  recordMatchResult,
} from '@/lib/tournaments';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ tournamentId: string; matchId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { tournamentId, matchId } = await params;

    // Récupérer le joueur
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    // Récupérer le tournoi
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournoi non trouvé' }, { status: 404 });
    }

    // Vérifier que le tournoi est actif
    if (tournament.status !== 'active') {
      return NextResponse.json(
        { error: 'Le tournoi n\'est pas en cours' },
        { status: 400 }
      );
    }

    // Récupérer le match
    const [match] = await db
      .select()
      .from(tournamentMatches)
      .where(eq(tournamentMatches.id, matchId))
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    // Vérifier que le match appartient au tournoi
    if (match.tournamentId !== tournamentId) {
      return NextResponse.json(
        { error: 'Ce match n\'appartient pas à ce tournoi' },
        { status: 400 }
      );
    }

    // Vérifier que le joueur est soit un des joueurs du match, soit admin
    const isMatchPlayer = match.player1Id === player.id || match.player2Id === player.id;
    if (!isMatchPlayer && !player.isAdmin) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à enregistrer ce résultat' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation des champs requis
    if (!body.winnerId || !body.score || body.player1Sets === undefined || body.player2Sets === undefined) {
      return NextResponse.json(
        { error: 'Champs requis: winnerId, score, player1Sets, player2Sets' },
        { status: 400 }
      );
    }

    // Valider le score
    const setsToWin = match.round === tournament.totalRounds 
      ? tournament.finalSetsToWin 
      : tournament.setsToWin;
    
    const winnerSets = body.winnerId === match.player1Id ? body.player1Sets : body.player2Sets;
    if (winnerSets < setsToWin) {
      return NextResponse.json(
        { error: `Le vainqueur doit avoir gagné au moins ${setsToWin} sets` },
        { status: 400 }
      );
    }

    // Enregistrer le résultat
    const updatedMatch = await recordMatchResult({
      matchId,
      winnerId: body.winnerId,
      score: body.score,
      player1Sets: body.player1Sets,
      player2Sets: body.player2Sets,
      mainMatchId: body.mainMatchId,
    });

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    console.error('Erreur PATCH /api/tournaments/[id]/matches/[matchId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
