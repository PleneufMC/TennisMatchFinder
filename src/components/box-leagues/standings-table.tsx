'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Crown } from 'lucide-react';
import type { BoxLeagueStanding, BoxLeague } from '@/lib/box-leagues/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StandingsTableProps {
  standings: BoxLeagueStanding[];
  league: BoxLeague;
  currentPlayerId?: string;
  compact?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-muted-foreground font-mono">{rank}</span>;
  }
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export function StandingsTable({ standings, league, currentPlayerId, compact }: StandingsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Joueur</TableHead>
            {!compact && <TableHead className="text-center w-12">J</TableHead>}
            <TableHead className="text-center w-12">V</TableHead>
            {!compact && <TableHead className="text-center w-12">D</TableHead>}
            <TableHead className="text-center w-16">Sets</TableHead>
            {!compact && <TableHead className="text-center w-16">Jeux</TableHead>}
            <TableHead className="text-center w-16 font-bold">Pts</TableHead>
            {!compact && <TableHead className="w-10"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((standing) => {
            const participant = standing.participant;
            const player = participant.player;
            const isCurrentPlayer = currentPlayerId && participant.playerId === currentPlayerId;
            const isPromotionZone = standing.rank <= league.promotionSpots;
            const isRelegationZone = standing.rank > standings.length - league.relegationSpots;

            return (
              <TableRow
                key={participant.id}
                className={cn(
                  isCurrentPlayer && 'bg-primary/5 font-medium',
                  isPromotionZone && 'border-l-4 border-l-green-500',
                  isRelegationZone && 'border-l-4 border-l-red-500'
                )}
              >
                {/* Rang */}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    {getRankIcon(standing.rank)}
                  </div>
                </TableCell>

                {/* Joueur */}
                <TableCell>
                  <Link
                    href={`/profil/${participant.playerId}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player?.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {player?.fullName?.slice(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className={cn('text-sm', isCurrentPlayer && 'font-bold')}>
                        {player?.fullName || 'Joueur inconnu'}
                        {isCurrentPlayer && ' (vous)'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {participant.eloAtStart} ELO
                      </span>
                    </div>
                  </Link>
                </TableCell>

                {/* Matchs joués */}
                {!compact && (
                  <TableCell className="text-center text-muted-foreground">
                    {participant.matchesPlayed}
                  </TableCell>
                )}

                {/* Victoires */}
                <TableCell className="text-center text-green-600 font-medium">
                  {participant.matchesWon}
                </TableCell>

                {/* Défaites */}
                {!compact && (
                  <TableCell className="text-center text-red-600">
                    {participant.matchesLost}
                  </TableCell>
                )}

                {/* Sets (Différence) */}
                <TableCell className="text-center">
                  <span className={cn(
                    'font-mono text-sm',
                    (participant.setsWon - participant.setsLost) > 0 && 'text-green-600',
                    (participant.setsWon - participant.setsLost) < 0 && 'text-red-600'
                  )}>
                    {participant.setsWon - participant.setsLost > 0 ? '+' : ''}
                    {participant.setsWon - participant.setsLost}
                  </span>
                </TableCell>

                {/* Jeux (Différence) */}
                {!compact && (
                  <TableCell className="text-center">
                    <span className={cn(
                      'font-mono text-xs',
                      (participant.gamesWon - participant.gamesLost) > 0 && 'text-green-600',
                      (participant.gamesWon - participant.gamesLost) < 0 && 'text-red-600'
                    )}>
                      {participant.gamesWon - participant.gamesLost > 0 ? '+' : ''}
                      {participant.gamesWon - participant.gamesLost}
                    </span>
                  </TableCell>
                )}

                {/* Points */}
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-bold">
                    {participant.points}
                  </Badge>
                </TableCell>

                {/* Tendance */}
                {!compact && (
                  <TableCell>
                    {getTrendIcon(standing.trend)}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Légende */}
      <div className="flex items-center justify-end gap-4 p-2 text-xs text-muted-foreground border-t">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <span>Promotion ({league.promotionSpots})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
          <span>Relégation ({league.relegationSpots})</span>
        </div>
      </div>
    </div>
  );
}
