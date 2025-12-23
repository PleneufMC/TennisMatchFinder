import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { forumThreads, forumReplies, forumReactions, players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Webhook pour les actions du bot N8N
 * POST /api/webhooks/n8n-bot
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const secret = request.headers.get('X-Webhook-Secret');
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create_thread':
        return handleCreateThread(data);
      case 'reply_thread':
        return handleReplyThread(data);
      case 'add_reaction':
        return handleAddReaction(data);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in N8N webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCreateThread(data: {
  clubId: string;
  title: string;
  content: string;
  category?: string;
}) {
  const { clubId, title, content, category = 'annonces' } = data;

  const result = await db.insert(forumThreads).values({
    clubId,
    title,
    content,
    category: category as any,
    isBot: true,
    authorId: null,
  }).returning();

  const thread = result[0];
  if (!thread) {
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    threadId: thread.id,
  });
}

async function handleReplyThread(data: {
  threadId: string;
  content: string;
}) {
  const { threadId, content } = data;

  // Vérifier que le thread existe
  const thread = await db
    .select()
    .from(forumThreads)
    .where(eq(forumThreads.id, threadId))
    .limit(1);

  const existingThread = thread[0];
  if (!existingThread) {
    return NextResponse.json(
      { error: 'Thread not found' },
      { status: 404 }
    );
  }

  // Créer la réponse
  const result = await db.insert(forumReplies).values({
    threadId,
    content,
    isBot: true,
    authorId: null,
  }).returning();

  // Mettre à jour le compteur de réponses
  await db
    .update(forumThreads)
    .set({
      replyCount: existingThread.replyCount + 1,
      lastReplyAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(forumThreads.id, threadId));

  const reply = result[0];
  if (!reply) {
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    replyId: reply.id,
  });
}

async function handleAddReaction(data: {
  targetType: 'thread' | 'reply';
  targetId: string;
  emoji: string;
  botUserId?: string;
}) {
  const { targetType, targetId, emoji, botUserId } = data;

  // Le bot a besoin d'un userId pour les réactions
  // Utiliser un ID de bot prédéfini ou le premier admin du club
  let userId = botUserId;
  
  if (!userId) {
    const adminResult = await db
      .select()
      .from(players)
      .where(eq(players.isAdmin, true))
      .limit(1);
    
    const admin = adminResult[0];
    if (!admin) {
      return NextResponse.json(
        { error: 'No bot user ID provided and no admin found' },
        { status: 400 }
      );
    }
    userId = admin.id;
  }

  await db.insert(forumReactions).values({
    userId,
    targetType,
    targetId,
    emoji,
  });

  return NextResponse.json({
    success: true,
  });
}

/**
 * OPTIONS pour CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
    },
  });
}
