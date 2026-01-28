import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { directConversations, players } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { ConversationView } from '@/components/messages/conversation-view';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Conversation',
  description: 'Conversation privée',
};

interface Props {
  params: { conversationId: string };
}

export default async function ConversationPage({ params }: Props) {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  const { conversationId } = params;

  // Verify conversation exists and user is a participant
  const [conversation] = await db
    .select()
    .from(directConversations)
    .where(
      and(
        eq(directConversations.id, conversationId),
        or(
          eq(directConversations.participant1Id, player.id),
          eq(directConversations.participant2Id, player.id)
        )
      )
    );

  if (!conversation) {
    notFound();
  }

  // Get other participant info
  const otherParticipantId = conversation.participant1Id === player.id 
    ? conversation.participant2Id 
    : conversation.participant1Id;
  
  const [otherParticipant] = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      avatarUrl: players.avatarUrl,
      currentElo: players.currentElo,
    })
    .from(players)
    .where(eq(players.id, otherParticipantId));

  if (!otherParticipant) {
    notFound();
  }

  return (
    <ConversationView
      conversationId={conversationId}
      currentPlayer={{
        id: player.id,
        fullName: player.fullName,
        avatarUrl: player.avatarUrl,
      }}
      otherParticipant={otherParticipant}
    />
  );
}
