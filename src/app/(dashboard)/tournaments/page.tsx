'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Sparkles,
  Clock,
  Filter,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { TournamentCard, CreateTournamentDialog } from '@/components/tournaments';
import { usePlayer } from '@/hooks/use-player';
import type { Tournament } from '@/lib/tournaments/types';

export default function TournamentsPage() {
  const { player, isLoading: playerLoading } = usePlayer();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchTournaments() {
      // Attendre que le player soit chargé
      if (playerLoading) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [allRes, myRes] = await Promise.all([
          fetch('/api/tournaments'),
          fetch('/api/tournaments?my=true'),
        ]);

        if (allRes.ok) {
          const data = await allRes.json();
          setTournaments(data.tournaments || []);
        } else if (allRes.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
        } else {
          const errData = await allRes.json().catch(() => ({}));
          setError(errData.error || 'Erreur lors du chargement des tournois');
        }

        if (myRes.ok) {
          const data = await myRes.json();
          setMyTournaments(data.tournaments || []);
        }
      } catch (err) {
        console.error('Erreur chargement tournois:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    }

    fetchTournaments();
  }, [playerLoading]);

  // Filtrer les tournois par statut
  const registrationTournaments = tournaments.filter(t => t.status === 'registration');
  const activeTournaments = tournaments.filter(t => t.status === 'active');
  const completedTournaments = tournaments.filter(t => t.status === 'completed');
  const myTournamentIds = new Set(myTournaments.map(t => t.id));

  const handleTournamentCreated = () => {
    // Recharger les donnees
    setLoading(true);
    Promise.all([
      fetch('/api/tournaments').then(r => r.json()),
      fetch('/api/tournaments?my=true').then(r => r.json()),
    ]).then(([allData, myData]) => {
      setTournaments(allData.tournaments || []);
      setMyTournaments(myData.tournaments || []);
    }).finally(() => setLoading(false));
  };

  if (loading || playerLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <h2 className="font-semibold text-red-700 dark:text-red-400">Erreur</h2>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
              <Trophy className="h-8 w-8 text-purple-600" />
            </div>
            Tournois
          </h1>
          <p className="text-muted-foreground mt-1">
            Compétitions à élimination directe avec brackets automatiques
          </p>
        </div>
        
        {/* Bouton creer tournoi (admin seulement) */}
        {player?.isAdmin && player?.clubId && (
          <CreateTournamentDialog 
            clubId={player.clubId} 
            onSuccess={handleTournamentCreated}
          />
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{registrationTournaments.length}</p>
              <p className="text-xs text-muted-foreground">Inscriptions ouvertes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeTournaments.length}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Crown className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myTournaments.length}</p>
              <p className="text-xs text-muted-foreground">Mes participations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/30">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTournaments.length}</p>
              <p className="text-xs text-muted-foreground">Terminés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Comment ça marche ?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Inscrivez-vous pendant la période d'inscription</li>
                <li>• Le bracket est généré automatiquement selon votre ELO</li>
                <li>• Affrontez vos adversaires en élimination directe</li>
                <li>• Tous les matchs comptent pour votre classement ELO !</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="gap-2">
            <Filter className="h-4 w-4" />
            Tous
            <Badge variant="secondary" className="ml-1">{tournaments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="registration" className="gap-2">
            <Clock className="h-4 w-4" />
            Inscriptions
            <Badge variant="secondary" className="ml-1">{registrationTournaments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Sparkles className="h-4 w-4" />
            En cours
            <Badge variant="secondary" className="ml-1">{activeTournaments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="my" className="gap-2">
            <Crown className="h-4 w-4" />
            Mes tournois
            <Badge variant="secondary" className="ml-1">{myTournaments.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Tournaments */}
        <TabsContent value="all">
          {tournaments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map(tournament => (
                <TournamentCard 
                  key={tournament.id} 
                  tournament={tournament}
                  isRegistered={myTournamentIds.has(tournament.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Registration Open */}
        <TabsContent value="registration">
          {registrationTournaments.length === 0 ? (
            <EmptyState message="Aucun tournoi n'est ouvert aux inscriptions actuellement." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {registrationTournaments.map(tournament => (
                <TournamentCard 
                  key={tournament.id} 
                  tournament={tournament}
                  isRegistered={myTournamentIds.has(tournament.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Tournaments */}
        <TabsContent value="active">
          {activeTournaments.length === 0 ? (
            <EmptyState message="Aucun tournoi n'est actuellement en cours." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeTournaments.map(tournament => (
                <TournamentCard 
                  key={tournament.id} 
                  tournament={tournament}
                  isRegistered={myTournamentIds.has(tournament.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Tournaments */}
        <TabsContent value="my">
          {myTournaments.length === 0 ? (
            <EmptyState 
              message="Vous n'êtes inscrit à aucun tournoi."
              action={registrationTournaments.length > 0 ? (
                <Button onClick={() => setActiveTab('registration')}>
                  Voir les inscriptions ouvertes
                </Button>
              ) : undefined}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myTournaments.map(tournament => (
                <TournamentCard 
                  key={tournament.id} 
                  tournament={tournament}
                  isRegistered={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message = "Aucun tournoi disponible pour le moment.", action }: { message?: string; action?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">Aucun tournoi</h3>
        <p className="text-muted-foreground mb-4">{message}</p>
        {action}
      </CardContent>
    </Card>
  );
}
