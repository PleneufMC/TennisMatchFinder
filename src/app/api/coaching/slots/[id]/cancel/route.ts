/**
 * API: Annulation d'un créneau de coaching (côté coach propriétaire).
 * POST - Passe le créneau en 'cancelled' et notifie le joueur s'il était réservé.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { cancelCoachSlot } from '@/lib/coaching';

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
    await cancelCoachSlot(id, player.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling coach slot:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de l\'annulation';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
