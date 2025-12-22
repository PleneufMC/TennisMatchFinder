import { NextResponse, type NextRequest } from 'next/server';
import { applyInactivityDecay } from '@/lib/supabase/admin';

/**
 * POST /api/cron/inactivity-decay
 * Applique le decay d'inactivité aux joueurs inactifs
 * À appeler via un cron job (Netlify scheduled functions ou service externe)
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  // En production, utiliser un secret ou Netlify's event-based auth
  const authHeader = request.headers.get('Authorization');
  const expectedSecret = process.env.CRON_SECRET || process.env.N8N_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('Starting inactivity decay job...');
    const result = await applyInactivityDecay();
    console.log(`Inactivity decay completed. Processed ${result.processed} players.`);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Inactivity decay error:', error);
    return NextResponse.json(
      { error: 'Failed to apply inactivity decay' },
      { status: 500 }
    );
  }
}

/**
 * GET pour vérifier le statut (debug)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'inactivity-decay',
    description: 'Applies ELO decay to inactive players (3+ weeks without matches)',
  });
}
