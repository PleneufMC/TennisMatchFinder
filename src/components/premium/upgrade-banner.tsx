'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface UpgradeBannerProps {
  variant?: 'default' | 'compact' | 'inline';
  dismissible?: boolean;
  message?: string;
}

export function UpgradeBanner({
  variant = 'default',
  dismissible = true,
  message = 'Passez à Premium pour débloquer toutes les fonctionnalités',
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>{message}</span>
        <Link href="/pricing" className="text-primary hover:underline font-medium">
          Passer à Premium
        </Link>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">{message}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href="/pricing">Upgrade</Link>
          </Button>
          {dismissible && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Passez à Premium</h3>
          </div>
          <p className="text-muted-foreground mb-4 max-w-md">
            Débloquez les suggestions illimitées, les statistiques avancées, 
            l&apos;accès complet au forum et bien plus encore.
          </p>
          <Button asChild>
            <Link href="/pricing" className="gap-2">
              Voir les offres
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {dismissible && (
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
