'use client';

import Link from 'next/link';
import { Swords, TrendingUp, TrendingDown, Minus, ChevronRight, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlayerAvatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { RIVALRY_LEVELS, type RivalryLevel } from '@/lib/rivalries/types';
import { formatRelativeDate } from '@/lib/utils/dates';

interface RivalryCardProps {
  playerId: string;
  opponent: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
  matchCount: number;
  wins: number;
  losses: number;
  lastPlayed: Date;
  rivalryLevel: RivalryLevel;
  showLink?: boolean;
}

export function RivalryCard({
  playerId,
  opponent,
  matchCount,
  wins,
  losses,
  lastPlayed,
  rivalryLevel,
  showLink = true,
}: RivalryCardProps) {
  const levelInfo = RIVALRY_LEVELS[rivalryLevel];
  const winRate = matchCount > 0 ? Math.round((wins / matchCount) * 100) : 0;
  
  // Déterminer la tendance (basé sur le ratio)
  const trend = wins > losses ? 'winning' : wins < losses ? 'losing' : 'even';

  const levelColors: Record<RivalryLevel, string> = {
    casual: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    regular: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    intense: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    legendary: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };

  const content = (
    <Card className={cn(
      'transition-all hover:shadow-md',
      rivalryLevel === 'legendary' && 'ring-2 ring-purple-400/50',
      rivalryLevel === 'intense' && 'ring-1 ring-orange-300/50',
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar adversaire */}
          <div className="relative">
            <PlayerAvatar
              src={opponent.avatarUrl}
              name={opponent.fullName}
              size="lg"
            />
            {rivalryLevel === 'legendary' && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
                <Flame className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{opponent.fullName}</h4>
              <Badge className={cn('text-xs', levelColors[rivalryLevel])}>
                {levelInfo.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{opponent.currentElo} ELO</span>
              <span>•</span>
              <span>{matchCount} match{matchCount > 1 ? 's' : ''}</span>
            </div>

            {/* Barre de progression H2H */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className={cn(
                  'font-medium',
                  trend === 'winning' ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {wins}V
                </span>
                <span className={cn(
                  'font-medium',
                  trend === 'losing' ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {losses}D
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div 
                  className={cn(
                    'absolute left-0 top-0 h-full transition-all',
                    trend === 'winning' ? 'bg-green-500' : 
                    trend === 'losing' ? 'bg-red-500' : 'bg-gray-400'
                  )}
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Indicateur de tendance */}
          <div className="flex flex-col items-center gap-1">
            {trend === 'winning' ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : trend === 'losing' ? (
              <TrendingDown className="h-5 w-5 text-red-500" />
            ) : (
              <Minus className="h-5 w-5 text-gray-400" />
            )}
            <span className={cn(
              'text-lg font-bold',
              trend === 'winning' ? 'text-green-600' : 
              trend === 'losing' ? 'text-red-600' : 'text-gray-600'
            )}>
              {winRate}%
            </span>
            <span className="text-[10px] text-muted-foreground">taux</span>
          </div>

          {showLink && (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Dernier match */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          Dernier match : {formatRelativeDate(lastPlayed.toISOString())}
        </div>
      </CardContent>
    </Card>
  );

  if (showLink) {
    return (
      <Link href={`/rivalite/${playerId}/${opponent.id}`}>
        {content}
      </Link>
    );
  }

  return content;
}
