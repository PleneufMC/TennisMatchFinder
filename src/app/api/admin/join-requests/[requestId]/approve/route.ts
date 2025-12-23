import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { approveJoinRequest } from '@/lib/db/queries';

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

    const result = await approveJoinRequest(requestId, player.id);

    // TODO: Envoyer un email de bienvenue au nouveau membre
    // await sendWelcomeEmail(result.player.email, result.player.fullName);

    return NextResponse.json({
      success: true,
      message: 'Demande approuvée avec succès',
      player: {
        id: result.player.id,
        fullName: result.player.fullName,
      },
    });
  } catch (error) {
    console.error('Error approving join request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'approbation' },
      { status: 500 }
    );
  }
}
