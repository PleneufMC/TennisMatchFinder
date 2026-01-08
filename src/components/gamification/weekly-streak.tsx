'use client';

import { Flame, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { WeeklyStreakInfo } from '@/lib/gamification/streaks';

interface WeeklyStreakProps {
  streakInfo: WeeklyStreakInfo;
}

export function WeeklyStreak({ streakInfo }: WeeklyStreakProps) {
  const { currentStreak, bestStreak, matchesThisWeek, streakStatus, daysUntilReset } = streakInfo;

  const statusConfig = {
    active: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      label: 'Streak active',
      description: 'Vous avez joué cette semaine !',
    },
    at_risk: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      label: 'À risque',
      description: `${daysUntilReset} jour${daysUntilReset > 1 ? 's' : ''} pour maintenir votre streak`,
    },
    broken: {
      icon: XCircle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-700',
      label: 'Streak perdue',
      description: 'Jouez un match pour recommencer',
    },
  };

  const status = statusConfig[streakStatus];
  const StatusIcon = status.icon;

  return (
    <Card className={cn('border-2', status.borderColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            Weekly Streak
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1',
              status.color,
              status.borderColor
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        <CardDescription>{status.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Current Streak */}
          <div className={cn('p-4 rounded-lg text-center', status.bgColor)}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className={cn('h-6 w-6', currentStreak > 0 ? 'text-orange-500' : 'text-gray-400')} />
              <span className="text-3xl font-bold">{currentStreak}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Semaine{currentStreak > 1 ? 's' : ''} consécutive{currentStreak > 1 ? 's' : ''}
            </p>
          </div>

          {/* Best Streak */}
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-3xl font-bold text-purple-600">{bestStreak}</span>
            </div>
            <p className="text-xs text-muted-foreground">Meilleure streak</p>
          </div>

          {/* Matches this week */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-3xl font-bold text-blue-600">{matchesThisWeek}</span>
            </div>
            <p className="text-xs text-muted-foreground">Match{matchesThisWeek > 1 ? 's' : ''} cette semaine</p>
          </div>
        </div>

        {/* Progress bar for at_risk status */}
        {streakStatus === 'at_risk' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Temps restant</span>
              <span>{daysUntilReset} jour{daysUntilReset > 1 ? 's' : ''}</span>
            </div>
            <Progress 
              value={((7 - daysUntilReset) / 7) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Motivational message */}
        {currentStreak >= 4 && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              🔥 Impressionnant ! {currentStreak} semaines consécutives !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
