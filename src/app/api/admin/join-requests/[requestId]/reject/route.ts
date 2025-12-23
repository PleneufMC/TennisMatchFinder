import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { rejectJoinRequest } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { requestId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || undefined;

    const result = await rejectJoinRequest(requestId, player.id, reason);

    // TODO: Envoyer un email d'information au demandeur
    // await sendRejectionEmail(result.email, result.fullName, reason);

    return NextResponse.json({
      success: true,
      message: 'Demande refusée',
    });
  } catch (error) {
    console.error('Error rejecting join request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du refus' },
      { status: 500 }
    );
  }
}
