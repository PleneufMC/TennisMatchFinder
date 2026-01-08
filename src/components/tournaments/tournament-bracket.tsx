'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Crown,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { TournamentBracket, TournamentMatch, BracketRound } from '@/lib/tournaments/types';
import { cn } from '@/lib/utils';

interface TournamentBracketProps {
  bracket: TournamentBracket;
  currentPlayerId?: string;
  onMatchClick?: (match: TournamentMatch) => void;
}

const STATUS_STYLES = {
  pending: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500' },
  scheduled: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
  in_progress: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
  completed: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600' },
  walkover: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600' },
  bye: { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-400' },
} as const;

type StatusStyleKey = keyof typeof STATUS_STYLES;

const getStatusStyle = (status: string) => {
  return STATUS_STYLES[status as StatusStyleKey] ?? STATUS_STYLES.pending;
};

function MatchCard({ 
  match, 
  currentPlayerId,
  roundName,
  onMatchClick,
}: { 
  match: TournamentMatch;
  currentPlayerId?: string;
  roundName: string;
  onMatchClick?: (match: TournamentMatch) => void;
}) {
  const statusStyle = getStatusStyle(match.status);
  const isCurrentPlayerMatch = currentPlayerId && (
    match.player1Id === currentPlayerId || match.player2Id === currentPlayerId
  );
  const isCurrentPlayerWinner = match.winnerId === currentPlayerId;

  const player1IsWinner = match.winnerId === match.player1Id;
  const player2IsWinner = match.winnerId === match.player2Id;

  return (
    <Card 
      className={cn(
        'w-64 cursor-pointer transition-all hover:shadow-md',
        isCurrentPlayerMatch && 'ring-2 ring-primary',
        match.isBye && 'opacity-60'
      )}
      onClick={() => onMatchClick?.(match)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Player 1 */}
        <div className={cn(
          'flex items-center gap-2 p-2 rounded',
          player1IsWinner && 'bg-green-50 dark:bg-green-900/20',
          !match.player1Id && 'opacity-50'
        )}>
          {match.player1Id ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={match.player1?.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {match.player1?.fullName?.slice(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {match.player1Seed && (
                    <span className="text-xs text-muted-foreground font-mono">
                      [{match.player1Seed}]
                    </span>
                  )}
                  <span className={cn(
                    'text-sm truncate',
                    player1IsWinner && 'font-bold',
                    match.player1Id === currentPlayerId && 'text-primary'
                  )}>
                    {match.player1?.fullName || 'Joueur 1'}
                  </span>
                  {player1IsWinner && (
                    <Trophy className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                </div>
              </div>
              {match.status === 'completed' && (
                <span className={cn(
                  'text-lg font-bold',
                  player1IsWinner ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {match.player1Sets}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              {match.isBye ? 'BYE' : 'À déterminer'}
            </span>
          )}
        </div>

        {/* VS / Score separator */}
        <div className="flex items-center justify-center">
          {match.status === 'completed' ? (
            <span className="text-xs text-muted-foreground font-mono">
              {match.score}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">VS</span>
          )}
        </div>

        {/* Player 2 */}
        <div className={cn(
          'flex items-center gap-2 p-2 rounded',
          player2IsWinner && 'bg-green-50 dark:bg-green-900/20',
          !match.player2Id && 'opacity-50'
        )}>
          {match.player2Id ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={match.player2?.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {match.player2?.fullName?.slice(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {match.player2Seed && (
                    <span className="text-xs text-muted-foreground font-mono">
                      [{match.player2Seed}]
                    </span>
                  )}
                  <span className={cn(
                    'text-sm truncate',
                    player2IsWinner && 'font-bold',
                    match.player2Id === currentPlayerId && 'text-primary'
                  )}>
                    {match.player2?.fullName || 'Joueur 2'}
                  </span>
                  {player2IsWinner && (
                    <Trophy className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                </div>
              </div>
              {match.status === 'completed' && (
                <span className={cn(
                  'text-lg font-bold',
                  player2IsWinner ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {match.player2Sets}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              {match.isBye ? 'BYE' : 'À déterminer'}
            </span>
          )}
        </div>

        {/* Status */}
        <div className={cn(
          'flex items-center justify-center gap-1 py-1 px-2 rounded text-xs',
          statusStyle.bg, statusStyle.text
        )}>
          {match.status === 'pending' && <Clock className="h-3 w-3" />}
          {match.status === 'completed' && <CheckCircle className="h-3 w-3" />}
          {match.status === 'bye' && <AlertCircle className="h-3 w-3" />}
          <span>
            {match.status === 'pending' && 'À jouer'}
            {match.status === 'scheduled' && 'Programmé'}
            {match.status === 'in_progress' && 'En cours'}
            {match.status === 'completed' && 'Terminé'}
            {match.status === 'walkover' && 'Walkover'}
            {match.status === 'bye' && 'Exempt'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function BracketColumn({ 
  round, 
  currentPlayerId,
  onMatchClick,
}: { 
  round: BracketRound;
  currentPlayerId?: string;
  onMatchClick?: (match: TournamentMatch) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      {/* Round Header */}
      <div className="mb-4 text-center">
        <h3 className="font-semibold text-sm">{round.name}</h3>
        <p className="text-xs text-muted-foreground">
          {round.matches.length} match{round.matches.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Matches */}
      <div className="flex flex-col gap-4">
        {round.matches.map((match, index) => (
          <div
            key={match.id}
            className="relative"
            style={{
              // Espacement croissant pour aligner avec les tours suivants
              marginTop: index > 0 ? `${Math.pow(2, round.round - 1) * 16}px` : 0,
            }}
          >
            <MatchCard
              match={match}
              currentPlayerId={currentPlayerId}
              roundName={round.name}
              onMatchClick={onMatchClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TournamentBracket({ 
  bracket, 
  currentPlayerId,
  onMatchClick,
}: TournamentBracketProps) {
  const { tournament, rounds, consolationRounds } = bracket;

  if (rounds.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Le bracket n'a pas encore été généré</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Winner Display */}
      {tournament.winnerId && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <Crown className="h-8 w-8 text-amber-500" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Vainqueur du tournoi</p>
                <p className="text-xl font-bold">
                  {/* Le nom sera récupéré via l'API */}
                  Champion !
                </p>
              </div>
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max p-4">
          {rounds.map((round) => (
            <BracketColumn
              key={round.round}
              round={round}
              currentPlayerId={currentPlayerId}
              onMatchClick={onMatchClick}
            />
          ))}
        </div>
      </div>

      {/* Consolation Bracket */}
      {consolationRounds && consolationRounds.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            Petite Finale (3ème place)
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max p-4">
              {consolationRounds.map((round) => (
                <BracketColumn
                  key={`consolation-${round.round}`}
                  round={round}
                  currentPlayerId={currentPlayerId}
                  onMatchClick={onMatchClick}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
