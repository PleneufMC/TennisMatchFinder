/**
 * Sentry Edge Runtime Configuration
 * 
 * This file configures the Sentry SDK for Edge Runtime (middleware, edge API routes).
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,

    // Lower sample rate for edge
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Filter errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Ignore rate limiting responses (these are expected)
        if (message.includes('rate limit')) {
          return null;
        }
      }

      return event;
    },
  });
}
