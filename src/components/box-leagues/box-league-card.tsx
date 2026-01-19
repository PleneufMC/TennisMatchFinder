'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { 
  Trophy, 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  ChevronRight,
  Target,
  Trash2,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { BoxLeague } from '@/lib/box-leagues/types';
import { formatDistanceToNow, format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BoxLeagueCardProps {
  league: BoxLeague;
  isRegistered?: boolean;
  myRank?: number;
  isAdmin?: boolean;
  onDeleted?: () => void;
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', variant: 'secondary' as const, color: 'bg-gray-500' },
  registration: { label: 'Inscriptions ouvertes', variant: 'default' as const, color: 'bg-green-500' },
  active: { label: 'En cours', variant: 'default' as const, color: 'bg-blue-500' },
  completed: { label: 'Terminée', variant: 'secondary' as const, color: 'bg-gray-400' },
  cancelled: { label: 'Annulée', variant: 'destructive' as const, color: 'bg-red-500' },
} as const;

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
};

export function BoxLeagueCard({ 
  league, 
  isRegistered, 
  myRank,
  isAdmin = false,
  onDeleted,
}: BoxLeagueCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Utiliser participantCount de la league (retourné par l'API)
  const participantCount = league.participantCount ?? 0;
  
  const statusConfig = getStatusConfig(league.status);
  const now = new Date();
  const registrationOpen = league.status === 'registration' && isBefore(now, new Date(league.registrationDeadline));
  const daysUntilStart = isAfter(new Date(league.startDate), now)
    ? formatDistanceToNow(new Date(league.startDate), { locale: fr, addSuffix: true })
    : null;
  
  const progressPercent = (participantCount / league.maxPlayers) * 100;
  const canDelete = isAdmin && ['draft', 'registration', 'cancelled'].includes(league.status);

  async function handleDelete() {
    try {
      setDeleting(true);
      const res = await fetch(`/api/box-leagues/${league.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setShowDeleteDialog(false);
      onDeleted?.();
      router.refresh();
    } catch (err: any) {
      console.error('Error deleting league:', err);
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{league.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <Target className="h-3 w-3" />
                Division {league.division}
                {league.eloRangeMin || league.eloRangeMax ? (
                  <span className="ml-1">
                    ({league.eloRangeMin || '∞'} - {league.eloRangeMax || '∞'} ELO)
                  </span>
                ) : null}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        {league.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{league.description}</p>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(league.startDate), 'dd MMM', { locale: fr })} - {format(new Date(league.endDate), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          {registrationOpen && (
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs">
                Inscriptions jusqu&apos;au {format(new Date(league.registrationDeadline), 'dd MMM', { locale: fr })}
              </span>
            </div>
          )}
        </div>

        {/* Participants Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              Participants
            </span>
            <span className="font-medium">{participantCount} / {league.maxPlayers}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          
          {/* Avatars des participants */}
          {league.participants && league.participants.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex -space-x-2">
                {league.participants.slice(0, 5).map((participant) => (
                  <div
                    key={participant.id}
                    className="relative h-7 w-7 rounded-full border-2 border-background overflow-hidden bg-muted"
                    title={`${participant.fullName} (${participant.currentElo} ELO)`}
                  >
                    {participant.avatarUrl ? (
                      <img
                        src={participant.avatarUrl}
                        alt={participant.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {participant.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {participantCount > 5 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{participantCount - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* User Status */}
        {isRegistered && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-sm">
            {myRank ? (
              <>
                {myRank <= league.promotionSpots ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : myRank > (participantCount - league.relegationSpots) ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Target className="h-4 w-4 text-primary" />
                )}
                <span>
                  Vous êtes <strong>{myRank}{myRank === 1 ? 'er' : 'ème'}</strong>
                  {myRank <= league.promotionSpots && ' - Zone de promotion'}
                  {myRank > (participantCount - league.relegationSpots) && ' - Zone de relégation'}
                </span>
              </>
            ) : (
              <span className="text-green-600 font-medium">✓ Inscrit</span>
            )}
          </div>
        )}

        {/* Countdown */}
        {daysUntilStart && league.status === 'registration' && (
          <div className="text-center text-sm text-muted-foreground">
            Début {daysUntilStart}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1">
            <Link href={`/box-leagues/${league.id}`}>
              {isRegistered ? 'Voir mes matchs' : 'Voir les détails'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          {registrationOpen && !isRegistered && (
            <Button variant="outline" asChild>
              <Link href={`/box-leagues/${league.id}?register=true`}>
                S&apos;inscrire
              </Link>
            </Button>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la Box League ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La Box League &quot;{league.name}&quot; et toutes ses données (participants, matchs) seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
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
    </Card>
  );
}
