/**
 * API Route: Match Now - Respond
 * 
 * POST - Répond à une disponibilité
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { respondToAvailability } from '@/lib/match-now';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { availabilityId, message } = body;

    if (!availabilityId) {
      return NextResponse.json(
        { error: 'ID de disponibilité requis' },
        { status: 400 }
      );
    }

    const response = await respondToAvailability(
      availabilityId,
      player.id,
      message
    );

    return NextResponse.json({
      success: true,
      response,
      message: 'Demande envoyée !',
    });
  } catch (error) {
    console.error('Error responding to availability:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
