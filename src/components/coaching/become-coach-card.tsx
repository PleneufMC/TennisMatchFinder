'use client';

import { useState } from 'react';
import { GraduationCap, Check, Loader2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CoachProfileDTO } from './types';

interface BecomeCoachCardProps {
  hasProfile: boolean;
  subscriptionStatus: CoachProfileDTO['subscriptionStatus'];
}

const BENEFITS = [
  'Publiez vos créneaux de coaching (60 min)',
  'Gagnez en visibilité auprès des joueurs de votre club',
  'Gérez vos réservations (réservé → confirmé → effectué)',
  'Affichez votre tarif (paiement réglé en direct, hors plateforme)',
  'Sans engagement, résiliable à tout moment',
];

export function BecomeCoachCard({ hasProfile, subscriptionStatus }: BecomeCoachCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReactivation =
    hasProfile && (subscriptionStatus === 'canceled' || subscriptionStatus === 'incomplete');

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/coaching/subscribe', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Erreur lors de la création de la session');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50/60 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <CardTitle>Devenez coach sur TennisMatchFinder</CardTitle>
            <CardDescription>
              Publiez vos créneaux et développez votre activité de coaching.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">15&nbsp;€</span>
          <span className="text-muted-foreground">/ mois</span>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubscribe} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirection…
            </>
          ) : isReactivation ? (
            'Réactiver mon abonnement coach'
          ) : (
            'Devenir coach — 15 €/mois'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
