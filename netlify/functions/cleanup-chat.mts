import type { Config, Context } from '@netlify/functions';

/**
 * Netlify Scheduled Function
 * Nettoie les messages de chat de plus de 24h
 * 
 * Exécution : tous les jours à 3h du matin (UTC)
 */
export default async (req: Request, context: Context) => {
  const baseUrl = process.env.URL || 'https://tennismatchfinder.net';
  const cronSecret = process.env.CRON_SECRET;

  console.log('[Scheduled] Starting chat cleanup...');

  try {
    const response = await fetch(`${baseUrl}/api/cron/cleanup-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Scheduled] Cleanup failed:', result);
      return new Response(JSON.stringify({ error: 'Cleanup failed', details: result }), {
        status: 500,
      });
    }

    console.log('[Scheduled] Cleanup completed:', result);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('[Scheduled] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
    });
  }
};

// Configuration : exécution quotidienne à 3h UTC
export const config: Config = {
  schedule: '0 3 * * *', // Cron: minute hour day month weekday
};
