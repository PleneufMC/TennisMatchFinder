'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Calendar, 
  Users, 
  ArrowLeft,
  CheckCircle,
  Clock,
  Swords,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSession } from 'next-auth/react';
import { StandingsTable, MatchList } from '@/components/box-leagues';
import type { BoxLeague, BoxLeagueStanding, BoxLeagueMatch } from '@/lib/box-leagues/types';
import { format, formatDistanceToNow, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface PageParams {
  leagueId: string;
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-500', icon: Clock },
  registration: { label: 'Inscriptions ouvertes', color: 'bg-green-500', icon: Users },
  active: { label: 'En cours', color: 'bg-blue-500', icon: Swords },
  completed: { label: 'Terminée', color: 'bg-gray-400', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-red-500', icon: AlertCircle },
} as const;

type StatusConfigType = typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG];

const getStatusConfig = (status: string): StatusConfigType => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  return config ?? STATUS_CONFIG.draft;
};

export default function BoxLeagueDetailPage({ params }: { params: PageParams }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showRegister = searchParams.get('register') === 'true';

  const [league, setLeague] = useState<BoxLeague | null>(null);
  const [standings, setStandings] = useState<BoxLeagueStanding[]>([]);
  const [matches, setMatches] = useState<BoxLeagueMatch[]>([]);
  const [myMatches, setMyMatches] = useState<BoxLeagueMatch[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.player?.isAdmin || false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    }
    if (session) {
      checkAdmin();
    }
  }, [session]);

  useEffect(() => {
    async function fetchLeagueDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/box-leagues/${params.leagueId}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Box League non trouvée');
          } else {
            setError('Erreur lors du chargement');
          }
          return;
        }

        const data = await res.json();
        setLeague(data.league);
        setStandings(data.standings || []);
        setMatches(data.matches || []);
        setMyMatches(data.myMatches || []);
        setIsRegistered(data.isRegistered || false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    }

    fetchLeagueDetails();
  }, [params.leagueId]);

  async function handleRegister() {
    if (!league) return;

    try {
      setRegistering(true);
      const res = await fetch(`/api/box-leagues/${league.id}/register`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Recharger les données
      const detailRes = await fetch(`/api/box-leagues/${league.id}`);
      const data = await detailRes.json();
      setLeague(data.league);
      setStandings(data.standings || []);
      setIsRegistered(true);

      // Supprimer le paramètre register de l'URL
      router.replace(`/box-leagues/${league.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  }

  async function handleDelete() {
    if (!league) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/box-leagues/${league.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      router.push('/box-leagues');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-5xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">{error || 'Box League non trouvée'}</h2>
            <Button asChild className="mt-4">
              <Link href="/box-leagues">Retour aux Box Leagues</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(league.status);
  const StatusIcon = statusConfig.icon;
  const registrationOpen = league.status === 'registration' && isBefore(new Date(), new Date(league.registrationDeadline));
  const myRank = standings.find(s => isRegistered)?.rank;
  const participantCount = standings.length;

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/box-leagues">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux Box Leagues
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30">
              <Trophy className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{league.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Division {league.division}</span>
                {(league.eloRangeMin || league.eloRangeMax) && (
                  <span className="text-sm">
                    ({league.eloRangeMin || '∞'} - {league.eloRangeMax || '∞'} ELO)
                  </span>
                )}
              </div>
            </div>
          </div>
          {league.description && (
            <p className="text-muted-foreground mt-2">{league.description}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge className={`${statusConfig.color} text-white`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
          {isRegistered && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Inscrit
            </Badge>
          )}
          {/* Bouton suppression admin */}
          {isAdmin && ['draft', 'registration', 'cancelled'].includes(league.status) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer la Box League ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La Box League "{league.name}" et toutes ses données (participants, matchs) seront supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      'Supprimer'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Période</p>
            <p className="font-medium text-sm">
              {format(new Date(league.startDate), 'dd MMM', { locale: fr })} - {format(new Date(league.endDate), 'dd MMM', { locale: fr })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Participants</p>
            <p className="font-medium">{participantCount} / {league.maxPlayers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-muted-foreground">Promotion</p>
            <p className="font-medium">{league.promotionSpots} place{league.promotionSpots > 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-5 w-5 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-muted-foreground">Relégation</p>
            <p className="font-medium">{league.relegationSpots} place{league.relegationSpots > 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Alert */}
      {registrationOpen && !isRegistered && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <Clock className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Inscriptions ouvertes jusqu'au {format(new Date(league.registrationDeadline), 'dd MMMM yyyy', { locale: fr })}
              {' '}({formatDistanceToNow(new Date(league.registrationDeadline), { locale: fr, addSuffix: true })})
            </span>
            <Button onClick={handleRegister} disabled={registering} className="ml-4">
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inscription...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  S'inscrire
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* My Position */}
      {isRegistered && myRank && (
        <Card className="mb-6 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-primary">{myRank}{myRank === 1 ? 'er' : 'ème'}</div>
                <div>
                  <p className="font-medium">Votre classement actuel</p>
                  <p className="text-sm text-muted-foreground">
                    {myRank <= league.promotionSpots && (
                      <span className="text-green-600 font-medium">Zone de promotion !</span>
                    )}
                    {myRank > participantCount - league.relegationSpots && myRank > league.promotionSpots && (
                      <span className="text-red-600 font-medium">Zone de relégation</span>
                    )}
                    {myRank > league.promotionSpots && myRank <= participantCount - league.relegationSpots && (
                      <span>Milieu de classement</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Matchs joués</p>
                <p className="font-bold">
                  {myMatches.filter(m => m.status === 'completed').length} / {myMatches.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue={isRegistered ? 'my-matches' : 'standings'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {isRegistered && (
            <TabsTrigger value="my-matches" className="gap-2">
              <Swords className="h-4 w-4" />
              Mes matchs
              <Badge variant="secondary" className="ml-1">{myMatches.length}</Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="standings" className="gap-2">
            <Trophy className="h-4 w-4" />
            Classement
          </TabsTrigger>
          <TabsTrigger value="all-matches" className="gap-2">
            <Calendar className="h-4 w-4" />
            Tous les matchs
            <Badge variant="secondary" className="ml-1">{matches.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* My Matches */}
        {isRegistered && (
          <TabsContent value="my-matches">
            <MatchList 
              matches={myMatches} 
              showActions={true}
            />
          </TabsContent>
        )}

        {/* Standings */}
        <TabsContent value="standings">
          {standings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun participant inscrit pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            <StandingsTable 
              standings={standings} 
              league={league}
            />
          )}
        </TabsContent>

        {/* All Matches */}
        <TabsContent value="all-matches">
          <MatchList matches={matches} />
        </TabsContent>
      </Tabs>

      {/* Points System Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Système de points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{league.pointsWin}</div>
              <div className="text-sm text-muted-foreground">Victoire</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{league.pointsDraw}</div>
              <div className="text-sm text-muted-foreground">Match nul</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{league.pointsLoss}</div>
              <div className="text-sm text-muted-foreground">Défaite</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{league.pointsForfeit}</div>
              <div className="text-sm text-muted-foreground">Forfait</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
