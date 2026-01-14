import type { Config, Context } from '@netlify/functions';

/**
 * Netlify Scheduled Function
 * Envoie des rappels d'inactivité aux joueurs qui n'ont pas joué depuis 7 jours
 * 
 * Exécution : tous les jours à 10h du matin (UTC) - 11h heure française
 * Choix de l'horaire : moment où les joueurs consultent souvent leur téléphone
 */
export default async (req: Request, context: Context) => {
  const baseUrl = process.env.URL || 'https://tennismatchfinder.net';
  const cronSecret = process.env.CRON_SECRET;

  console.log('[Scheduled] Starting inactivity reminder job...');
  console.log(`[Scheduled] Base URL: ${baseUrl}`);

  if (!cronSecret) {
    console.error('[Scheduled] CRON_SECRET not configured');
    return new Response(
      JSON.stringify({ error: 'CRON_SECRET not configured' }), 
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${baseUrl}/api/cron/inactivity-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Scheduled] Inactivity reminder failed:', result);
      return new Response(
        JSON.stringify({ error: 'Inactivity reminder failed', details: result }), 
        { status: 500 }
      );
    }

    console.log('[Scheduled] Inactivity reminder completed:', result);
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

// Configuration : exécution quotidienne à 10h UTC (11h heure française)
export const config: Config = {
  schedule: '0 10 * * *', // Cron: minute hour day month weekday
};
