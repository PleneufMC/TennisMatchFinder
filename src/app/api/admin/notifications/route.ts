import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player || !player.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, target } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Titre et message requis' }, { status: 400 });
    }

    // Récupérer les membres du club
    let whereClause = eq(players.clubId, player.clubId);
    if (target === 'active') {
      whereClause = and(eq(players.clubId, player.clubId), eq(players.isActive, true))!;
    }

    const members = await db
      .select({ id: players.id })
      .from(players)
      .where(whereClause);

    // Créer une notification pour chaque membre
    const notificationValues = members.map((member) => ({
      userId: member.id,
      type: 'announcement',
      title,
      message,
      data: { sentBy: player.fullName },
    }));

    if (notificationValues.length > 0) {
      await db.insert(notifications).values(notificationValues);
    }

    return NextResponse.json({ 
      success: true, 
      count: members.length 
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des notifications' },
      { status: 500 }
    );
  }
}
