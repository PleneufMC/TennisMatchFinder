'use client';

/**
 * Trophy Case 2.0 - BadgeProgressBar Component
 * 
 * Barre de progression visuelle pour les badges progressifs.
 * Affiche le progrès vers le déblocage d'un badge.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { calculateProgressPercentage, type BadgeDefinition } from '@/lib/gamification/badges';

// ============================================
// TYPES
// ============================================

export interface BadgeProgressBarProps {
  badge: BadgeDefinition;
  currentProgress: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function BadgeProgressBar({
  badge,
  currentProgress,
  showLabel = true,
  size = 'md',
  className,
}: BadgeProgressBarProps) {
  const maxProgress = badge.maxProgress || 1;
  const percentage = calculateProgressPercentage(currentProgress, maxProgress);
  const isComplete = percentage >= 100;
  
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  // Couleur selon le tier
  const tierColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-gradient-to-r from-yellow-500 to-amber-500',
  };
  
  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className={cn('flex justify-between', textClasses[size])}>
          <span className="text-muted-foreground truncate mr-2">
            {badge.name}
          </span>
          <span className={cn(
            'font-medium shrink-0',
            isComplete ? 'text-green-600' : 'text-muted-foreground'
          )}>
            {currentProgress} / {maxProgress}
          </span>
        </div>
      )}
      
      <div className={cn(
        'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        heightClasses[size]
      )}>
        <motion.div
          className={cn(
            'h-full rounded-full',
            tierColors[badge.tier],
            isComplete && 'animate-pulse'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      
      {/* Milestone markers pour les gros objectifs */}
      {maxProgress >= 25 && size !== 'sm' && (
        <div className="relative h-1">
          {[25, 50, 75, 100].map(milestone => {
            const reached = percentage >= milestone;
            return (
              <div
                key={milestone}
                className={cn(
                  'absolute top-0 w-1 h-1 rounded-full transform -translate-x-1/2',
                  reached ? 'bg-green-500' : 'bg-gray-400'
                )}
                style={{ left: `${milestone}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BadgeProgressBar;
