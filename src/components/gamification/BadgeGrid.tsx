'use client';

/**
 * Trophy Case 2.0 - BadgeGrid Component
 * 
 * Grille de badges avec filtres par catégorie.
 * Affiche tous les badges disponibles avec leur état (locked/unlocked).
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BadgeCard, type BadgeState } from './BadgeCard';
import { 
  BADGE_DEFINITIONS, 
  CATEGORY_LABELS, 
  CATEGORY_ICONS,
  type BadgeDefinition,
} from '@/lib/gamification/badges';
import type { BadgeCategory } from '@/lib/db/schema';
import {
  Flag,
  Medal,
  Users,
  Star,
} from 'lucide-react';

// Map des icônes de catégorie
const CATEGORY_ICON_MAP = {
  milestone: Flag,
  achievement: Medal,
  social: Users,
  special: Star,
};

// ============================================
// TYPES
// ============================================

export interface PlayerBadgeData {
  badgeId: string;
  earnedAt: Date;
  progress: number;
  seen: boolean;
}

export interface BadgeGridProps {
  playerBadges: PlayerBadgeData[];
  onBadgeClick?: (badge: BadgeDefinition) => void;
  onBadgeShare?: (badge: BadgeDefinition) => void;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function BadgeGrid({
  playerBadges,
  onBadgeClick,
  onBadgeShare,
  className,
}: BadgeGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  
  // Map des badges du joueur pour lookup rapide
  const playerBadgeMap = useMemo(() => {
    const map = new Map<string, PlayerBadgeData>();
    playerBadges.forEach(pb => map.set(pb.badgeId, pb));
    return map;
  }, [playerBadges]);
  
  // Stats par catégorie
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; earned: number }> = {
      milestone: { total: 0, earned: 0 },
      achievement: { total: 0, earned: 0 },
      social: { total: 0, earned: 0 },
      special: { total: 0, earned: 0 },
    };
    
    BADGE_DEFINITIONS.forEach(badge => {
      const categoryStat = stats[badge.category];
      if (categoryStat) {
        categoryStat.total++;
        if (playerBadgeMap.has(badge.id)) {
          categoryStat.earned++;
        }
      }
    });
    
    return stats;
  }, [playerBadgeMap]);
  
  // Total stats
  const totalStats = useMemo(() => ({
    total: BADGE_DEFINITIONS.length,
    earned: playerBadges.length,
  }), [playerBadges.length]);
  
  // Filtrer les badges par catégorie
  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') {
      return BADGE_DEFINITIONS;
    }
    return BADGE_DEFINITIONS.filter(b => b.category === selectedCategory);
  }, [selectedCategory]);
  
  // Trier : débloqués d'abord, puis par tier (legendary > epic > rare > common)
  const sortedBadges = useMemo(() => {
    const tierOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    
    return [...filteredBadges].sort((a, b) => {
      const aUnlocked = playerBadgeMap.has(a.id) ? 0 : 1;
      const bUnlocked = playerBadgeMap.has(b.id) ? 0 : 1;
      
      // D'abord par état (débloqué en premier)
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      
      // Ensuite par tier
      return tierOrder[a.tier] - tierOrder[b.tier];
    });
  }, [filteredBadges, playerBadgeMap]);
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header avec stats globales */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trophy Case</h2>
          <p className="text-muted-foreground">
            {totalStats.earned} / {totalStats.total} badges débloqués
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${(totalStats.earned / totalStats.total) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="text-sm font-medium">
            {Math.round((totalStats.earned / totalStats.total) * 100)}%
          </span>
        </div>
      </div>
      
      {/* Filtres par catégorie */}
      <Tabs
        value={selectedCategory}
        onValueChange={(v) => setSelectedCategory(v as BadgeCategory | 'all')}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="flex items-center gap-2">
            Tous
            <Badge variant="secondary" className="ml-1">
              {totalStats.earned}/{totalStats.total}
            </Badge>
          </TabsTrigger>
          
          {(Object.keys(CATEGORY_LABELS) as BadgeCategory[]).map(category => {
            const IconComponent = CATEGORY_ICON_MAP[category];
            const stats = categoryStats[category] || { total: 0, earned: 0 };
            
            return (
              <TabsTrigger
                key={category}
                value={category}
                className="flex items-center gap-2"
              >
                <IconComponent className="w-4 h-4" />
                {CATEGORY_LABELS[category]}
                <Badge variant="secondary" className="ml-1">
                  {stats.earned}/{stats.total}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      
      {/* Grille de badges */}
      <motion.div
        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4"
        layout
      >
        <AnimatePresence mode="popLayout">
          {sortedBadges.map((badge, index) => {
            const playerBadge = playerBadgeMap.get(badge.id);
            const isUnlocked = !!playerBadge;
            const state: BadgeState = isUnlocked 
              ? (playerBadge.seen ? 'unlocked' : 'just_unlocked')
              : 'locked';
            
            return (
              <motion.div
                key={badge.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.02 }}
                className="flex justify-center"
              >
                <BadgeCard
                  badge={badge}
                  state={state}
                  earnedAt={playerBadge?.earnedAt}
                  progress={playerBadge?.progress ?? 0}
                  onClick={() => onBadgeClick?.(badge)}
                  onShare={isUnlocked ? () => onBadgeShare?.(badge) : undefined}
                  showProgress={!isUnlocked}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      
      {/* Message si aucun badge dans la catégorie */}
      {sortedBadges.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun badge dans cette catégorie.
        </div>
      )}
    </div>
  );
}

export default BadgeGrid;
