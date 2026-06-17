/**
 * API: Créneaux de coaching
 * GET  - Liste les créneaux ouverts à venir (réservables par les joueurs).
 *        Query: ?clubId=... (optionnel, filtre par club). Sans param : tous clubs.
 * POST - Crée un créneau (réservé au coach avec abonnement actif).
 *        Body: { startTime: ISOString, priceCents?, location?, notes?, clubId? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import {
  getOpenSlots,
  getCoachProfileByPlayer,
  createCoachSlot,
  isCoachSubscriptionActive,
} from '@/lib/coaching';

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    const slots = await getOpenSlots(clubId || undefined);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching open coach slots:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des créneaux' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const profile = await getCoachProfileByPlayer(player.id);
    if (!profile) {
      return NextResponse.json(
        { error: 'Vous devez d\'abord créer un profil coach' },
        { status: 403 }
      );
    }
    if (!isCoachSubscriptionActive(profile.subscriptionStatus)) {
      return NextResponse.json(
        { error: 'Un abonnement coach actif est requis pour publier des créneaux' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { startTime, priceCents, location, notes, clubId } = body ?? {};

    if (!startTime) {
      return NextResponse.json({ error: 'La date du créneau est requise' }, { status: 400 });
    }

    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Date de créneau invalide' }, { status: 400 });
    }
    if (start.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'Le créneau doit être dans le futur' },
        { status: 400 }
      );
    }

    const slot = await createCoachSlot({
      coachProfileId: profile.id,
      coachPlayerId: player.id,
      clubId: clubId ?? undefined,
      startTime: start,
      priceCents: typeof priceCents === 'number' ? priceCents : undefined,
      location: location ?? undefined,
      notes: notes ?? undefined,
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error('Error creating coach slot:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création du créneau';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
