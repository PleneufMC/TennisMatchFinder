import type { Config, Context } from '@netlify/functions';

/**
 * Netlify Scheduled Function
 * Envoie des rappels pour les matchs en attente de confirmation (après 6h)
 * 
 * Exécution : Toutes les heures
 */
export default async (req: Request, context: Context) => {
  const baseUrl = process.env.URL || 'https://tennismatchfinder.net';
  const cronSecret = process.env.CRON_SECRET;

  console.log('[Scheduled] Starting match reminders job...');

  if (!cronSecret) {
    console.error('[Scheduled] CRON_SECRET not configured');
    return new Response(
      JSON.stringify({ error: 'CRON_SECRET not configured' }), 
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${baseUrl}/api/cron/match-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Scheduled] Match reminders failed:', result);
      return new Response(
        JSON.stringify({ error: 'Match reminders failed', details: result }), 
        { status: 500 }
      );
    }

    console.log('[Scheduled] Match reminders completed:', result);
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

// Configuration : exécution toutes les heures à la minute 30
export const config: Config = {
  schedule: '30 * * * *', // Cron: chaque heure à minute 30
};
