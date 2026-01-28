/**
 * Netlify Scheduled Function: Mark Abandoned Signups
 * 
 * This function runs every hour to mark signup attempts as "abandoned"
 * if they haven't been completed within 1 hour.
 * 
 * Schedule: Every hour at minute 15
 */

import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://tennismatchfinder.net';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Scheduled] CRON_SECRET not configured');
    return new Response(JSON.stringify({ error: 'CRON_SECRET not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`[Scheduled] Triggering mark-abandoned-signups at ${new Date().toISOString()}`);
  console.log(`[Scheduled] Target URL: ${siteUrl}/api/cron/mark-abandoned-signups`);

  try {
    const response = await fetch(`${siteUrl}/api/cron/mark-abandoned-signups`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log(`[Scheduled] Response status: ${response.status}`);
    console.log(`[Scheduled] Response:`, JSON.stringify(data));

    return new Response(JSON.stringify({
      success: response.ok,
      triggeredAt: new Date().toISOString(),
      apiResponse: data,
    }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Scheduled] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to trigger mark-abandoned-signups',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Schedule: Every hour at minute 15
export const config: Config = {
  schedule: "15 * * * *",
};
