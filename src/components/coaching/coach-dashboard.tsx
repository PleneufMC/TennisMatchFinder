'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Settings2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CoachingContext } from './types';
import { CoachProfileForm } from './coach-profile-form';
import { CoachSlotsManager } from './coach-slots-manager';

interface CoachDashboardProps {
  ctx: CoachingContext;
  onRefresh: () => Promise<void> | void;
}

export function CoachDashboard({ ctx, onRefresh }: CoachDashboardProps) {
  const { toast } = useToast();
  const [openingPortal, setOpeningPortal] = useState(false);

  const handlePortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await fetch('/api/coaching/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Erreur');
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: 'Impossible d\'ouvrir la gestion d\'abonnement',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
      setOpeningPortal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statut abonnement + stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Abonnement coach actif
              </CardTitle>
              <CardDescription>
                Vous pouvez publier des créneaux et apparaître auprès des joueurs.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={openingPortal}>
              <CreditCard className="mr-2 h-4 w-4" />
              Gérer mon abonnement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-2xl font-bold">{ctx.completedCount}</p>
            <p className="text-muted-foreground">Cours effectués</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {ctx.slots.filter((s) => s.status === 'open').length}
            </p>
            <p className="text-muted-foreground">Créneaux ouverts</p>
          </div>
          <div className="flex items-center">
            <Badge variant={ctx.profile?.isPublished ? 'secondary' : 'outline'}>
              {ctx.profile?.isPublished ? 'Profil visible' : 'Profil masqué'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Mon profil coach
          </CardTitle>
          <CardDescription>
            Informations affichées aux joueurs (le tarif est indicatif, paiement hors plateforme).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoachProfileForm profile={ctx.profile} onSaved={onRefresh} />
        </CardContent>
      </Card>

      {/* Créneaux */}
      <CoachSlotsManager
        slots={ctx.slots}
        defaultPriceCents={ctx.profile?.hourlyRateCents ?? null}
        onChanged={onRefresh}
      />
    </div>
  );
}
