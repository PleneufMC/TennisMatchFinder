/**
 * API: Réservation d'un créneau de coaching (côté joueur).
 * POST - Réserve le créneau si encore ouvert (anti-collision en base).
 *        Le paiement du cours se fait HORS plateforme : le tarif est indicatif.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { bookCoachSlot } from '@/lib/coaching';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const slot = await bookCoachSlot(id, player.id);

    return NextResponse.json({ slot });
  } catch (error) {
    console.error('Error booking coach slot:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la réservation';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
