/**
 * API Route: Match Now
 * 
 * GET - Récupère les joueurs disponibles + ma disponibilité active
 * POST - Crée une nouvelle disponibilité
 * DELETE - Annule ma disponibilité active
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import {
  getAvailablePlayers,
  getAvailablePlayersByProximity,
  getActiveAvailability,
  createMatchNowAvailability,
  cancelMatchNowAvailability,
  countAvailablePlayers,
} from '@/lib/match-now';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'club'; // 'club' ou 'proximity'
    const radiusKm = parseInt(searchParams.get('radius') || '20', 10);

    // Récupérer ma disponibilité active
    const myAvailability = await getActiveAvailability(player.id);

    // Récupérer les coordonnées du joueur pour la recherche par proximité
    const [playerData] = await db
      .select({ latitude: players.latitude, longitude: players.longitude })
      .from(players)
      .where(eq(players.id, player.id))
      .limit(1);

    let availablePlayers: any[] = [];
    let totalAvailable = 0;

    if (mode === 'proximity' && playerData?.latitude && playerData?.longitude) {
      // Mode proximité : rechercher autour de ma position
      availablePlayers = await getAvailablePlayersByProximity(
        player.id,
        player.currentElo,
        parseFloat(playerData.latitude),
        parseFloat(playerData.longitude),
        radiusKm
      );
      totalAvailable = availablePlayers.length;
    } else if (player.clubId) {
      // Mode club : rechercher dans mon club uniquement
      availablePlayers = await getAvailablePlayers(
        player.clubId,
        player.id,
        player.currentElo
      );
      totalAvailable = await countAvailablePlayers(player.clubId);
    }

    return NextResponse.json({
      myAvailability,
      availablePlayers,
      totalAvailable,
      mode,
      hasLocation: !!(playerData?.latitude && playerData?.longitude),
    });
  } catch (error) {
    console.error('Error fetching match now data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
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

    if (!player.clubId) {
      return NextResponse.json({ error: 'Vous devez appartenir à un club' }, { status: 403 });
    }

    const body = await request.json();
    const { durationMinutes, message, gameTypes, eloMin, eloMax } = body;

    const availability = await createMatchNowAvailability({
      playerId: player.id,
      clubId: player.clubId,
      durationMinutes: durationMinutes || 120,
      message,
      gameTypes: gameTypes || ['simple'],
      eloMin,
      eloMax,
    });

    return NextResponse.json({
      success: true,
      availability,
      message: 'Vous êtes maintenant visible comme disponible !',
    });
  } catch (error) {
    console.error('Error creating availability:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la disponibilité' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer ma disponibilité active
    const myAvailability = await getActiveAvailability(player.id);
    if (!myAvailability) {
      return NextResponse.json(
        { error: 'Aucune disponibilité active' },
        { status: 404 }
      );
    }

    await cancelMatchNowAvailability(myAvailability.id, player.id);

    return NextResponse.json({
      success: true,
      message: 'Disponibilité annulée',
    });
  } catch (error) {
    console.error('Error canceling availability:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation' },
      { status: 500 }
    );
  }
}
