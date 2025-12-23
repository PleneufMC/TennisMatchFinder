import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getOrCreateDirectChat } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { clubId, player1Id, player2Id } = body;

    // Vérifier que le joueur crée une conversation pour lui-même
    if (player.id !== player1Id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Vérifier que le club correspond
    if (player.clubId !== clubId) {
      return NextResponse.json({ error: 'Club incorrect' }, { status: 403 });
    }

    // Créer ou récupérer la conversation directe
    const room = await getOrCreateDirectChat(clubId, player1Id, player2Id);

    return NextResponse.json({ roomId: room.id });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la conversation' },
      { status: 500 }
    );
  }
}
