import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerPlayer } from '@/lib/auth-helpers';
import { ConversationList } from '@/components/messages/conversation-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Vos conversations privées',
};

export default async function MessagesPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Vos conversations privées avec les autres joueurs
        </p>
      </div>

      <ConversationList currentPlayerId={player.id} />
    </div>
  );
}
