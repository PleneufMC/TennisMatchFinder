/**
 * Sentry Server-side Configuration
 * 
 * This file configures the Sentry SDK for the server (Node.js runtime).
 * Loaded when the application starts on the server.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,

    // Performance Monitoring - lower rate on server for cost
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Integrations
    integrations: [
      // Database query profiling (if using Prisma/Drizzle)
      Sentry.prismaIntegration(),
    ],

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Ignore known operational errors
        if (
          message.includes('rate limit') ||
          message.includes('unauthorized') ||
          message.includes('forbidden') ||
          message.includes('not found')
        ) {
          // Log but don't send to Sentry (expected errors)
          return null;
        }
      }

      // Scrub sensitive data
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }
        if (event.request.data) {
          // Remove potential sensitive fields
          const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'credit_card'];
          const data = event.request.data as Record<string, unknown>;
          for (const field of sensitiveFields) {
            if (data[field]) {
              data[field] = '[REDACTED]';
            }
          }
        }
      }

      return event;
    },
  });
}
