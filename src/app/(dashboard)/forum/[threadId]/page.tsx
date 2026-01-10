import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pin, Lock, Bot, MessageCircle, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { forumThreads, forumReplies } from '@/lib/db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';
import { formatTimeAgo } from '@/lib/utils/dates';
import { FORUM_CATEGORIES } from '@/types/forum';
import { ReplyForm } from './reply-form';

export const dynamic = 'force-dynamic';

interface ThreadPageProps {
  params: Promise<{ threadId: string }>;
}

export async function generateMetadata({ params }: ThreadPageProps): Promise<Metadata> {
  const { threadId } = await params;
  
  const thread = await db.query.forumThreads.findFirst({
    where: eq(forumThreads.id, threadId),
  });

  return {
    title: thread?.title || 'Discussion',
    description: thread?.content.substring(0, 160) || 'Discussion du forum',
  };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Si le joueur n'a pas de club, il ne peut pas accéder aux threads
  if (!player.clubId) {
    redirect('/forum');
  }

  const { threadId } = await params;

  // Récupérer le thread avec l'auteur
  const thread = await db.query.forumThreads.findFirst({
    where: and(
      eq(forumThreads.id, threadId),
      eq(forumThreads.clubId, player.clubId)
    ),
    with: {
      author: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!thread) {
    notFound();
  }

  // Incrémenter le compteur de vues
  await db
    .update(forumThreads)
    .set({ viewCount: sql`${forumThreads.viewCount} + 1` })
    .where(eq(forumThreads.id, threadId));

  // Récupérer les réponses
  const replies = await db.query.forumReplies.findMany({
    where: eq(forumReplies.threadId, threadId),
    orderBy: [asc(forumReplies.createdAt)],
    with: {
      author: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  });

  const category = FORUM_CATEGORIES.find((c) => c.value === thread.category);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header avec retour */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forum">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {thread.isPinned && (
              <Badge variant="warning">
                <Pin className="h-3 w-3 mr-1" />
                Épinglé
              </Badge>
            )}
            {thread.isLocked && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Verrouillé
              </Badge>
            )}
            {thread.isBot && (
              <Badge variant="bot">
                <Bot className="h-3 w-3 mr-1" />
                Bot
              </Badge>
            )}
            <Badge variant="outline">
              {category?.icon} {category?.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Thread principal */}
      <Card>
        <CardHeader className="pb-4">
          <h1 className="text-2xl font-bold">{thread.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              {thread.isBot ? (
                <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
              ) : (
                <PlayerAvatar
                  src={thread.author?.avatarUrl}
                  name={thread.author?.fullName || 'Anonyme'}
                  size="sm"
                />
              )}
              <span className="font-medium">
                {thread.isBot ? 'TennisBot' : thread.author?.fullName || 'Anonyme'}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeAgo(thread.createdAt.toISOString())}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {thread.viewCount + 1} vues
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {thread.replyCount} réponses
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            {thread.content}
          </div>
        </CardContent>
      </Card>

      {/* Réponses */}
      {replies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {replies.length} réponse{replies.length > 1 ? 's' : ''}
          </h2>
          
          {replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="pt-4">
                <div className="flex gap-4">
                  {reply.isBot ? (
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  ) : (
                    <PlayerAvatar
                      src={reply.author?.avatarUrl}
                      name={reply.author?.fullName || 'Anonyme'}
                      size="md"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {reply.isBot ? 'TennisBot' : reply.author?.fullName || 'Anonyme'}
                      </span>
                      {reply.isBot && (
                        <Badge variant="bot" className="text-xs">Bot</Badge>
                      )}
                      {reply.isSolution && (
                        <Badge variant="success" className="text-xs">Solution</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(reply.createdAt.toISOString())}
                      </span>
                    </div>
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                      {reply.content}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulaire de réponse */}
      {!thread.isLocked ? (
        <ReplyForm threadId={thread.id} />
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Ce sujet est verrouillé. Vous ne pouvez plus y répondre.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
