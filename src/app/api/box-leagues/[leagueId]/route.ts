/**
 * API Route: Box League Details
 * 
 * GET - Récupère les détails d'une Box League (classement, matchs)
 * PATCH - Met à jour le statut (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import {
  getBoxLeagueById,
  getLeagueStandings,
  getLeagueMatches,
  updateBoxLeagueStatus,
  isPlayerRegistered,
} from '@/lib/box-leagues';
import type { BoxLeagueStatus } from '@/lib/box-leagues';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ leagueId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { leagueId } = await params;

    const league = await getBoxLeagueById(leagueId);
    if (!league) {
      return NextResponse.json({ error: 'Box League non trouvée' }, { status: 404 });
    }

    // Vérifier que la league appartient au club du joueur
    if (league.clubId !== player.clubId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer le classement
    const standings = await getLeagueStandings(leagueId);

    // Récupérer les matchs
    const matches = await getLeagueMatches(leagueId);

    // Vérifier si le joueur est inscrit
    const isRegistered = await isPlayerRegistered(leagueId, player.id);

    // Récupérer les matchs du joueur
    const myMatches = isRegistered
      ? await getLeagueMatches(leagueId, player.id)
      : [];

    return NextResponse.json({
      league,
      standings,
      matches,
      myMatches,
      isRegistered,
    });
  } catch (error) {
    console.error('Error fetching box league details:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des détails' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier les Box Leagues' },
        { status: 403 }
      );
    }

    const { leagueId } = await params;
    const body = await request.json();
    const { status } = body as { status: BoxLeagueStatus };

    if (!status) {
      return NextResponse.json(
        { error: 'Statut requis' },
        { status: 400 }
      );
    }

    const validStatuses: BoxLeagueStatus[] = ['draft', 'registration', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    await updateBoxLeagueStatus(leagueId, status);

    return NextResponse.json({
      success: true,
      message: `Statut mis à jour: ${status}`,
    });
  } catch (error) {
    console.error('Error updating box league status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}
