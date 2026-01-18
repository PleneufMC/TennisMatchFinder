'use client';

/**
 * Global Error Boundary
 * 
 * This component catches errors in the root layout and reports them to Sentry.
 * It's used as the last line of defense for unhandled errors.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Report to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Une erreur est survenue
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Nous sommes désolés, quelque chose s&apos;est mal passé. 
              Notre équipe a été notifiée et travaille à résoudre le problème.
            </p>

            {error.digest && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-6 font-mono">
                ID de l&apos;erreur: {error.digest}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={reset} variant="default" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
              
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Retour à l&apos;accueil
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
