/**
 * API Route: POST /api/admin/push/broadcast
 * 
 * Send a push notification to all users (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { sendPushToUsers, isPushConfigured, PushNotifications } from '@/lib/push';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin rights
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    // Check if push is configured
    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: 'Les notifications push ne sont pas configurées' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, message, url } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Titre et message requis' },
        { status: 400 }
      );
    }

    // Get all unique user IDs with push subscriptions
    const subscriptions = await db
      .selectDistinct({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions);

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun utilisateur n\'a activé les notifications push',
        stats: { totalUsers: 0, sent: 0, failed: 0 },
      });
    }

    const userIds = subscriptions.map(s => s.userId);

    // Send notification to all users
    const result = await sendPushToUsers(
      userIds,
      PushNotifications.generic(title, message, url || '/notifications')
    );

    return NextResponse.json({
      success: true,
      message: `Notification envoyée à ${result.totalSent} appareil(s)`,
      stats: {
        totalUsers: userIds.length,
        sent: result.totalSent,
        failed: result.totalFailed,
        expired: result.totalExpired,
      },
    });
  } catch (error) {
    console.error('[API] Broadcast push error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET: Get stats about push subscriptions
export async function GET(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    // Get subscription stats
    const [stats] = await db
      .select({
        totalSubscriptions: sql<number>`count(*)::int`,
        uniqueUsers: sql<number>`count(distinct user_id)::int`,
      })
      .from(pushSubscriptions);

    return NextResponse.json({
      configured: isPushConfigured(),
      stats: {
        totalSubscriptions: stats?.totalSubscriptions || 0,
        uniqueUsers: stats?.uniqueUsers || 0,
      },
    });
  } catch (error) {
    console.error('[API] Get push stats error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
