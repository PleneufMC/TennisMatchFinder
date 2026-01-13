'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type LucideIcon, X, Award, Sparkles, Target, Flame, Trophy, TrendingUp, Sword, Zap, Rocket, Crown, ArrowBigUp, Users, Network, Star, Bird, Activity, Building, Swords, HandHeart, Medal, Calendar, CalendarCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { type BadgeDefinition, RARITY_COLORS, RARITY_LABELS } from '@/lib/gamification/badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Activity,
  Building,
  Swords,
  HandHeart,
  Medal,
  Calendar,
  CalendarCheck,
};

interface BadgeNotificationProps {
  badge: BadgeDefinition;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function BadgeNotification({
  badge,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
}: BadgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const colors = RARITY_COLORS[badge.tier];

  // Get the icon component
  const IconComponent = iconMap[badge.icon] || Award;

  // Trigger confetti for legendary badges
  useEffect(() => {
    if (badge.tier === 'legendary' || badge.tier === 'epic') {
      confetti({
        particleCount: badge.tier === 'legendary' ? 100 : 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#eab308', '#fcd34d'],
      });
    }
  }, [badge.tier]);

  // Auto-hide after delay
  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoHide, autoHideDelay, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div
            className={cn(
              'relative p-4 rounded-xl border-2 shadow-xl backdrop-blur-sm',
              'bg-white/95 dark:bg-gray-900/95',
              colors.border
            )}
          >
            {/* Glow effect for rare+ badges */}
            {(badge.tier === 'rare' ||
              badge.tier === 'epic' ||
              badge.tier === 'legendary') && (
              <div
                className={cn(
                  'absolute inset-0 -z-10 rounded-xl blur-xl opacity-30',
                  badge.tier === 'legendary' && 'bg-amber-400',
                  badge.tier === 'epic' && 'bg-purple-400',
                  badge.tier === 'rare' && 'bg-blue-400'
                )}
              />
            )}

            <div className="flex items-start gap-4">
              {/* Badge Icon */}
              <div
                className={cn(
                  'relative h-16 w-16 rounded-full flex items-center justify-center border-2',
                  colors.bg,
                  colors.border
                )}
              >
                <IconComponent className={cn('h-8 w-8', colors.text)} />
                
                {/* Shine animation for legendary */}
                {badge.tier === 'legendary' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/50 to-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-amber-600">
                    🏆 Nouveau badge !
                  </span>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', colors.text, colors.border)}
                  >
                    {RARITY_LABELS[badge.tier]}
                  </Badge>
                </div>
                <h3 className="font-bold text-lg">{badge.name}</h3>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook pour gérer les notifications de badges multiples
 */
export function useBadgeNotifications() {
  const [queue, setQueue] = useState<BadgeDefinition[]>([]);
  const [current, setCurrent] = useState<BadgeDefinition | null>(null);

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next ?? null);
      setQueue(rest);
    }
  }, [current, queue]);

  const addBadge = (badge: BadgeDefinition) => {
    setQueue((prev) => [...prev, badge]);
  };

  const addBadges = (badges: BadgeDefinition[]) => {
    setQueue((prev) => [...prev, ...badges]);
  };

  const dismissCurrent = () => {
    setCurrent(null);
  };

  return {
    current,
    addBadge,
    addBadges,
    dismissCurrent,
    hasQueue: queue.length > 0,
  };
}
