/**
 * API Route: Direct Conversations
 * 
 * GET - Get all conversations for the current user
 * POST - Create or get existing conversation with another player
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { directConversations, directMessages, players } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, or, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// GET: Get all conversations for current user
export async function GET(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get all conversations where user is a participant
    const conversations = await db
      .select({
        id: directConversations.id,
        participant1Id: directConversations.participant1Id,
        participant2Id: directConversations.participant2Id,
        lastMessageAt: directConversations.lastMessageAt,
        lastMessagePreview: directConversations.lastMessagePreview,
        unreadCount1: directConversations.unreadCount1,
        unreadCount2: directConversations.unreadCount2,
        createdAt: directConversations.createdAt,
      })
      .from(directConversations)
      .where(
        or(
          eq(directConversations.participant1Id, player.id),
          eq(directConversations.participant2Id, player.id)
        )
      )
      .orderBy(desc(directConversations.lastMessageAt));

    // Get participant info for each conversation
    const conversationsWithParticipants = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participant1Id === player.id 
          ? conv.participant2Id 
          : conv.participant1Id;
        
        const [otherParticipant] = await db
          .select({
            id: players.id,
            fullName: players.fullName,
            avatarUrl: players.avatarUrl,
            currentElo: players.currentElo,
          })
          .from(players)
          .where(eq(players.id, otherParticipantId));

        // Determine unread count for current user
        const unreadCount = conv.participant1Id === player.id 
          ? conv.unreadCount1 
          : conv.unreadCount2;

        return {
          id: conv.id,
          otherParticipant,
          lastMessageAt: conv.lastMessageAt,
          lastMessagePreview: conv.lastMessagePreview,
          unreadCount,
          createdAt: conv.createdAt,
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithParticipants,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des conversations' },
      { status: 500 }
    );
  }
}

// POST: Create or get existing conversation
const createConversationSchema = z.object({
  otherPlayerId: z.string().uuid('ID joueur invalide'),
});

export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createConversationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { otherPlayerId } = validation.data;

    // Can't message yourself
    if (otherPlayerId === player.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous envoyer un message à vous-même' },
        { status: 400 }
      );
    }

    // Check if other player exists
    const [otherPlayer] = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      })
      .from(players)
      .where(eq(players.id, otherPlayerId));

    if (!otherPlayer) {
      return NextResponse.json(
        { error: 'Joueur non trouvé' },
        { status: 404 }
      );
    }

    // Ensure participant1Id < participant2Id for uniqueness
    const sortedIds = [player.id, otherPlayerId].sort();
    const participant1Id = sortedIds[0]!;
    const participant2Id = sortedIds[1]!;

    // Check if conversation already exists
    const [existingConversation] = await db
      .select()
      .from(directConversations)
      .where(
        and(
          eq(directConversations.participant1Id, participant1Id),
          eq(directConversations.participant2Id, participant2Id)
        )
      );

    if (existingConversation) {
      return NextResponse.json({
        conversation: {
          id: existingConversation.id,
          otherParticipant: otherPlayer,
          isNew: false,
        },
      });
    }

    // Create new conversation
    const [newConversation] = await db
      .insert(directConversations)
      .values({
        participant1Id,
        participant2Id,
      })
      .returning();

    if (!newConversation) {
      return NextResponse.json(
        { error: 'Erreur lors de la cr\u00e9ation de la conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: newConversation.id,
        otherParticipant: otherPlayer,
        isNew: true,
      },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la conversation' },
      { status: 500 }
    );
  }
}
