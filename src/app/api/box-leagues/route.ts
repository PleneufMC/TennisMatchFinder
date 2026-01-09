/**
 * API Route: Box Leagues
 * 
 * GET - Liste les Box Leagues du club (avec filtres optionnels)
 * POST - Crée une nouvelle Box League (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import {
  getBoxLeaguesByClub,
  createBoxLeague,
  getPlayerActiveLeagues,
} from '@/lib/box-leagues';
import type { BoxLeagueStatus } from '@/lib/box-leagues';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as BoxLeagueStatus | null;
    const myLeagues = searchParams.get('my') === 'true';

    let leagues: Awaited<ReturnType<typeof getBoxLeaguesByClub>> = [];
    try {
      if (myLeagues) {
        // Récupérer uniquement les leagues auxquelles le joueur participe
        leagues = await getPlayerActiveLeagues(player.id);
      } else {
        // Récupérer toutes les leagues du club
        leagues = await getBoxLeaguesByClub(player.clubId, status || undefined);
      }
    } catch (dbError) {
      // Si la table n'existe pas encore ou autre erreur DB, retourner un array vide
      console.error('Database error fetching box leagues:', dbError);
      leagues = [];
    }

    return NextResponse.json({ leagues });
  } catch (error) {
    console.error('Error fetching box leagues:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des Box Leagues' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier si le joueur est admin
    if (!player.isAdmin) {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des Box Leagues' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      startDate,
      endDate,
      registrationDeadline,
      minPlayers,
      maxPlayers,
      eloRangeMin,
      eloRangeMax,
      division,
      matchesPerPlayer,
      promotionSpots,
      relegationSpots,
    } = body;

    // Validation
    if (!name || !startDate || !endDate || !registrationDeadline) {
      return NextResponse.json(
        { error: 'Champs requis manquants: name, startDate, endDate, registrationDeadline' },
        { status: 400 }
      );
    }

    const league = await createBoxLeague({
      clubId: player.clubId,
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: new Date(registrationDeadline),
      minPlayers,
      maxPlayers,
      eloRangeMin,
      eloRangeMax,
      division,
      matchesPerPlayer,
      promotionSpots,
      relegationSpots,
      createdBy: player.id,
    });

    return NextResponse.json({
      success: true,
      league,
      message: 'Box League créée avec succès',
    });
  } catch (error) {
    console.error('Error creating box league:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la Box League' },
      { status: 500 }
    );
  }
}
