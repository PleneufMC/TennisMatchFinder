/**
 * API Route: POST /api/push/subscribe
 * 
 * Subscribe to push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveSubscription, getVapidPublicKey, isPushConfigured } from '@/lib/push';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Check if push is configured
    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: 'Les notifications push ne sont pas configurées' },
        { status: 503 }
      );
    }

    // Get player ID
    const player = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (player.length === 0) {
      return NextResponse.json(
        { error: 'Joueur non trouvé' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Subscription invalide' },
        { status: 400 }
      );
    }

    // Get user agent for device identification
    const userAgent = request.headers.get('user-agent') || undefined;

    // Save subscription
    const result = await saveSubscription(
      session.user.id,
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications push activées',
    });
  } catch (error) {
    console.error('[API] Push subscribe error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET: Return VAPID public key for client
export async function GET() {
  try {
    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: 'Les notifications push ne sont pas configurées', configured: false },
        { status: 503 }
      );
    }

    return NextResponse.json({
      publicKey: getVapidPublicKey(),
      configured: true,
    });
  } catch (error) {
    console.error('[API] Get VAPID key error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
