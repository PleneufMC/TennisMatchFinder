'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Swords,
  MessageSquare,
} from 'lucide-react';
import type { BoxLeagueMatch } from '@/lib/box-leagues/types';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MatchListProps {
  matches: BoxLeagueMatch[];
  currentPlayerId?: string;
  title?: string;
  showActions?: boolean;
  onRecordResult?: (match: BoxLeagueMatch) => void;
}

const STATUS_CONFIG = {
  scheduled: { 
    icon: Clock, 
    label: 'À jouer', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  completed: { 
    icon: CheckCircle, 
    label: 'Terminé', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  forfeit: { 
    icon: AlertCircle, 
    label: 'Forfait', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
  },
  cancelled: { 
    icon: AlertCircle, 
    label: 'Annulé', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' 
  },
};

function MatchCard({ 
  match, 
  currentPlayerId, 
  showActions, 
  onRecordResult 
}: { 
  match: BoxLeagueMatch; 
  currentPlayerId?: string;
  showActions?: boolean;
  onRecordResult?: (match: BoxLeagueMatch) => void;
}) {
  const status = STATUS_CONFIG[match.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled;
  const StatusIcon = status.icon;
  const isPlayerInMatch = currentPlayerId && (match.player1Id === currentPlayerId || match.player2Id === currentPlayerId);
  const isCurrentPlayerWinner = match.winnerId === currentPlayerId;
  const deadlineSoon = match.deadline && differenceInDays(new Date(match.deadline), new Date()) <= 3;
  const deadlinePassed = match.deadline && isAfter(new Date(), new Date(match.deadline));

  return (
    <Card className={cn(
      'transition-all',
      isPlayerInMatch && 'border-primary',
      match.status === 'scheduled' && deadlineSoon && !deadlinePassed && 'border-amber-500'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Joueur 1 */}
          <div className={cn(
            'flex items-center gap-2 flex-1',
            match.winnerId === match.player1Id && 'font-bold'
          )}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={match.player1?.avatarUrl || undefined} />
              <AvatarFallback className="text-xs">
                {match.player1?.fullName?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <Link 
                href={`/profil/${match.player1Id}`}
                className="hover:underline"
              >
                <span className={cn(
                  'text-sm',
                  match.player1Id === currentPlayerId && 'text-primary font-medium'
                )}>
                  {match.player1?.fullName || 'Joueur 1'}
                  {match.player1Id === currentPlayerId && ' (vous)'}
                </span>
              </Link>
              <span className="text-xs text-muted-foreground">
                {match.player1?.currentElo} ELO
              </span>
            </div>
            {match.winnerId === match.player1Id && (
              <Badge variant="default" className="ml-auto bg-green-600">Victoire</Badge>
            )}
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center mx-4 min-w-[80px]">
            {match.status === 'completed' ? (
              <>
                <div className="text-lg font-bold font-mono">
                  {match.player1Sets} - {match.player2Sets}
                </div>
                <div className="text-xs text-muted-foreground">{match.score}</div>
              </>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Swords className="h-4 w-4" />
                <span className="text-sm">VS</span>
              </div>
            )}
          </div>

          {/* Joueur 2 */}
          <div className={cn(
            'flex items-center gap-2 flex-1 justify-end text-right',
            match.winnerId === match.player2Id && 'font-bold'
          )}>
            {match.winnerId === match.player2Id && (
              <Badge variant="default" className="mr-auto bg-green-600">Victoire</Badge>
            )}
            <div className="flex flex-col items-end">
              <Link 
                href={`/profil/${match.player2Id}`}
                className="hover:underline"
              >
                <span className={cn(
                  'text-sm',
                  match.player2Id === currentPlayerId && 'text-primary font-medium'
                )}>
                  {match.player2?.fullName || 'Joueur 2'}
                  {match.player2Id === currentPlayerId && ' (vous)'}
                </span>
              </Link>
              <span className="text-xs text-muted-foreground">
                {match.player2?.currentElo} ELO
              </span>
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={match.player2?.avatarUrl || undefined} />
              <AvatarFallback className="text-xs">
                {match.player2?.fullName?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Footer: Status & Deadline */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className={cn('flex items-center gap-2 px-2 py-1 rounded-full text-xs', status.color)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </div>

          {match.deadline && match.status === 'scheduled' && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              deadlinePassed ? 'text-red-600' : deadlineSoon ? 'text-amber-600' : 'text-muted-foreground'
            )}>
              <Calendar className="h-3 w-3" />
              {deadlinePassed ? 'Délai dépassé' : `Avant le ${format(new Date(match.deadline), 'dd MMM', { locale: fr })}`}
            </div>
          )}

          {match.playedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Joué le {format(new Date(match.playedAt), 'dd MMM yyyy', { locale: fr })}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && isPlayerInMatch && match.status === 'scheduled' && (
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              asChild
            >
              <Link href={`/chat?opponent=${match.player1Id === currentPlayerId ? match.player2Id : match.player1Id}`}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Contacter
              </Link>
            </Button>
            {onRecordResult && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onRecordResult(match)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Enregistrer résultat
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MatchList({ matches, currentPlayerId, title, showActions, onRecordResult }: MatchListProps) {
  // Séparer les matchs par statut
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const otherMatches = matches.filter(m => !['scheduled', 'completed'].includes(m.status));

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Swords className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun match à afficher</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {title && <h3 className="font-semibold text-lg">{title}</h3>}

      {/* Matchs à jouer */}
      {scheduledMatches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Matchs à jouer ({scheduledMatches.length})
          </h4>
          <div className="grid gap-3">
            {scheduledMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                currentPlayerId={currentPlayerId}
                showActions={showActions}
                onRecordResult={onRecordResult}
              />
            ))}
          </div>
        </div>
      )}

      {/* Matchs terminés */}
      {completedMatches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Matchs terminés ({completedMatches.length})
          </h4>
          <div className="grid gap-3">
            {completedMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                currentPlayerId={currentPlayerId}
                showActions={showActions}
              />
            ))}
          </div>
        </div>
      )}

      {/* Autres matchs */}
      {otherMatches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Autres ({otherMatches.length})
          </h4>
          <div className="grid gap-3">
            {otherMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                currentPlayerId={currentPlayerId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
