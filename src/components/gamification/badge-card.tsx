'use client';

import { type LucideIcon, Award, Sparkles, Target, Flame, Trophy, TrendingUp, Sword, Zap, Rocket, Crown, ArrowBigUp, Users, Network, Star, Bird, Calendar, CalendarCheck } from 'lucide-react';
import { Badge as BadgeType, RARITY_COLORS, RARITY_LABELS } from '@/lib/gamification/badges';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  Award,
  Sparkles,
  Target,
  Flame,
  Trophy,
  TrendingUp,
  Sword,
  Zap,
  Rocket,
  Crown,
  ArrowBigUp,
  Users,
  Network,
  Star,
  Bird,
  Calendar,
  CalendarCheck,
};

interface BadgeCardProps {
  badge: BadgeType;
  earned?: boolean;
  earnedAt?: Date;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function BadgeCard({
  badge,
  earned = false,
  earnedAt,
  size = 'md',
  showTooltip = true,
}: BadgeCardProps) {
  const colors = RARITY_COLORS[badge.rarity];
  
  // Get the icon component
  const IconComponent = iconMap[badge.icon] || Award;

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
  };

  const iconSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  const content = (
    <div
      className={cn(
        'relative rounded-full border-2 flex items-center justify-center transition-all',
        sizeClasses[size],
        earned ? colors.bg : 'bg-gray-100 dark:bg-gray-800',
        earned ? colors.border : 'border-gray-300 dark:border-gray-600',
        !earned && 'opacity-40 grayscale',
        earned && 'hover:scale-110 cursor-pointer'
      )}
    >
      <IconComponent
        className={cn(
          iconSizeClasses[size],
          earned ? colors.text : 'text-gray-400 dark:text-gray-500'
        )}
      />
      
      {/* Shine effect for legendary badges */}
      {earned && badge.rarity === 'legendary' && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-pulse" />
      )}
    </div>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{badge.name}</span>
              <Badge
                variant="outline"
                className={cn('text-xs', colors.text, colors.border)}
              >
                {RARITY_LABELS[badge.rarity]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{badge.description}</p>
            {earned && earnedAt && (
              <p className="text-xs text-muted-foreground">
                Obtenu le {earnedAt.toLocaleDateString('fr-FR')}
              </p>
            )}
            {!earned && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {badge.condition}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
