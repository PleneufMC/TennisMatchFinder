import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { MessageCircle, Plus, Users, Hash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getChatRoomsForPlayer, getClubSectionsWithUnread } from '@/lib/db/queries';
import { formatTimeAgo } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Discutez avec les autres membres du club',
};

export default async function ChatPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer les sections du club et les conversations privées
  const [sections, chatRooms] = await Promise.all([
    getClubSectionsWithUnread(player.clubId, player.id),
    getChatRoomsForPlayer(player.id),
  ]);

  // Filtrer les conversations privées (exclure les sections)
  const privateChats = chatRooms.filter(room => !room.isSection);

  // Calculer le total des messages non lus
  const sectionsUnread = sections.reduce((sum, section) => sum + section.unreadCount, 0);
  const privateUnread = privateChats.reduce((sum, room) => sum + room.unreadCount, 0);
  const totalUnread = sectionsUnread + privateUnread;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Messages
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Discutez avec les autres membres du club
          </p>
        </div>
        <Button asChild>
          <Link href="/chat/nouveau">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle conversation
          </Link>
        </Button>
      </div>

      {/* Salons du club (Sections) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Salons du club
            {sectionsUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {sectionsUnread}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Discussions ouvertes à tous les membres
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  href={`/chat/${section.id}`}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border transition-colors',
                    section.unreadCount > 0
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                      : 'hover:bg-muted/50'
                  )}
                >
                  {/* Icône */}
                  <div className="text-2xl flex-shrink-0">
                    {section.icon || '💬'}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium truncate',
                        section.unreadCount > 0 && 'font-bold'
                      )}>
                        {section.name}
                      </span>
                      {section.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {section.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    {section.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {section.description}
                      </p>
                    )}

                    {section.lastMessage && (
                      <p className={cn(
                        'text-sm truncate mt-1',
                        section.unreadCount > 0
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}>
                        {section.lastMessage.content}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Hash className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Aucun salon disponible pour le moment
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversations privées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Conversations privées
            {privateUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {privateUnread}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {privateChats.length} conversation{privateChats.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {privateChats.length > 0 ? (
            <div className="space-y-2">
              {privateChats.map((room) => {
                // Pour les conversations directes, afficher l'autre membre
                const otherMembers = room.members.filter(m => m.id !== player.id);
                const displayName = room.isDirect
                  ? otherMembers[0]?.fullName || 'Conversation'
                  : room.name || `Groupe (${room.members.length})`;
                const displayAvatar = room.isDirect
                  ? otherMembers[0]?.avatarUrl
                  : undefined;

                return (
                  <Link
                    key={room.id}
                    href={`/chat/${room.id}`}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                      room.unreadCount > 0
                        ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    {/* Avatar */}
                    {room.isDirect ? (
                      <PlayerAvatar
                        src={displayAvatar}
                        name={displayName}
                        size="lg"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-medium truncate',
                          room.unreadCount > 0 && 'font-bold'
                        )}>
                          {displayName}
                        </span>
                        {room.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {room.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      {room.lastMessage && (
                        <p className={cn(
                          'text-sm truncate mt-1',
                          room.unreadCount > 0
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}>
                          {room.lastMessage.content}
                        </p>
                      )}

                      {!room.isDirect && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {room.members.length} membre{room.members.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Timestamp */}
                    {room.lastMessage && (
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(room.lastMessage.createdAt.toISOString())}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Aucune conversation</h3>
              <p className="text-muted-foreground mb-4">
                Commencez à discuter avec d&apos;autres membres !
              </p>
              <Button asChild>
                <Link href="/chat/nouveau">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle conversation
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
