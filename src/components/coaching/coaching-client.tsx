'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { CoachingContext } from './types';
import { PlayerSlotsView } from './player-slots-view';
import { CoachDashboard } from './coach-dashboard';
import { BecomeCoachCard } from './become-coach-card';

export function CoachingClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ctx, setCtx] = useState<CoachingContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'info'; message: string } | null>(
    null
  );

  const fetchContext = useCallback(async () => {
    try {
      const res = await fetch('/api/coaching/me');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = (await res.json()) as CoachingContext;
      setCtx(data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger votre espace coaching');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Bannières retour Stripe Checkout
  useEffect(() => {
    if (searchParams.get('subscribed') === 'true') {
      setBanner({
        type: 'success',
        message:
          'Bienvenue parmi les coachs ! Votre abonnement est en cours d\'activation. Complétez votre profil et publiez vos premiers créneaux.',
      });
      router.replace('/coaching');
    } else if (searchParams.get('canceled') === 'true') {
      setBanner({
        type: 'info',
        message: 'Abonnement coach non finalisé. Vous pouvez réessayer quand vous le souhaitez.',
      });
      router.replace('/coaching');
    }
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const isActiveCoach = !!ctx?.isCoach && !!ctx?.subscriptionActive;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-green-600" />
            Coaching
          </h1>
          <p className="text-muted-foreground">
            Réservez un cours avec un coach, ou publiez vos créneaux en tant que coach.
          </p>
        </div>
        {isActiveCoach && (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Coach actif
          </Badge>
        )}
      </div>

      {banner && (
        <Alert variant={banner.type === 'success' ? 'default' : undefined}>
          {banner.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{banner.message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isActiveCoach ? (
        // ----- VUE COACH (abonnement actif) -----
        <Tabs defaultValue="coach" className="w-full">
          <TabsList>
            <TabsTrigger value="coach">Mon espace coach</TabsTrigger>
            <TabsTrigger value="browse">Réserver un cours</TabsTrigger>
          </TabsList>
          <TabsContent value="coach" className="mt-4">
            <CoachDashboard ctx={ctx!} onRefresh={fetchContext} />
          </TabsContent>
          <TabsContent value="browse" className="mt-4">
            <PlayerSlotsView />
          </TabsContent>
        </Tabs>
      ) : (
        // ----- VUE JOUEUR (+ CTA devenir coach) -----
        <div className="space-y-8">
          <PlayerSlotsView />
          <BecomeCoachCard
            hasProfile={!!ctx?.isCoach}
            subscriptionStatus={ctx?.profile?.subscriptionStatus ?? null}
          />
        </div>
      )}
    </div>
  );
}
