'use client';

import Link from 'next/link';
import { MessageCircle, Hash, Bot, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';

interface Section {
  id: string;
  name: string | null;
  description: string | null;
  icon: string | null;
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderName?: string | null;
  } | null;
}

interface ChatPageContentProps {
  sections: Section[];
  totalUnread: number;
  isAdmin: boolean;
  hasClub: boolean;
}

export function ChatPageContent({ sections, totalUnread, isAdmin, hasClub }: ChatPageContentProps) {
  const { t } = useTranslations('chat');

  // Si le joueur n'a pas de club
  if (!hasClub) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('joinClub')}
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {t('noClub')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          {t('title')}
          {totalUnread > 0 && (
            <Badge variant="destructive" className="ml-2">
              {totalUnread} {totalUnread > 1 ? t('unreadPlural') : t('unread')}
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Info Agent IA */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
            <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">{t('aiAssistant')}</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('aiAssistantDesc')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Salons du club */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {t('chatRooms')}
          </CardTitle>
          <CardDescription>
            {t('chatRoomsDesc')}
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
                        {section.name || 'Chat'}
                      </span>
                      {section.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {section.unreadCount} {section.unreadCount > 1 ? t('newPlural') : t('new')}
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
                        <span className="font-medium">{section.lastMessage.senderName ?? t('member')}: </span>
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
              <h3 className="text-lg font-semibold mb-2">{t('noRooms')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('noRoomsDesc')}
              </p>
              {isAdmin && (
                <p className="text-sm text-muted-foreground">
                  {t('adminCreate')}{' '}
                  <Link href="/admin/sections" className="text-primary hover:underline">
                    {t('adminSections')}
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
          <span>{t('publicDiscussion')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <span>{t('aiAvailable')}</span>
        </div>
      </div>
    </div>
  );
}
