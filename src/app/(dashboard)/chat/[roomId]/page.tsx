import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import { getServerPlayer } from '@/lib/auth-helpers';
import { getChatMessages, getChatRoomById, isPlayerInChatRoom, markChatAsRead, joinClubSection } from '@/lib/db/queries';
import { ChatRoom } from '@/components/chat/chat-room';
import { db } from '@/lib/db';
import { chatRoomMembers, players } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  const { roomId } = await params;
  const room = await getChatRoomById(roomId);
  
  return {
    title: room?.isSection ? `# ${room.name}` : 'Conversation',
    description: room?.description || 'Discussion en temps réel',
  };
}

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  const { roomId } = await params;

  // Vérifier que la room existe
  const room = await getChatRoomById(roomId);
  if (!room) {
    notFound();
  }

  // Pour les sections de club, vérifier que le joueur appartient au même club
  // et l'ajouter automatiquement comme membre s'il ne l'est pas déjà
  if (room.isSection) {
    if (!player.clubId || room.clubId !== player.clubId) {
      // Le joueur n'a pas de club ou n'appartient pas au club de cette section
      redirect('/chat');
    }
    
    // Rejoindre automatiquement la section si pas encore membre
    const isMember = await isPlayerInChatRoom(roomId, player.id);
    if (!isMember) {
      await joinClubSection(roomId, player.id);
    }
  } else {
    // Pour les conversations privées, vérifier que le joueur est membre
    const isMember = await isPlayerInChatRoom(roomId, player.id);
    if (!isMember) {
      redirect('/chat');
    }
  }

  // Marquer les messages comme lus
  await markChatAsRead(roomId, player.id);

  // Récupérer les messages
  const messages = await getChatMessages(roomId, { limit: 100 });

  // Récupérer les membres de la conversation
  const membersData = await db
    .select({ playerId: chatRoomMembers.playerId })
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.roomId, roomId));
  
  const memberIds = membersData.map(m => m.playerId);
  const membersPlayers = memberIds.length > 0
    ? await db.select().from(players).where(inArray(players.id, memberIds))
    : [];

  // Déterminer le titre de la conversation
  let chatTitle: string;
  if (room.isSection) {
    chatTitle = `# ${room.name}`;
  } else if (room.isDirect) {
    const otherMembers = membersPlayers.filter(m => m.id !== player.id);
    chatTitle = otherMembers[0]?.fullName || 'Conversation';
  } else {
    chatTitle = room.name || `Groupe (${membersPlayers.length})`;
  }

  return (
    <ChatRoom
      room={room}
      messages={messages}
      currentPlayer={player}
      members={membersPlayers}
      chatTitle={chatTitle}
    />
  );
}
