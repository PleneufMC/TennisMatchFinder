/**
 * API Route: Box League Registration
 * 
 * POST - Inscrit le joueur à une Box League
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { registerParticipant, getBoxLeagueById } from '@/lib/box-leagues';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ leagueId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { leagueId } = await params;

    // Vérifier que la league existe et appartient au club du joueur
    const league = await getBoxLeagueById(leagueId);
    if (!league) {
      return NextResponse.json({ error: 'Box League non trouvée' }, { status: 404 });
    }

    if (league.clubId !== player.clubId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const participant = await registerParticipant({
      leagueId,
      playerId: player.id,
      currentElo: player.currentElo,
    });

    return NextResponse.json({
      success: true,
      participant,
      message: 'Inscription réussie !',
    });
  } catch (error) {
    console.error('Error registering for box league:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
