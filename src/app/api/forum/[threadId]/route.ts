import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { forumThreads, forumReplies, players } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

// Schema de validation pour les réponses
const createReplySchema = z.object({
  content: z.string().min(1, 'Le contenu ne peut pas être vide').max(10000),
  parentReplyId: z.string().uuid().optional(),
});

// Schema de validation pour la mise à jour du thread
const updateThreadSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

// GET - Récupérer un thread avec ses réponses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { threadId } = await params;

    // Récupérer le joueur
    const player = await db.query.players.findFirst({
      where: eq(players.id, session.user.id),
    });

    if (!player || !player.clubId) {
      return NextResponse.json({ error: 'Joueur non trouvé ou non affilié à un club' }, { status: 404 });
    }

    // Récupérer le thread
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
      return NextResponse.json({ error: 'Thread non trouvé' }, { status: 404 });
    }

    // Incrémenter le compteur de vues
    await db
      .update(forumThreads)
      .set({ viewCount: sql`${forumThreads.viewCount} + 1` })
      .where(eq(forumThreads.id, threadId));

    // Récupérer les réponses
    const replies = await db.query.forumReplies.findMany({
      where: eq(forumReplies.threadId, threadId),
      orderBy: (replies, { asc }) => [asc(replies.createdAt)],
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

    return NextResponse.json({ thread, replies });
  } catch (error) {
    console.error('Erreur lors de la récupération du thread:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter une réponse au thread
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { threadId } = await params;

    // Récupérer le joueur
    const player = await db.query.players.findFirst({
      where: eq(players.id, session.user.id),
    });

    if (!player || !player.clubId) {
      return NextResponse.json({ error: 'Joueur non trouvé ou non affilié à un club' }, { status: 404 });
    }

    // Vérifier que le thread existe et appartient au club
    const thread = await db.query.forumThreads.findFirst({
      where: and(
        eq(forumThreads.id, threadId),
        eq(forumThreads.clubId, player.clubId)
      ),
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread non trouvé' }, { status: 404 });
    }

    if (thread.isLocked) {
      return NextResponse.json({ error: 'Ce sujet est verrouillé' }, { status: 403 });
    }

    // Parser et valider les données
    const body = await request.json();
    const validatedData = createReplySchema.parse(body);

    // Créer la réponse
    const [newReply] = await db
      .insert(forumReplies)
      .values({
        threadId,
        authorId: player.id,
        content: validatedData.content,
        parentReplyId: validatedData.parentReplyId,
        isBot: false,
        isSolution: false,
      })
      .returning();

    // Mettre à jour le compteur de réponses et la date de dernière réponse
    await db
      .update(forumThreads)
      .set({
        replyCount: sql`${forumThreads.replyCount} + 1`,
        lastReplyAt: new Date(),
        lastReplyBy: player.id,
      })
      .where(eq(forumThreads.id, threadId));

    return NextResponse.json(newReply, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la réponse:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un thread (admin ou auteur)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { threadId } = await params;

    // Récupérer le joueur
    const player = await db.query.players.findFirst({
      where: eq(players.id, session.user.id),
    });

    if (!player || !player.clubId) {
      return NextResponse.json({ error: 'Joueur non trouvé ou non affilié à un club' }, { status: 404 });
    }

    // Récupérer le thread
    const thread = await db.query.forumThreads.findFirst({
      where: and(
        eq(forumThreads.id, threadId),
        eq(forumThreads.clubId, player.clubId)
      ),
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread non trouvé' }, { status: 404 });
    }

    // Vérifier les permissions
    const isAuthor = thread.authorId === player.id;
    const isAdmin = player.isAdmin;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Parser et valider les données
    const body = await request.json();
    const validatedData = updateThreadSchema.parse(body);

    // Seuls les admins peuvent épingler/verrouiller
    if (!isAdmin) {
      delete validatedData.isPinned;
      delete validatedData.isLocked;
    }

    // Mettre à jour le thread
    const [updatedThread] = await db
      .update(forumThreads)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(forumThreads.id, threadId))
      .returning();

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du thread:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un thread (admin ou auteur)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { threadId } = await params;

    // Récupérer le joueur
    const player = await db.query.players.findFirst({
      where: eq(players.id, session.user.id),
    });

    if (!player || !player.clubId) {
      return NextResponse.json({ error: 'Joueur non trouvé ou non affilié à un club' }, { status: 404 });
    }

    // Récupérer le thread
    const thread = await db.query.forumThreads.findFirst({
      where: and(
        eq(forumThreads.id, threadId),
        eq(forumThreads.clubId, player.clubId)
      ),
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread non trouvé' }, { status: 404 });
    }

    // Vérifier les permissions
    const isAuthor = thread.authorId === player.id;
    const isAdmin = player.isAdmin;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Supprimer le thread (les réponses sont supprimées en cascade)
    await db.delete(forumThreads).where(eq(forumThreads.id, threadId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du thread:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
