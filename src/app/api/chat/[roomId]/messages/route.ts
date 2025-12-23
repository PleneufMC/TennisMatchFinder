import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getChatMessages, sendChatMessage, isPlayerInChatRoom, markChatAsRead } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const player = await getServerPlayer();
    
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { roomId } = await params;

    // Vérifier que le joueur est membre de la conversation
    const isMember = await isPlayerInChatRoom(roomId, player.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les messages
    const messages = await getChatMessages(roomId, { limit: 100 });

    // Marquer comme lus
    await markChatAsRead(roomId, player.id);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const player = await getServerPlayer();
    
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { roomId } = await params;

    // Vérifier que le joueur est membre de la conversation
    const isMember = await isPlayerInChatRoom(roomId, player.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Contenu invalide' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message trop long (max 2000 caractères)' }, { status: 400 });
    }

    // Envoyer le message
    const message = await sendChatMessage(roomId, player.id, content.trim());

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}
