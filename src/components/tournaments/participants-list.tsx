'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Crown,
  Trophy,
  Medal,
} from 'lucide-react';
import type { TournamentParticipant } from '@/lib/tournaments/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ParticipantsListProps {
  participants: TournamentParticipant[];
  currentPlayerId?: string;
  showSeeds?: boolean;
  maxDisplay?: number;
}

const POSITION_ICONS: Record<number, { icon: typeof Trophy; color: string }> = {
  1: { icon: Trophy, color: 'text-yellow-500' },
  2: { icon: Medal, color: 'text-gray-400' },
  3: { icon: Medal, color: 'text-amber-600' },
};

export function ParticipantsList({ 
  participants, 
  currentPlayerId,
  showSeeds = false,
  maxDisplay,
}: ParticipantsListProps) {
  const displayParticipants = maxDisplay 
    ? participants.slice(0, maxDisplay) 
    : participants;
  
  const hasMore = maxDisplay && participants.length > maxDisplay;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayParticipants.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Aucun participant inscrit
          </p>
        ) : (
          <>
            {displayParticipants.map((participant, index) => {
              const isCurrentPlayer = currentPlayerId === participant.playerId;
              const positionConfig = participant.finalPosition 
                ? POSITION_ICONS[participant.finalPosition] 
                : null;
              const PositionIcon = positionConfig?.icon;

              return (
                <Link
                  key={participant.id}
                  href={`/profil/${participant.playerId}`}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted',
                    isCurrentPlayer && 'bg-primary/5 border border-primary/20'
                  )}
                >
                  {/* Seed / Position */}
                  <div className="w-8 text-center">
                    {showSeeds && participant.seed ? (
                      <Badge variant="outline" className="text-xs font-mono">
                        {participant.seed}
                      </Badge>
                    ) : participant.finalPosition && PositionIcon ? (
                      <PositionIcon className={cn('h-5 w-5 mx-auto', positionConfig?.color)} />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.player?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {participant.player?.fullName?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name & ELO */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium truncate',
                        isCurrentPlayer && 'text-primary'
                      )}>
                        {participant.player?.fullName || 'Joueur inconnu'}
                      </span>
                      {isCurrentPlayer && (
                        <Badge variant="secondary" className="text-xs">Vous</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {participant.eloAtRegistration} ELO à l'inscription
                    </p>
                  </div>

                  {/* Status badges */}
                  <div className="flex gap-1">
                    {participant.finalPosition === 1 && (
                      <Badge className="bg-yellow-500 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Vainqueur
                      </Badge>
                    )}
                    {participant.finalPosition === 2 && (
                      <Badge variant="secondary">Finaliste</Badge>
                    )}
                    {participant.finalPosition === 3 && (
                      <Badge variant="outline">3ème</Badge>
                    )}
                    {participant.eliminatedInRound && !participant.finalPosition && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Éliminé T{participant.eliminatedInRound}
                      </Badge>
                    )}
                    {!participant.isActive && (
                      <Badge variant="destructive">Forfait</Badge>
                    )}
                  </div>
                </Link>
              );
            })}

            {hasMore && (
              <p className="text-center text-sm text-muted-foreground pt-2">
                +{participants.length - maxDisplay!} autres participants
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
