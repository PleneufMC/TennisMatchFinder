import { NextRequest, NextResponse } from 'next/server';
import { getInactivePlayers, createInactivityNotification } from '@/lib/db/queries';

/**
 * POST /api/cron/inactivity-reminder
 * 
 * Envoie des notifications de rappel aux joueurs inactifs depuis 7+ jours
 * 
 * Sécurité: Authentification par CRON_SECRET
 * Exécution: Quotidienne via Netlify Scheduled Function
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification CRON
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Inactivity Reminder] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'CRON not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Inactivity Reminder] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Inactivity Reminder] Starting inactivity check...');

    // Récupérer les joueurs inactifs depuis 7 jours
    const inactivePlayers = await getInactivePlayers(7, true);

    console.log(`[Inactivity Reminder] Found ${inactivePlayers.length} inactive players`);

    let notificationsSent = 0;
    const errors: string[] = [];

    // Envoyer les notifications
    for (const player of inactivePlayers) {
      try {
        // Calculer le nombre de jours depuis le dernier match
        const lastMatchDate = player.lastMatchAt 
          ? new Date(player.lastMatchAt) 
          : player.createdAt 
            ? new Date(player.createdAt) 
            : new Date();
        
        const daysSinceLastMatch = Math.floor(
          (Date.now() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        await createInactivityNotification(player.id, daysSinceLastMatch);
        notificationsSent++;

        console.log(
          `[Inactivity Reminder] Notification sent to ${player.fullName} (${daysSinceLastMatch} days inactive)`
        );
      } catch (error) {
        const errorMsg = `Failed to notify player ${player.id}: ${error}`;
        console.error(`[Inactivity Reminder] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        inactivePlayersFound: inactivePlayers.length,
        notificationsSent,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('[Inactivity Reminder] Completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Inactivity Reminder] Critical error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/inactivity-reminder
 * 
 * Endpoint de test pour vérifier la configuration
 * Retourne les statistiques sans envoyer de notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer les stats sans envoyer de notifications
    const inactivePlayers = await getInactivePlayers(7, true);

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      preview: {
        inactivePlayersCount: inactivePlayers.length,
        players: inactivePlayers.slice(0, 5).map(p => ({
          id: p.id,
          name: p.fullName,
          lastMatchAt: p.lastMatchAt,
          daysSinceLastMatch: p.lastMatchAt 
            ? Math.floor((Date.now() - new Date(p.lastMatchAt).getTime()) / (1000 * 60 * 60 * 24))
            : 'never',
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
