/**
 * Sentry Client-side Configuration
 * 
 * This file configures the Sentry SDK for the browser (client-side).
 * Loaded when the page loads in the browser.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay for debugging
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        // Mask all text and inputs for privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration({
        // Track navigation
        enableInp: true,
      }),
    ],

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Ignore network errors that are common
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Ignore common non-actionable errors
        if (
          message.includes('network request failed') ||
          message.includes('failed to fetch') ||
          message.includes('load failed') ||
          message.includes('cancelled') ||
          message.includes('aborted')
        ) {
          return null;
        }
      }

      return event;
    },

    // Set user context when available
    beforeSendTransaction(event) {
      // Remove sensitive data from transactions
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}
