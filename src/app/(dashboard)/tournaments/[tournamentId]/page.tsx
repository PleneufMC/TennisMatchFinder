'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Calendar, 
  Users, 
  ArrowLeft,
  CheckCircle,
  Clock,
  Swords,
  Target,
  AlertCircle,
  Loader2,
  Crown,
  Trash2,
  Settings,
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
import { TournamentBracket, ParticipantsList } from '@/components/tournaments';
import type { Tournament, TournamentParticipant, TournamentBracket as BracketType } from '@/lib/tournaments/types';
import { format, formatDistanceToNow, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

// Helper pour parser les dates de manière sécurisée
function safeParseDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  try {
    const parsed = typeof date === 'string' ? new Date(date) : date;
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

// Helper pour formater une date de manière sécurisée
function safeFormat(date: Date | string | null | undefined, formatStr: string): string {
  const parsed = safeParseDate(date);
  if (!parsed) return '-';
  try {
    return format(parsed, formatStr, { locale: fr });
  } catch {
    return '-';
  }
}

interface PageParams {
  tournamentId: string;
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-500', icon: Clock },
  registration: { label: 'Inscriptions ouvertes', color: 'bg-green-500', icon: Users },
  seeding: { label: 'Tirage au sort', color: 'bg-amber-500', icon: Target },
  active: { label: 'En cours', color: 'bg-blue-500', icon: Swords },
  completed: { label: 'Terminé', color: 'bg-gray-400', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-500', icon: AlertCircle },
} as const;

type StatusConfigType = typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG];

const getStatusConfig = (status: string): StatusConfigType => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  return config ?? STATUS_CONFIG.draft;
};

export default function TournamentDetailPage({ params }: { params: PageParams }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showRegister = searchParams.get('register') === 'true';
  const paymentSuccess = searchParams.get('payment') === 'success';
  const paymentCancelled = searchParams.get('payment') === 'cancelled';

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(paymentSuccess);
  const [bracket, setBracket] = useState<BracketType | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [myParticipation, setMyParticipation] = useState<TournamentParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchTournamentDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tournaments/${params.tournamentId}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Tournoi non trouvé');
          } else {
            setError('Erreur lors du chargement');
          }
          return;
        }

        const data = await res.json();
        setTournament(data.tournament);
        setBracket(data.bracket);
        setParticipants(data.participants || []);
        setIsRegistered(data.isRegistered || false);
        setMyParticipation(data.myParticipation);
        
        // Vérifier si l'utilisateur est admin
        if (session?.user?.id) {
          try {
            const profileRes = await fetch('/api/profile');
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              setIsAdmin(profileData.isAdmin || false);
            }
          } catch {
            // Ignorer les erreurs de profil
          }
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    }

    fetchTournamentDetails();
  }, [params.tournamentId, session?.user?.id]);

  async function handleRegister() {
    if (!tournament) return;

    try {
      setRegistering(true);
      
      // Si tournoi payant, rediriger vers Stripe Checkout
      if (tournament.entryFee > 0) {
        const checkoutRes = await fetch(`/api/tournaments/${tournament.id}/checkout`, {
          method: 'POST',
        });

        if (!checkoutRes.ok) {
          const data = await checkoutRes.json();
          throw new Error(data.error || 'Erreur lors de la création du paiement');
        }

        const { checkoutUrl } = await checkoutRes.json();
        
        // Rediriger vers Stripe Checkout
        window.location.href = checkoutUrl;
        return;
      }
      
      // Tournoi gratuit : inscription directe
      const res = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Recharger les données
      const detailRes = await fetch(`/api/tournaments/${tournament.id}`);
      const data = await detailRes.json();
      setTournament(data.tournament);
      setParticipants(data.participants || []);
      setIsRegistered(true);
      setMyParticipation(data.myParticipation);

      // Supprimer le paramètre register de l'URL
      router.replace(`/tournaments/${tournament.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  }

  async function handleWithdraw() {
    if (!tournament) return;

    try {
      setRegistering(true);
      const res = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la désinscription');
      }

      // Recharger les données
      const detailRes = await fetch(`/api/tournaments/${tournament.id}`);
      const data = await detailRes.json();
      setTournament(data.tournament);
      setParticipants(data.participants || []);
      setIsRegistered(false);
      setMyParticipation(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  }

  async function handleDelete() {
    if (!tournament) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Rediriger vers la liste des tournois
      router.push('/tournaments');
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">{error || 'Tournoi non trouvé'}</h2>
            <Button asChild className="mt-4">
              <Link href="/tournaments">Retour aux Tournois</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(tournament.status);
  const StatusIcon = statusConfig.icon;
  const now = new Date();
  
  // Parser les dates de manière sécurisée
  const registrationStart = safeParseDate(tournament.registrationStart);
  const registrationEnd = safeParseDate(tournament.registrationEnd);
  const startDate = safeParseDate(tournament.startDate);
  
  const registrationOpen = tournament.status === 'registration' && 
    registrationStart && registrationEnd &&
    isAfter(now, registrationStart) &&
    isBefore(now, registrationEnd);
  const participantCount = participants.length;

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/tournaments">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux Tournois
        </Link>
      </Button>

      {/* Payment Success Alert */}
      {showPaymentSuccess && (
        <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Paiement reussi !</strong> Votre inscription au tournoi est confirmee.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Cancelled Alert */}
      {paymentCancelled && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Le paiement a ete annule. Vous pouvez reessayer en cliquant sur "S'inscrire".
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
              <Trophy className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{tournament.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Swords className="h-4 w-4" />
                <span>{tournament.maxParticipants} joueurs max</span>
                {(tournament.eloRangeMin || tournament.eloRangeMax) && (
                  <span className="text-sm">
                    • ELO: {tournament.eloRangeMin || '∞'} - {tournament.eloRangeMax || '∞'}
                  </span>
                )}
              </div>
            </div>
          </div>
          {tournament.description && (
            <p className="text-muted-foreground mt-2">{tournament.description}</p>
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
              {myParticipation?.seed && ` - Seed #${myParticipation.seed}`}
            </Badge>
          )}
          
          {/* Admin Actions */}
          {isAdmin && (tournament.status === 'draft' || tournament.status === 'registration' || tournament.status === 'cancelled') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer le tournoi ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le tournoi &quot;{tournament.name}&quot; et toutes ses données (participants, matchs) seront définitivement supprimés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Supprimer définitivement
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
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium text-sm">
              {safeFormat(tournament.startDate, 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Participants</p>
            <p className="font-medium">{participantCount} / {tournament.maxParticipants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Swords className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Format</p>
            <p className="font-medium text-sm">Best of {tournament.setsToWin * 2 - 1}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Seeding</p>
            <p className="font-medium text-sm">
              {tournament.seedingMethod === 'elo' ? 'Par ELO' : 'Aléatoire'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Alert */}
      {registrationOpen && !isRegistered && registrationEnd && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <Clock className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Inscriptions ouvertes jusqu&apos;au {safeFormat(tournament.registrationEnd, 'dd MMMM yyyy')}
              {registrationEnd && ` (${formatDistanceToNow(registrationEnd, { locale: fr, addSuffix: true })})`}
            </span>
            <Button onClick={handleRegister} disabled={registering} className="ml-4">
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tournament.entryFee > 0 ? 'Redirection...' : 'Inscription...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {tournament.entryFee > 0 
                    ? `S'inscrire (${(tournament.entryFee / 100).toFixed(0)}€)` 
                    : "S'inscrire"}
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Withdraw option during registration */}
      {isRegistered && tournament.status === 'registration' && (
        <Alert className="mb-6 border-primary bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Vous êtes inscrit à ce tournoi
              {myParticipation?.seed && ` (Tête de série #${myParticipation.seed})`}
            </span>
            <Button variant="outline" onClick={handleWithdraw} disabled={registering}>
              {registering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Se désinscrire'
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Winner Display */}
      {tournament.winnerId && (
        <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <Crown className="h-8 w-8 text-amber-500" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Vainqueur du tournoi</p>
                <p className="text-xl font-bold">
                  {participants.find(p => p.playerId === tournament.winnerId)?.player?.fullName || 'Champion'}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue={tournament.status === 'active' || tournament.status === 'completed' ? 'bracket' : 'participants'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bracket" className="gap-2">
            <Swords className="h-4 w-4" />
            Bracket
          </TabsTrigger>
          <TabsTrigger value="participants" className="gap-2">
            <Users className="h-4 w-4" />
            Participants
            <Badge variant="secondary" className="ml-1">{participantCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Bracket */}
        <TabsContent value="bracket">
          {bracket && bracket.rounds.length > 0 ? (
            <TournamentBracket bracket={bracket} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Swords className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Le bracket sera généré après la clôture des inscriptions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Participants */}
        <TabsContent value="participants">
          <ParticipantsList 
            participants={participants}
            showSeeds={tournament.status === 'active' || tournament.status === 'completed'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
