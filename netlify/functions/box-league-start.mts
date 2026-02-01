/**
 * Netlify Scheduled Function: Box League Auto-Start
 * 
 * This function runs every hour (at minute 30) to automatically:
 * 1. Detect Box Leagues whose registration deadline has passed
 * 2. Adapt pool count based on actual participant count
 * 3. Perform automatic pool draw
 * 4. Generate matches and set status to "active"
 * 5. Notify all participants
 * 
 * Schedule: Every hour at minute 30
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

  console.log(`[Scheduled] Triggering box-league-start at ${new Date().toISOString()}`);
  console.log(`[Scheduled] Target URL: ${siteUrl}/api/cron/box-league-start`);

  try {
    const response = await fetch(`${siteUrl}/api/cron/box-league-start`, {
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
      error: 'Failed to trigger box-league-start',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Schedule: Every hour at minute 30 (to avoid overlapping with other crons)
export const config: Config = {
  schedule: "30 * * * *",
};
