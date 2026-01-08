'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Users, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchNowCard, MatchNowToggle } from '@/components/match-now';
import { usePlayer } from '@/hooks/use-player';

interface MatchNowAvailability {
  id: string;
  playerId: string;
  availableUntil: string;
  message: string | null;
  gameTypes: string[];
  isActive: boolean;
  player?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
}

interface MatchNowData {
  myAvailability: MatchNowAvailability | null;
  availablePlayers: MatchNowAvailability[];
  totalAvailable: number;
}

export default function MatchNowPage() {
  const router = useRouter();
  const { player, isLoading: playerLoading } = usePlayer();
  const [data, setData] = useState<MatchNowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/match-now');
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Impossible de charger les données');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleActivate = async (params: {
    durationMinutes: number;
    message?: string;
    gameTypes: string[];
  }) => {
    const response = await fetch('/api/match-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'activation');
    }

    await fetchData();
  };

  const handleDeactivate = async () => {
    const response = await fetch('/api/match-now', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la désactivation');
    }

    await fetchData();
  };

  const handleRespond = async (availabilityId: string, message: string) => {
    setRespondingTo(availabilityId);
    
    try {
      const response = await fetch('/api/match-now/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availabilityId, message }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      // Afficher un toast de succès
      alert('Demande envoyée ! Le joueur a été notifié.');
      
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setRespondingTo(null);
    }
  };

  if (playerLoading || isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      </div>
    );
  }

  if (!player) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-500" />
            Match Now
          </h1>
          <p className="text-muted-foreground">
            Trouvez un partenaire pour jouer maintenant
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Toggle de disponibilité */}
      <MatchNowToggle
        initialAvailability={data?.myAvailability}
        availableCount={data?.totalAvailable || 0}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
      />

      {/* Liste des joueurs disponibles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Joueurs disponibles
          </h2>
          {data && data.availablePlayers.length > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {data.availablePlayers.length} disponible{data.availablePlayers.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {data && data.availablePlayers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.availablePlayers.map((availability) => (
              <MatchNowCard
                key={availability.id}
                availability={availability}
                currentPlayerElo={player.currentElo}
                onRespond={handleRespond}
                isLoading={respondingTo === availability.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Personne n&apos;est disponible pour le moment</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Soyez le premier ! Activez votre disponibilité et les autres membres 
              avec un niveau similaire seront notifiés.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
