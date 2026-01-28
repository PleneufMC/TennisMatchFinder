/**
 * API Route: Direct Conversation Messages
 * 
 * GET - Get messages for a conversation
 * POST - Send a message in a conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { directConversations, directMessages, players, notifications } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, and, or, desc, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import Pusher from 'pusher';
import { sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

// Initialize Pusher
const pusher = process.env.PUSHER_APP_ID ? new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
}) : null;

// GET: Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { conversationId } = params;
    const searchParams = request.nextUrl.searchParams;
    const before = searchParams.get('before'); // For pagination
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Verify user is a participant
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
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
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

    // Build messages query
    let messagesQuery = db
      .select({
        id: directMessages.id,
        content: directMessages.content,
        senderId: directMessages.senderId,
        readAt: directMessages.readAt,
        createdAt: directMessages.createdAt,
      })
      .from(directMessages)
      .where(eq(directMessages.conversationId, conversationId))
      .orderBy(desc(directMessages.createdAt))
      .limit(limit);

    // Add pagination if 'before' cursor is provided
    const messages = before
      ? await db
          .select({
            id: directMessages.id,
            content: directMessages.content,
            senderId: directMessages.senderId,
            readAt: directMessages.readAt,
            createdAt: directMessages.createdAt,
          })
          .from(directMessages)
          .where(
            and(
              eq(directMessages.conversationId, conversationId),
              lt(directMessages.createdAt, new Date(before))
            )
          )
          .orderBy(desc(directMessages.createdAt))
          .limit(limit)
      : await messagesQuery;

    // Mark messages as read
    const isParticipant1 = conversation.participant1Id === player.id;
    if (isParticipant1 && conversation.unreadCount1 > 0) {
      await db
        .update(directConversations)
        .set({ unreadCount1: 0, updatedAt: new Date() })
        .where(eq(directConversations.id, conversationId));
    } else if (!isParticipant1 && conversation.unreadCount2 > 0) {
      await db
        .update(directConversations)
        .set({ unreadCount2: 0, updatedAt: new Date() })
        .where(eq(directConversations.id, conversationId));
    }

    // Mark individual messages as read
    await db
      .update(directMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(directMessages.conversationId, conversationId),
          sql`${directMessages.senderId} != ${player.id}`,
          sql`${directMessages.readAt} IS NULL`
        )
      );

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherParticipant,
      },
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

// POST: Send a message
const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message vide').max(2000, 'Message trop long (max 2000 caractères)'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { conversationId } = params;
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Verify user is a participant
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
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
    }

    // Insert message
    const [newMessage] = await db
      .insert(directMessages)
      .values({
        conversationId,
        senderId: player.id,
        content,
      })
      .returning();

    // Update conversation metadata
    const preview = content.length > 100 ? content.substring(0, 97) + '...' : content;
    const isParticipant1 = conversation.participant1Id === player.id;
    
    // Increment unread count for the other participant
    await db
      .update(directConversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: preview,
        // Increment unread for the recipient
        ...(isParticipant1 
          ? { unreadCount2: sql`${directConversations.unreadCount2} + 1` }
          : { unreadCount1: sql`${directConversations.unreadCount1} + 1` }
        ),
        updatedAt: new Date(),
      })
      .where(eq(directConversations.id, conversationId));

    // Get recipient info for notifications
    const recipientId = isParticipant1 
      ? conversation.participant2Id 
      : conversation.participant1Id;

    if (!newMessage) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du message' },
        { status: 500 }
      );
    }

    // Trigger Pusher event for real-time update
    if (pusher) {
      await pusher.trigger(`dm-${conversationId}`, 'new-message', {
        id: newMessage.id,
        content: newMessage.content,
        senderId: newMessage.senderId,
        senderName: player.fullName,
        createdAt: newMessage.createdAt,
      });

      // Also trigger on recipient's personal channel for unread count update
      await pusher.trigger(`user-${recipientId}`, 'dm-notification', {
        conversationId,
        senderId: player.id,
        senderName: player.fullName,
        preview,
      });
    }

    // Send push notification
    try {
      await sendPushToUser(recipientId, {
        title: `💬 ${player.fullName}`,
        body: preview,
        url: `/messages/${conversationId}`,
        tag: `dm-${conversationId}`,
      });
    } catch (pushError) {
      console.error('[Push] Error sending DM notification:', pushError);
    }

    // Create in-app notification
    await db.insert(notifications).values({
      userId: recipientId,
      type: 'direct_message',
      title: `💬 Nouveau message de ${player.fullName}`,
      message: preview,
      link: `/messages/${conversationId}`,
      data: {
        conversationId,
        senderId: player.id,
        senderName: player.fullName,
      },
    });

    return NextResponse.json({
      message: {
        id: newMessage.id,
        content: newMessage.content,
        senderId: newMessage.senderId,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}
