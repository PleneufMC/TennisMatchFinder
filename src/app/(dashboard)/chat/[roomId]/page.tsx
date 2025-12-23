import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import { getServerPlayer } from '@/lib/auth-helpers';
import { getChatMessages, getChatRoomById, isPlayerInChatRoom, markChatAsRead, getPlayerById } from '@/lib/db/queries';
import { ChatRoom } from '@/components/chat/chat-room';
import { db } from '@/lib/db';
import { chatRoomMembers, players } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  return {
    title: 'Conversation',
    description: 'Discussion en temps réel',
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

  // Vérifier que le joueur est membre de la conversation
  const isMember = await isPlayerInChatRoom(roomId, player.id);
  if (!isMember) {
    redirect('/chat');
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

  // Trouver l'autre membre pour les conversations directes
  const otherMembers = membersPlayers.filter(m => m.id !== player.id);
  const chatTitle = room.isDirect
    ? otherMembers[0]?.fullName || 'Conversation'
    : room.name || `Groupe (${membersPlayers.length})`;

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
