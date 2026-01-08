import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { forumThreads, players } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

// Schema de validation
const createThreadSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(200),
  content: z.string().min(10, 'Le contenu doit contenir au moins 10 caractères'),
  category: z.enum(['général', 'recherche-partenaire', 'résultats', 'équipement', 'annonces']),
  isPinned: z.boolean().optional().default(false),
});

// GET - Récupérer les threads du forum
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le joueur et son club
    const player = await db.query.players.findFirst({
      where: eq(players.id, session.user.id),
    });

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Construire la requête
    const whereClause = category
      ? and(
          eq(forumThreads.clubId, player.clubId),
          eq(forumThreads.category, category as typeof forumThreads.category.enumValues[number])
        )
      : eq(forumThreads.clubId, player.clubId);

    const threads = await db.query.forumThreads.findMany({
      where: whereClause,
      orderBy: [desc(forumThreads.isPinned), desc(forumThreads.createdAt)],
      limit: 50,
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

    return NextResponse.json(threads);
  } catch (error) {
    console.error('Erreur lors de la récupération des threads:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau thread
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le joueur
    const player = await db.query.players.findFirst({
      where: eq(players.id, session.user.id),
    });

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    // Parser et valider les données
    const body = await request.json();
    const validatedData = createThreadSchema.parse(body);

    // Vérifier les permissions pour épingler (admin seulement)
    if (validatedData.isPinned && !player.isAdmin) {
      validatedData.isPinned = false;
    }

    // Créer le thread
    const [newThread] = await db
      .insert(forumThreads)
      .values({
        clubId: player.clubId,
        authorId: player.id,
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category,
        isPinned: validatedData.isPinned,
        isLocked: false,
        isBot: false,
        viewCount: 0,
        replyCount: 0,
      })
      .returning();

    return NextResponse.json(newThread, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du thread:', error);
    
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
