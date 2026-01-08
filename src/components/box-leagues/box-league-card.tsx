'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  ChevronRight,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import type { BoxLeague } from '@/lib/box-leagues/types';
import { formatDistanceToNow, format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BoxLeagueCardProps {
  league: BoxLeague;
  participantCount?: number;
  isRegistered?: boolean;
  myRank?: number;
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

export function BoxLeagueCard({ league, participantCount = 0, isRegistered, myRank }: BoxLeagueCardProps) {
  const statusConfig = getStatusConfig(league.status);
  const now = new Date();
  const registrationOpen = league.status === 'registration' && isBefore(now, new Date(league.registrationDeadline));
  const daysUntilStart = isAfter(new Date(league.startDate), now)
    ? formatDistanceToNow(new Date(league.startDate), { locale: fr, addSuffix: true })
    : null;
  
  const progressPercent = (participantCount / league.maxPlayers) * 100;

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
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
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
                Inscriptions jusqu'au {format(new Date(league.registrationDeadline), 'dd MMM', { locale: fr })}
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
                S'inscrire
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
