import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { MessageSquare, Plus, Pin, Lock, Bot, MessageCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getForumThreadsByClub, getThreadCategoryCount } from '@/lib/db/queries';
import { formatTimeAgo } from '@/lib/utils/dates';
import { FORUM_CATEGORIES } from '@/types/forum';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Forum',
  description: 'Échangez avec les membres de votre club',
};

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Si le joueur n'a pas de club
  if (!player.clubId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Forum
          </h1>
          <p className="text-muted-foreground">
            Rejoignez un club pour accéder au forum
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Vous n&apos;êtes pas encore affilié à un club. 
              Rejoignez un club pour participer aux discussions du forum.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const params = await searchParams;
  const selectedCategory = params.category;

  // Récupérer les threads du forum
  const threads = await getForumThreadsByClub(player.clubId, {
    category: selectedCategory,
    limit: 50,
  });

  // Compter les threads par catégorie
  const countByCategory = await getThreadCategoryCount(player.clubId);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Forum
          </h1>
          <p className="text-muted-foreground">
            Échangez avec les membres de votre club
          </p>
        </div>
        <Button asChild>
          <Link href="/forum/nouveau">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle discussion
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar - Catégories */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1 p-2">
                <Link
                  href="/forum"
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                    !selectedCategory
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <span>Toutes les discussions</span>
                  <Badge variant={!selectedCategory ? 'secondary' : 'outline'}>
                    {threads.length}
                  </Badge>
                </Link>
                {FORUM_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.value}
                    href={`/forum?category=${cat.value}`}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                      selectedCategory === cat.value
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    <Badge
                      variant={selectedCategory === cat.value ? 'secondary' : 'outline'}
                    >
                      {countByCategory[cat.value] || 0}
                    </Badge>
                  </Link>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Liste des threads */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCategory
                  ? FORUM_CATEGORIES.find((c) => c.value === selectedCategory)?.label
                  : 'Toutes les discussions'}
              </CardTitle>
              <CardDescription>
                {threads.length} discussion{threads.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threads.length > 0 ? (
                <div className="space-y-2">
                  {threads.map((thread) => {
                    const author = thread.author;
                    const category = FORUM_CATEGORIES.find((c) => c.value === thread.category);

                    return (
                      <Link
                        key={thread.id}
                        href={`/forum/${thread.id}`}
                        className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          {thread.isBot ? (
                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                          ) : (
                            <PlayerAvatar
                              src={author?.avatarUrl}
                              name={author?.fullName || 'Anonyme'}
                              size="md"
                            />
                          )}

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            {/* Badges */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {thread.isPinned && (
                                <Badge variant="warning" className="text-xs">
                                  <Pin className="h-3 w-3 mr-1" />
                                  Épinglé
                                </Badge>
                              )}
                              {thread.isLocked && (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Verrouillé
                                </Badge>
                              )}
                              {thread.isBot && (
                                <Badge variant="bot" className="text-xs">
                                  <Bot className="h-3 w-3 mr-1" />
                                  Bot
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {category?.icon} {category?.label}
                              </Badge>
                            </div>

                            {/* Titre */}
                            <h3 className="font-semibold truncate">{thread.title}</h3>

                            {/* Meta */}
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>
                                {thread.isBot ? 'TennisBot' : author?.fullName || 'Anonyme'}
                              </span>
                              <span>•</span>
                              <span>{formatTimeAgo(thread.createdAt.toISOString())}</span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{thread.replyCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{thread.viewCount}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">Aucune discussion</h3>
                  <p className="text-muted-foreground mb-4">
                    Soyez le premier à lancer une discussion !
                  </p>
                  <Button asChild>
                    <Link href="/forum/nouveau">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une discussion
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
