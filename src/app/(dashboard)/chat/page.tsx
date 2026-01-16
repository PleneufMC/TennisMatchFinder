import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import { getServerPlayer } from '@/lib/auth-helpers';
import { getClubSectionsWithUnread } from '@/lib/db/queries';
import { ChatPageContent } from '@/components/chat/chat-page-content';

export const metadata: Metadata = {
  title: 'Chat du club',
  description: 'Discutez en temps réel avec les membres du club',
};

export default async function ChatPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Si le joueur n'a pas de club, afficher un message
  if (!player.clubId) {
    return (
      <ChatPageContent 
        sections={[]} 
        totalUnread={0} 
        isAdmin={false} 
        hasClub={false} 
      />
    );
  }

  // Récupérer les salons du club
  const sections = await getClubSectionsWithUnread(player.clubId, player.id);

  // Calculer le total des messages non lus
  const totalUnread = sections.reduce((sum, section) => sum + section.unreadCount, 0);

  return (
    <ChatPageContent 
      sections={sections} 
      totalUnread={totalUnread} 
      isAdmin={player.isAdmin ?? false} 
      hasClub={true} 
    />
  );
}
