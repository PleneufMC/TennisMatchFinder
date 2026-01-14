'use client';

import { Star, Clock, Shield, Heart, Award } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReputationBadgeProps {
  average: number | null;
  count: number;
  punctuality?: number | null;
  fairPlay?: number | null;
  friendliness?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

/**
 * Badge de réputation affiché sur le profil d'un joueur
 * Affiche la note moyenne et optionnellement le détail des critères
 */
export function ReputationBadge({
  average,
  count,
  punctuality,
  fairPlay,
  friendliness,
  size = 'md',
  showDetails = true,
  className,
}: ReputationBadgeProps) {
  // Pas encore évalué
  if (!average || count === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn('gap-1 cursor-default', className)}>
              <Star className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">—</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pas encore évalué</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const avgNum = Number(average);
  
  // Couleur selon la note
  const getColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 4.0) return 'text-emerald-600 dark:text-emerald-400';
    if (rating >= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    if (rating >= 3.0) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Badge "Partenaire Fiable" pour excellente réputation
  const isReliablePartner = avgNum >= 4.5 && count >= 5;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const starSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const content = (
    <Badge 
      variant={isReliablePartner ? 'default' : 'secondary'} 
      className={cn(
        'gap-1.5 cursor-default transition-colors',
        sizeClasses[size],
        isReliablePartner && 'bg-green-600 hover:bg-green-700',
        className
      )}
    >
      <Star className={cn(starSizes[size], 'fill-yellow-400 text-yellow-400')} />
      <span className={cn('font-semibold', !isReliablePartner && getColor(avgNum))}>
        {avgNum.toFixed(1)}
      </span>
      <span className="text-muted-foreground font-normal">
        ({count})
      </span>
      {isReliablePartner && (
        <Award className={cn(starSizes[size], 'text-yellow-300 ml-0.5')} />
      )}
    </Badge>
  );

  if (!showDetails) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent className="w-64 p-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Réputation</span>
              <span className="text-sm text-muted-foreground">
                {count} évaluation{count > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-2">
              {punctuality && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Ponctualité</span>
                  </div>
                  <RatingStars value={Number(punctuality)} />
                </div>
              )}
              
              {fairPlay && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Fair-play</span>
                  </div>
                  <RatingStars value={Number(fairPlay)} />
                </div>
              )}
              
              {friendliness && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Convivialité</span>
                  </div>
                  <RatingStars value={Number(friendliness)} />
                </div>
              )}
            </div>

            {isReliablePartner && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-medium">Partenaire Fiable</span>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-3 w-3',
            value >= star
              ? 'fill-yellow-400 text-yellow-400'
              : value >= star - 0.5
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'fill-transparent text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Version compacte pour les listes de joueurs
 */
export function ReputationBadgeCompact({
  average,
  count,
  className,
}: {
  average: number | null;
  count: number;
  className?: string;
}) {
  if (!average || count === 0) {
    return null;
  }

  const avgNum = Number(average);
  const isReliable = avgNum >= 4.5 && count >= 5;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Star className={cn(
        'h-3 w-3',
        isReliable ? 'fill-green-500 text-green-500' : 'fill-yellow-400 text-yellow-400'
      )} />
      <span className="text-xs font-medium">{avgNum.toFixed(1)}</span>
    </div>
  );
}
