'use client';

import { Swords, Trophy, Flame, TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlayerAvatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { type Rivalry, RIVALRY_LEVELS } from '@/lib/rivalries/types';
import { formatFullDate, formatRelativeDate } from '@/lib/utils/dates';

interface RivalryDetailProps {
  rivalry: Rivalry;
  currentPlayerId: string;
}

export function RivalryDetail({ rivalry, currentPlayerId }: RivalryDetailProps) {
  const { player1, player2, stats, matches, rivalryLevel } = rivalry;
  
  // Déterminer qui est le joueur courant et qui est l'adversaire
  const isPlayer1 = currentPlayerId === player1.id;
  const currentPlayer = isPlayer1 ? player1 : player2;
  const opponent = isPlayer1 ? player2 : player1;
  const myWins = isPlayer1 ? stats.player1Wins : stats.player2Wins;
  const opponentWins = isPlayer1 ? stats.player2Wins : stats.player1Wins;
  const myWinRate = isPlayer1 ? stats.player1WinRate : stats.player2WinRate;

  const levelInfo = RIVALRY_LEVELS[rivalryLevel];
  const levelColors: Record<string, string> = {
    casual: 'from-gray-400 to-gray-500',
    regular: 'from-blue-400 to-blue-600',
    intense: 'from-orange-400 to-orange-600',
    legendary: 'from-purple-400 to-purple-600',
  };

  return (
    <div className="space-y-6">
      {/* Header avec les deux joueurs */}
      <Card className={cn(
        'overflow-hidden',
        rivalryLevel === 'legendary' && 'ring-2 ring-purple-400',
      )}>
        {/* Bannière de niveau */}
        <div className={cn(
          'h-2 bg-gradient-to-r',
          levelColors[rivalryLevel]
        )} />
        
        <CardHeader className="text-center pb-2">
          <Badge className="mx-auto mb-2" variant="secondary">
            {rivalryLevel === 'legendary' && <Flame className="h-3 w-3 mr-1" />}
            {levelInfo.label} • {stats.totalMatches} matchs
          </Badge>
          <CardTitle className="text-2xl">Face-à-Face</CardTitle>
        </CardHeader>

        <CardContent>
          {/* VS Display */}
          <div className="flex items-center justify-center gap-4 py-6">
            {/* Joueur 1 */}
            <div className="flex flex-col items-center text-center">
              <PlayerAvatar
                src={currentPlayer.avatarUrl}
                name={currentPlayer.fullName}
                size="xl"
              />
              <h3 className="font-bold mt-2">{currentPlayer.fullName}</h3>
              <p className="text-sm text-muted-foreground">{currentPlayer.currentElo} ELO</p>
              <div className={cn(
                'text-3xl font-bold mt-2',
                myWins > opponentWins ? 'text-green-600' : 
                myWins < opponentWins ? 'text-red-600' : 'text-gray-600'
              )}>
                {myWins}
              </div>
              <p className="text-xs text-muted-foreground">victoires</p>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center px-4">
              <Swords className="h-12 w-12 text-muted-foreground" />
              <span className="text-2xl font-bold text-muted-foreground mt-2">VS</span>
            </div>

            {/* Joueur 2 */}
            <div className="flex flex-col items-center text-center">
              <PlayerAvatar
                src={opponent.avatarUrl}
                name={opponent.fullName}
                size="xl"
              />
              <h3 className="font-bold mt-2">{opponent.fullName}</h3>
              <p className="text-sm text-muted-foreground">{opponent.currentElo} ELO</p>
              <div className={cn(
                'text-3xl font-bold mt-2',
                opponentWins > myWins ? 'text-green-600' : 
                opponentWins < myWins ? 'text-red-600' : 'text-gray-600'
              )}>
                {opponentWins}
              </div>
              <p className="text-xs text-muted-foreground">victoires</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-4">
            <div className="relative h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                style={{ width: `${myWinRate}%` }}
              />
              <div 
                className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-400 to-red-600 transition-all"
                style={{ width: `${100 - myWinRate}%` }}
              />
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-green-600 font-medium">{myWinRate}%</span>
              <span className="text-red-600 font-medium">{100 - myWinRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats détaillées */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Série actuelle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center',
                stats.currentStreak?.playerId === currentPlayerId
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              )}>
                <Flame className={cn(
                  'h-6 w-6',
                  stats.currentStreak?.playerId === currentPlayerId
                    ? 'text-green-600'
                    : 'text-red-600'
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.currentStreak?.count || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Série actuelle
                  {stats.currentStreak && (
                    <span className={cn(
                      'ml-1',
                      stats.currentStreak.playerId === currentPlayerId
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}>
                      ({stats.currentStreak.playerId === currentPlayerId ? 'vous' : opponent.fullName})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meilleure série */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.longestStreak.count}</p>
                <p className="text-sm text-muted-foreground">
                  Record de série
                  <span className={cn(
                    'ml-1',
                    stats.longestStreak.playerId === currentPlayerId
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}>
                    ({stats.longestStreak.playerId === currentPlayerId ? 'vous' : opponent.fullName})
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delta ELO moyen */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">±{stats.avgEloDelta}</p>
                <p className="text-sm text-muted-foreground">ELO moyen par match</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des matchs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique des confrontations
          </CardTitle>
          <CardDescription>
            {stats.totalMatches} match{stats.totalMatches > 1 ? 's' : ''} depuis{' '}
            {stats.firstMatch ? formatFullDate(stats.firstMatch.playedAt.toISOString()) : 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matches.map((match) => {
              const isWin = match.winnerId === currentPlayerId;
              const delta = isPlayer1 ? match.player1EloDelta : match.player2EloDelta;
              
              return (
                <div
                  key={match.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    isWin 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isWin ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {isWin ? 'Victoire' : 'Défaite'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeDate(match.playedAt.toISOString())} • {match.score}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isWin ? 'default' : 'destructive'}>
                    {delta > 0 ? '+' : ''}{delta} ELO
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
