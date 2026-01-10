import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { MessageCircle, Hash, Bot, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getClubSectionsWithUnread } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Chat du club
          </h1>
          <p className="text-muted-foreground">
            Rejoignez un club pour accéder aux salons de discussion
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Vous n&apos;êtes pas encore affilié à un club. 
              Rejoignez un club pour accéder au chat.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Récupérer les salons du club
  const sections = await getClubSectionsWithUnread(player.clubId, player.id);

  // Calculer le total des messages non lus
  const totalUnread = sections.reduce((sum, section) => sum + section.unreadCount, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          Chat du club
          {totalUnread > 0 && (
            <Badge variant="destructive" className="ml-2">
              {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground">
          Discutez en temps réel avec les autres membres
        </p>
      </div>

      {/* Info Agent IA */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
            <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Assistant IA</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Un assistant IA est présent dans les salons pour vous aider à trouver des partenaires, 
              répondre à vos questions sur le tennis et animer les discussions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Salons du club */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Salons de discussion
          </CardTitle>
          <CardDescription>
            Choisissez un salon pour rejoindre la conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  href={`/chat/${section.id}`}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border transition-all hover:shadow-md',
                    section.unreadCount > 0
                      ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                      : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                  )}
                >
                  {/* Icône */}
                  <div className="text-3xl flex-shrink-0">
                    {section.icon || '💬'}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-semibold',
                        section.unreadCount > 0 && 'text-primary'
                      )}>
                        {section.name}
                      </span>
                      {section.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {section.unreadCount} nouveau{section.unreadCount > 1 ? 'x' : ''}
                        </Badge>
                      )}
                    </div>
                    
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    )}

                    {section.lastMessage && (
                      <div className={cn(
                        'text-sm mt-2 p-2 rounded bg-muted/50 truncate',
                        section.unreadCount > 0 && 'bg-primary/10'
                      )}>
                        <span className="font-medium">{section.lastMessage.senderName ?? 'Membre'}: </span>
                        {section.lastMessage.content}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">Aucun salon disponible</h3>
              <p className="text-muted-foreground mb-4">
                Les salons de discussion n&apos;ont pas encore été créés.
              </p>
              {player.isAdmin && (
                <p className="text-sm text-muted-foreground">
                  En tant qu&apos;admin, vous pouvez créer les salons depuis{' '}
                  <Link href="/admin/sections" className="text-primary hover:underline">
                    Administration → Salons
                  </Link>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Légende */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Discussion publique</span>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <span>Assistant IA disponible</span>
        </div>
      </div>
    </div>
  );
}
