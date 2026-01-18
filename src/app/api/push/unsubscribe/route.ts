/**
 * API Route: POST /api/push/unsubscribe
 * 
 * Unsubscribe from push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteSubscription, deleteUserSubscriptions } from '@/lib/push';

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

    // Parse request body
    const body = await request.json();
    const { endpoint, all } = body;

    if (all) {
      // Delete all subscriptions for user
      const result = await deleteUserSubscriptions(session.user.id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Erreur lors de la suppression' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Toutes les notifications push désactivées',
      });
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint requis' },
        { status: 400 }
      );
    }

    // Delete specific subscription
    const result = await deleteSubscription(endpoint);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications push désactivées pour cet appareil',
    });
  } catch (error) {
    console.error('[API] Push unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
