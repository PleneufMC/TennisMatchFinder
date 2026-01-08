import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications, players } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET - Récupérer les notifications de l'utilisateur
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Récupérer les notifications
    const whereClause = unreadOnly
      ? and(eq(notifications.userId, player.id), eq(notifications.isRead, false))
      : eq(notifications.userId, player.id);

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    // Compter les non lues
    const unreadCount = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, player.id), eq(notifications.isRead, false)));

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Marquer des notifications comme lues
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Marquer toutes comme lues
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, player.id));
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Marquer les notifications spécifiques comme lues
      for (const id of notificationIds) {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(and(eq(notifications.id, id), eq(notifications.userId, player.id)));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer des notifications
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (notificationId) {
      // Supprimer une notification spécifique
      await db
        .delete(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, player.id)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
