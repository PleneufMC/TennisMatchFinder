/**
 * API: Transition de statut d'un créneau (côté coach propriétaire).
 * POST - Body: { action: 'confirm' | 'complete' }
 *   confirm  : booked    -> confirmed
 *   complete : confirmed -> completed (base des stats / avis)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { updateSlotStatusByCoach } from '@/lib/coaching';

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
    const body = await request.json();
    const action = body?.action;

    if (action !== 'confirm' && action !== 'complete') {
      return NextResponse.json(
        { error: 'Action invalide (confirm | complete attendu)' },
        { status: 400 }
      );
    }

    const slot = await updateSlotStatusByCoach(id, player.id, action);
    return NextResponse.json({ slot });
  } catch (error) {
    console.error('Error updating coach slot status:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
