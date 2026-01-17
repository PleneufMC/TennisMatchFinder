'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Calendar, 
  Plus, 
  Users, 
  Sparkles,
  TrendingUp,
  Clock,
  Filter,
} from 'lucide-react';
import { BoxLeagueCard, CreateBoxLeagueDialog } from '@/components/box-leagues';
import { usePlayer } from '@/hooks/use-player';
import type { BoxLeague } from '@/lib/box-leagues/types';

export default function BoxLeaguesPage() {
  const { player } = usePlayer();
  const [leagues, setLeagues] = useState<BoxLeague[]>([]);
  const [myLeagues, setMyLeagues] = useState<BoxLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchLeagues() {
      try {
        setLoading(true);
        
        // Fetch toutes les leagues
        const [allRes, myRes] = await Promise.all([
          fetch('/api/box-leagues'),
          fetch('/api/box-leagues?my=true'),
        ]);

        if (allRes.ok) {
          const data = await allRes.json();
          setLeagues(data.leagues || []);
        }

        if (myRes.ok) {
          const data = await myRes.json();
          setMyLeagues(data.leagues || []);
        }
      } catch (error) {
        console.error('Erreur chargement Box Leagues:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeagues();
  }, []);

  // Filtrer les leagues par statut
  const registrationLeagues = leagues.filter(l => l.status === 'registration');
  const activeLeagues = leagues.filter(l => l.status === 'active');
  const completedLeagues = leagues.filter(l => l.status === 'completed');
  const myLeagueIds = new Set(myLeagues.map(l => l.id));

  const reloadLeagues = () => {
    // Recharger les donnees
    setLoading(true);
    Promise.all([
      fetch('/api/box-leagues').then(r => r.json()),
      fetch('/api/box-leagues?my=true').then(r => r.json()),
    ]).then(([allData, myData]) => {
      setLeagues(allData.leagues || []);
      setMyLeagues(myData.leagues || []);
    }).finally(() => setLoading(false));
  };

  const handleLeagueCreated = reloadLeagues;
  const handleLeagueDeleted = reloadLeagues;

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30">
              <Trophy className="h-8 w-8 text-amber-600" />
            </div>
            Box Leagues
          </h1>
          <p className="text-muted-foreground mt-1">
            Compétitions mensuelles par niveau avec promotion et relégation
          </p>
        </div>
        
        {/* Bouton creer Box League (admin seulement) */}
        {player?.isAdmin && player?.clubId && (
          <CreateBoxLeagueDialog 
            clubId={player.clubId} 
            onSuccess={handleLeagueCreated}
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
              <p className="text-2xl font-bold">{registrationLeagues.length}</p>
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
              <p className="text-2xl font-bold">{activeLeagues.length}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myLeagues.length}</p>
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
              <p className="text-2xl font-bold">{completedLeagues.length}</p>
              <p className="text-xs text-muted-foreground">Terminées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Comment ça marche ?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Poules de 4-6 joueurs organisées par niveau ELO</li>
                <li>• Organisez vos matchs librement pendant le mois</li>
                <li>• Top {'{N}'} promu en division supérieure, dernier relégué</li>
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
            Toutes
            <Badge variant="secondary" className="ml-1">{leagues.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="registration" className="gap-2">
            <Clock className="h-4 w-4" />
            Inscriptions
            <Badge variant="secondary" className="ml-1">{registrationLeagues.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Sparkles className="h-4 w-4" />
            En cours
            <Badge variant="secondary" className="ml-1">{activeLeagues.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="my" className="gap-2">
            <Trophy className="h-4 w-4" />
            Mes leagues
            <Badge variant="secondary" className="ml-1">{myLeagues.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Leagues */}
        <TabsContent value="all">
          {leagues.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {leagues.map(league => (
                <BoxLeagueCard 
                  key={league.id} 
                  league={league}
                  isRegistered={myLeagueIds.has(league.id)}
                  isAdmin={player?.isAdmin}
                  onDeleted={handleLeagueDeleted}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Registration Open */}
        <TabsContent value="registration">
          {registrationLeagues.length === 0 ? (
            <EmptyState message="Aucune Box League n'est ouverte aux inscriptions actuellement." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {registrationLeagues.map(league => (
                <BoxLeagueCard 
                  key={league.id} 
                  league={league}
                  isRegistered={myLeagueIds.has(league.id)}
                  isAdmin={player?.isAdmin}
                  onDeleted={handleLeagueDeleted}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Leagues */}
        <TabsContent value="active">
          {activeLeagues.length === 0 ? (
            <EmptyState message="Aucune Box League n'est actuellement en cours." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeLeagues.map(league => (
                <BoxLeagueCard 
                  key={league.id} 
                  league={league}
                  isRegistered={myLeagueIds.has(league.id)}
                  isAdmin={player?.isAdmin}
                  onDeleted={handleLeagueDeleted}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Leagues */}
        <TabsContent value="my">
          {myLeagues.length === 0 ? (
            <EmptyState 
              message="Vous n'êtes inscrit à aucune Box League."
              action={registrationLeagues.length > 0 ? (
                <Button onClick={() => setActiveTab('registration')}>
                  Voir les inscriptions ouvertes
                </Button>
              ) : undefined}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myLeagues.map(league => (
                <BoxLeagueCard 
                  key={league.id} 
                  league={league}
                  isRegistered={true}
                  isAdmin={player?.isAdmin}
                  onDeleted={handleLeagueDeleted}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message = "Aucune Box League disponible pour le moment.", action }: { message?: string; action?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">Aucune Box League</h3>
        <p className="text-muted-foreground mb-4">{message}</p>
        {action}
      </CardContent>
    </Card>
  );
}
