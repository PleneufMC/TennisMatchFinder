/**
 * API: Mon contexte coaching
 * GET - Renvoie le rôle de l'utilisateur courant vis-à-vis du coaching :
 *  - hasCoachProfile / subscription active
 *  - profil coach (si existant) + ses créneaux
 *  - stats (nb de cours effectués)
 *
 * Sert à alimenter la page /coaching (vue adaptative joueur/coach).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import {
  getCoachProfileByPlayer,
  getSlotsByCoach,
  countCompletedSlots,
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

    const profile = await getCoachProfileByPlayer(player.id);

    if (!profile) {
      return NextResponse.json({
        isCoach: false,
        subscriptionActive: false,
        profile: null,
        slots: [],
        completedCount: 0,
      });
    }

    const [slots, completedCount] = await Promise.all([
      getSlotsByCoach(player.id),
      countCompletedSlots(player.id),
    ]);

    return NextResponse.json({
      isCoach: true,
      subscriptionActive: isCoachSubscriptionActive(profile.subscriptionStatus),
      profile,
      slots,
      completedCount,
    });
  } catch (error) {
    console.error('Error fetching coaching context:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du contexte coaching' },
      { status: 500 }
    );
  }
}
