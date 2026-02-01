/**
 * Netlify Scheduled Function: Process Account Deletions
 * 
 * This function runs daily at 3 AM to process account deletion requests
 * after the mandatory waiting period (RGPD compliance).
 * 
 * Schedule: Every day at 3 AM
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

  console.log(`[Scheduled] Triggering process-deletions at ${new Date().toISOString()}`);
  console.log(`[Scheduled] Target URL: ${siteUrl}/api/cron/process-deletions`);

  try {
    const response = await fetch(`${siteUrl}/api/cron/process-deletions`, {
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
      error: 'Failed to trigger process-deletions',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Schedule: Every day at 3 AM UTC
export const config: Config = {
  schedule: "0 3 * * *",
};
