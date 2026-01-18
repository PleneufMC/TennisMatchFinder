/**
 * Next.js Instrumentation
 * 
 * This file is used to initialize monitoring tools (like Sentry) when the server starts.
 * It's loaded once when the Next.js server starts.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import server config
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Import edge config
    await import('../sentry.edge.config');
  }
}
