'use client';

import { type LucideIcon, Target, Flame, Trophy, Crown, Users, Network, TrendingUp, Zap, Calendar, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ChallengeProgress, ChallengeSummary } from '@/lib/gamification/challenges';

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  Target,
  Flame,
  Trophy,
  Crown,
  Users,
  Network,
  TrendingUp,
  Zap,
};

interface MonthlyChallengesProps {
  progress: ChallengeProgress[];
  summary: ChallengeSummary;
}

export function MonthlyChallenges({ progress, summary }: MonthlyChallengesProps) {
  const monthName = new Date(summary.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Challenges de {monthName}</CardTitle>
          </div>
          <Badge variant="secondary">
            {summary.daysLeft} jour{summary.daysLeft > 1 ? 's' : ''} restant{summary.daysLeft > 1 ? 's' : ''}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-4">
          <span>{summary.completedChallenges}/{summary.totalChallenges} complétés</span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            +{summary.xpEarned} XP gagnés
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Progress overview */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progression globale</span>
            <span className="font-medium">
              {Math.round((summary.completedChallenges / summary.totalChallenges) * 100)}%
            </span>
          </div>
          <Progress 
            value={(summary.completedChallenges / summary.totalChallenges) * 100} 
            className="h-2"
          />
        </div>

        {/* Challenges list */}
        <div className="space-y-4">
          {progress.map((item) => (
            <ChallengeItem key={item.challenge.id} progress={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChallengeItemProps {
  progress: ChallengeProgress;
}

function ChallengeItem({ progress }: ChallengeItemProps) {
  const { challenge, current, target, percentage, status } = progress;
  const IconComponent = iconMap[challenge.icon] || Target;

  const statusStyles = {
    not_started: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-700',
      icon: 'text-gray-400',
    },
    in_progress: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700',
      icon: 'text-blue-500',
    },
    completed: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700',
      icon: 'text-green-500',
    },
    failed: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-700',
      icon: 'text-red-500',
    },
  };

  const style = statusStyles[status];

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all',
        style.bg,
        style.border,
        status === 'completed' && 'ring-2 ring-green-500/20'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
            status === 'completed' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-white dark:bg-gray-800'
          )}
        >
          {status === 'completed' ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <IconComponent className={cn('h-5 w-5', style.icon)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-medium truncate">{challenge.name}</h4>
            {challenge.reward && (
              <Badge
                variant={status === 'completed' ? 'default' : 'outline'}
                className={cn(
                  'shrink-0 text-xs',
                  status === 'completed' && 'bg-green-600'
                )}
              >
                {challenge.reward}
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {challenge.description}
          </p>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {current}/{target}
              </span>
              <span className={cn(
                'font-medium',
                status === 'completed' ? 'text-green-600' : 'text-muted-foreground'
              )}>
                {percentage}%
              </span>
            </div>
            <Progress
              value={percentage}
              className={cn(
                'h-1.5',
                status === 'completed' && '[&>div]:bg-green-500'
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
