/**
 * API: Profil coach (infos publiques + visibilité).
 * PUT - Crée/met à jour le profil coach du membre courant.
 *       Body: { bio?, hourlyRateCents?, specialties?: string[], clubId?, isPublished? }
 *       La visibilité (isPublished) n'est applicable que si l'abonnement est actif.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import {
  upsertCoachProfile,
  setCoachPublished,
  getCoachProfileByPlayer,
  isCoachSubscriptionActive,
} from '@/lib/coaching';

export async function PUT(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { bio, hourlyRateCents, specialties, clubId, isPublished } = body ?? {};

    if (
      hourlyRateCents !== undefined &&
      hourlyRateCents !== null &&
      (typeof hourlyRateCents !== 'number' || hourlyRateCents < 0)
    ) {
      return NextResponse.json({ error: 'Tarif invalide' }, { status: 400 });
    }
    if (specialties !== undefined && !Array.isArray(specialties)) {
      return NextResponse.json({ error: 'Spécialités invalides' }, { status: 400 });
    }

    const profile = await upsertCoachProfile({
      playerId: player.id,
      clubId: clubId !== undefined ? clubId : player.clubId ?? null,
      bio,
      hourlyRateCents,
      specialties,
    });

    // Gérer la visibilité publique si demandée
    if (typeof isPublished === 'boolean') {
      if (isPublished && !isCoachSubscriptionActive(profile.subscriptionStatus)) {
        return NextResponse.json(
          {
            error:
              'Un abonnement coach actif est requis pour publier votre profil',
          },
          { status: 403 }
        );
      }
      await setCoachPublished(player.id, isPublished);
    }

    const updated = await getCoachProfileByPlayer(player.id);
    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error('Error upserting coach profile:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
