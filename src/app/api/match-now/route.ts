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
  getActiveAvailability,
  createMatchNowAvailability,
  cancelMatchNowAvailability,
  countAvailablePlayers,
} from '@/lib/match-now';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Si le joueur n'a pas de club
    if (!player.clubId) {
      return NextResponse.json({
        myAvailability: null,
        availablePlayers: [],
        totalAvailable: 0,
      });
    }

    // Récupérer ma disponibilité active
    const myAvailability = await getActiveAvailability(player.id);

    // Récupérer les joueurs disponibles dans mon club
    const availablePlayers = await getAvailablePlayers(
      player.clubId,
      player.id,
      player.currentElo
    );

    // Compter le nombre total de disponibles
    const totalAvailable = await countAvailablePlayers(player.clubId);

    return NextResponse.json({
      myAvailability,
      availablePlayers,
      totalAvailable,
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
