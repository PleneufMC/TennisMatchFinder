'use client';

/**
 * Trophy Case 2.0 - BadgeCard Component
 * 
 * Affiche un badge avec 3 états possibles :
 * - LOCKED : Badge non débloqué (grisé avec critère visible)
 * - UNLOCKED : Badge débloqué avec style selon tier
 * - JUST_UNLOCKED : Badge venant d'être débloqué (animation)
 * 
 * 4 Tiers visuels :
 * - Common : Gris/Blanc
 * - Rare : Bleu avec glow
 * - Epic : Violet avec glow prononcé
 * - Legendary : Or avec animation pulse
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  type LucideIcon,
  Sparkles,
  Target,
  Activity,
  Flame,
  Trophy,
  Zap,
  Sword,
  TrendingUp,
  Users,
  Building,
  Swords,
  HandHeart,
  Crown,
  Star,
  Medal,
  Award,
  Lock,
  Share2,
} from 'lucide-react';
import type { BadgeTier, BadgeCategory } from '@/lib/db/schema';
import { TIER_STYLES, TIER_LABELS, type BadgeDefinition } from '@/lib/gamification/badges';

// Map des icônes
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Target,
  Activity,
  Flame,
  Trophy,
  Zap,
  Sword,
  TrendingUp,
  Users,
  Building,
  Swords,
  HandHeart,
  Crown,
  Star,
  Medal,
  Award,
};

// ============================================
// TYPES
// ============================================

export type BadgeState = 'locked' | 'unlocked' | 'just_unlocked';

export interface BadgeCardProps {
  badge: BadgeDefinition;
  state?: BadgeState;
  earnedAt?: Date;
  progress?: number; // Progression actuelle
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  showProgress?: boolean;
  onShare?: () => void;
  onClick?: () => void;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function BadgeCard({
  badge,
  state = 'locked',
  earnedAt,
  progress = 0,
  size = 'md',
  showTooltip = true,
  showProgress = true,
  onShare,
  onClick,
  className,
}: BadgeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isUnlocked = state === 'unlocked' || state === 'just_unlocked';
  const tierStyle = TIER_STYLES[badge.tier];
  const IconComponent = ICON_MAP[badge.icon] || Award;
  
  // Tailles
  const sizeClasses = {
    sm: { container: 'w-12 h-12', icon: 'w-6 h-6', indicator: 'w-4 h-4' },
    md: { container: 'w-16 h-16', icon: 'w-8 h-8', indicator: 'w-5 h-5' },
    lg: { container: 'w-24 h-24', icon: 'w-12 h-12', indicator: 'w-6 h-6' },
  };
  
  const sizes = sizeClasses[size];
  
  // Calcul progression
  const maxProgress = badge.maxProgress || 1;
  const progressPercent = Math.min((progress / maxProgress) * 100, 100);
  const hasProgress = badge.maxProgress && badge.maxProgress > 1;
  
  // Contenu du badge
  const badgeContent = (
    <motion.div
      className={cn('relative group cursor-pointer', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: isUnlocked ? 1.1 : 1.02 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Container principal */}
      <div
        className={cn(
          'rounded-full flex items-center justify-center border-2 transition-all duration-300',
          sizes.container,
          isUnlocked
            ? cn(tierStyle.bgGradient, tierStyle.glow, tierStyle.border, tierStyle.animation)
            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50',
        )}
      >
        {/* Icône */}
        <IconComponent
          className={cn(
            sizes.icon,
            'transition-all duration-300',
            isUnlocked ? tierStyle.icon : 'text-gray-400 dark:text-gray-500',
          )}
        />
        
        {/* Overlay lock pour badges non débloqués */}
        {!isUnlocked && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/20">
            <Lock className="w-4 h-4 text-gray-500" />
          </div>
        )}
        
        {/* Shine effect pour legendary */}
        {isUnlocked && badge.tier === 'legendary' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      
      {/* Indicateur de tier pour badges débloqués */}
      {isUnlocked && badge.tier !== 'common' && (
        <motion.div
          className={cn(
            'absolute -bottom-1 -right-1 rounded-full flex items-center justify-center',
            sizes.indicator,
            badge.tier === 'rare' && 'bg-blue-500',
            badge.tier === 'epic' && 'bg-purple-500',
            badge.tier === 'legendary' && 'bg-gradient-to-br from-yellow-400 to-amber-600',
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <Star className="w-3 h-3 text-white" />
        </motion.div>
      )}
      
      {/* Bouton partage (visible au hover pour badges débloqués) */}
      <AnimatePresence>
        {isUnlocked && isHovered && onShare && (
          <motion.button
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
          >
            <Share2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
  
  // Tooltip content
  const tooltipContent = (
    <div className="space-y-2 max-w-xs">
      {/* Header avec nom et tier */}
      <div className="flex items-center gap-2">
        <span className="font-semibold">{badge.name}</span>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            badge.tier === 'common' && 'border-gray-400 text-gray-600',
            badge.tier === 'rare' && 'border-blue-400 text-blue-600',
            badge.tier === 'epic' && 'border-purple-400 text-purple-600',
            badge.tier === 'legendary' && 'border-amber-400 text-amber-600',
          )}
        >
          {TIER_LABELS[badge.tier]}
        </Badge>
      </div>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground">{badge.description}</p>
      
      {/* Critère ou date d'obtention */}
      {isUnlocked ? (
        earnedAt && (
          <p className="text-xs text-muted-foreground">
            Obtenu le {earnedAt.toLocaleDateString('fr-FR')}
          </p>
        )
      ) : (
        <>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {badge.criteria}
          </p>
          
          {/* Barre de progression */}
          {hasProgress && showProgress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progression</span>
                <span>{progress} / {maxProgress}</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
        </>
      )}
    </div>
  );
  
  if (!showTooltip) {
    return badgeContent;
  }
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default BadgeCard;
