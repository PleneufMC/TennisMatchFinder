import type { Config, Context } from '@netlify/functions';

/**
 * Netlify Scheduled Function
 * Auto-valide les matchs non confirmés après 24h
 * 
 * Exécution : Toutes les heures
 */
export default async (req: Request, context: Context) => {
  const baseUrl = process.env.URL || 'https://tennismatchfinder.net';
  const cronSecret = process.env.CRON_SECRET;

  console.log('[Scheduled] Starting auto-validate matches job...');

  if (!cronSecret) {
    console.error('[Scheduled] CRON_SECRET not configured');
    return new Response(
      JSON.stringify({ error: 'CRON_SECRET not configured' }), 
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${baseUrl}/api/cron/auto-validate-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Scheduled] Auto-validate failed:', result);
      return new Response(
        JSON.stringify({ error: 'Auto-validate failed', details: result }), 
        { status: 500 }
      );
    }

    console.log('[Scheduled] Auto-validate completed:', result);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('[Scheduled] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500 }
    );
  }
};

// Configuration : exécution toutes les heures
export const config: Config = {
  schedule: '0 * * * *', // Cron: chaque heure à minute 0
};
