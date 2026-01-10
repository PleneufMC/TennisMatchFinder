/**
 * API Route: Player Location
 * 
 * GET - Récupère la position du joueur
 * POST - Met à jour la position du joueur
 * DELETE - Supprime la position du joueur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const [playerData] = await db
      .select({
        latitude: players.latitude,
        longitude: players.longitude,
        city: players.city,
      })
      .from(players)
      .where(eq(players.id, player.id))
      .limit(1);

    return NextResponse.json({
      hasLocation: !!(playerData?.latitude && playerData?.longitude),
      latitude: playerData?.latitude || null,
      longitude: playerData?.longitude || null,
      city: playerData?.city || null,
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la position' },
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

    const body = await request.json();
    const { latitude, longitude, city } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude et longitude requises' },
        { status: 400 }
      );
    }

    // Valider les coordonnées
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Coordonnées invalides' },
        { status: 400 }
      );
    }

    // Mettre à jour la position
    await db
      .update(players)
      .set({
        latitude: lat.toFixed(8),
        longitude: lng.toFixed(8),
        city: city || null,
        updatedAt: new Date(),
      })
      .where(eq(players.id, player.id));

    return NextResponse.json({
      success: true,
      message: 'Position mise à jour',
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la position' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Supprimer la position
    await db
      .update(players)
      .set({
        latitude: null,
        longitude: null,
        updatedAt: new Date(),
      })
      .where(eq(players.id, player.id));

    return NextResponse.json({
      success: true,
      message: 'Position supprimée',
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la position' },
      { status: 500 }
    );
  }
}
