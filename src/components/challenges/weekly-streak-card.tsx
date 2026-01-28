'use client';

import { Flame, Target, Trophy, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface WeeklyStreakCardProps {
  currentStreak: number;
  bestStreak: number;
  currentWeekValidated: boolean;
  nextBadge: {
    name: string;
    streakRequired: number;
    progress: number;
  } | null;
  matchesThisWeek?: number;
  proposalsThisWeek?: number;
}

// Badge milestones
const BADGES = [
  { name: 'Régulier', streakRequired: 4, icon: '🥉', tier: 'common' },
  { name: 'Assidu', streakRequired: 26, icon: '🥈', tier: 'epic' },
  { name: 'Légende', streakRequired: 52, icon: '🥇', tier: 'legendary' },
];

export function WeeklyStreakCard({
  currentStreak,
  bestStreak,
  currentWeekValidated,
  nextBadge,
  matchesThisWeek = 0,
  proposalsThisWeek = 0,
}: WeeklyStreakCardProps) {
  // Determine which badges have been earned
  const earnedBadges = BADGES.filter(b => currentStreak >= b.streakRequired || bestStreak >= b.streakRequired);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Challenge Hebdomadaire
        </CardTitle>
        <CardDescription>
          Joue 1 match ou envoie 2 propositions chaque semaine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak Display */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
          <div className="flex items-center gap-3">
            <div className={`
              h-14 w-14 rounded-full flex items-center justify-center text-2xl font-bold
              ${currentStreak >= 4 
                ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg' 
                : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600'}
            `}>
              {currentStreak}
            </div>
            <div>
              <p className="font-semibold">Série actuelle</p>
              <p className="text-sm text-muted-foreground">
                {currentStreak === 0 
                  ? 'Joue cette semaine !' 
                  : `${currentStreak} semaine${currentStreak > 1 ? 's' : ''} consécutive${currentStreak > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Record</p>
            <p className="font-bold text-lg">{bestStreak}</p>
          </div>
        </div>

        {/* This Week Status */}
        <div className="flex items-center gap-3 p-3 rounded-lg border">
          <div className={`
            h-10 w-10 rounded-full flex items-center justify-center
            ${currentWeekValidated 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-gray-100 dark:bg-gray-800'}
          `}>
            {currentWeekValidated ? (
              <Target className="h-5 w-5 text-green-600" />
            ) : (
              <Calendar className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {currentWeekValidated ? 'Semaine validée ✓' : 'Semaine en cours'}
            </p>
            <p className="text-sm text-muted-foreground">
              {matchesThisWeek > 0 && `${matchesThisWeek} match${matchesThisWeek > 1 ? 's' : ''}`}
              {matchesThisWeek > 0 && proposalsThisWeek > 0 && ' • '}
              {proposalsThisWeek > 0 && `${proposalsThisWeek} proposition${proposalsThisWeek > 1 ? 's' : ''}`}
              {matchesThisWeek === 0 && proposalsThisWeek === 0 && 'Pas encore d\'activité'}
            </p>
          </div>
          {currentWeekValidated && (
            <Badge variant="success" className="ml-auto">
              Validé
            </Badge>
          )}
        </div>

        {/* Progress to Next Badge */}
        {nextBadge && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                Prochain badge : <span className="font-medium">{nextBadge.name}</span>
              </span>
              <span className="text-muted-foreground">
                {currentStreak} / {nextBadge.streakRequired} semaines
              </span>
            </div>
            <Progress value={nextBadge.progress} className="h-2" />
          </div>
        )}

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Badges obtenus</p>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((badge) => (
                <Badge 
                  key={badge.name} 
                  variant={
                    badge.tier === 'legendary' ? 'default' :
                    badge.tier === 'epic' ? 'secondary' : 'outline'
                  }
                  className={
                    badge.tier === 'legendary' 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0' 
                      : badge.tier === 'epic'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : ''
                  }
                >
                  {badge.icon} {badge.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Badge Milestones Info */}
        {currentStreak < 52 && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p className="font-medium mb-1">Paliers à atteindre :</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {BADGES.map((badge) => (
                <span 
                  key={badge.name}
                  className={currentStreak >= badge.streakRequired ? 'line-through opacity-50' : ''}
                >
                  {badge.icon} {badge.name} ({badge.streakRequired} sem.)
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
