'use client';

/**
 * Trophy Case 2.0 - Badge Unlock Modal
 * 
 * Modal de célébration quand un badge est débloqué.
 * Inclut :
 * - Animation d'entrée spectaculaire
 * - Confetti pour tous les badges
 * - Confetti doré pour les legendary
 * - Boutons de partage et navigation
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Share2,
  ExternalLink,
} from 'lucide-react';
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

export interface BadgeUnlockModalProps {
  badge: BadgeDefinition | null;
  open: boolean;
  onClose: () => void;
  onShare?: () => void;
  onViewTrophyCase?: () => void;
}

// ============================================
// CONFETTI CONFIG
// ============================================

const CONFETTI_DEFAULTS = {
  spread: 360,
  ticks: 100,
  gravity: 0.8,
  decay: 0.94,
  startVelocity: 30,
  shapes: ['square', 'circle'] as confetti.Shape[],
};

const TIER_CONFETTI_COLORS: Record<string, string[]> = {
  common: ['#6B7280', '#9CA3AF', '#D1D5DB'],
  rare: ['#3B82F6', '#60A5FA', '#93C5FD'],
  epic: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
  legendary: ['#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7'],
};

// ============================================
// COMPONENT
// ============================================

export function BadgeUnlockModal({
  badge,
  open,
  onClose,
  onShare,
  onViewTrophyCase,
}: BadgeUnlockModalProps) {
  
  // Lancer les confetti
  const fireConfetti = useCallback(() => {
    if (!badge) return;
    
    const colors = TIER_CONFETTI_COLORS[badge.tier];
    
    // Burst central
    confetti({
      ...CONFETTI_DEFAULTS,
      particleCount: badge.tier === 'legendary' ? 150 : 80,
      colors,
      origin: { x: 0.5, y: 0.5 },
    });
    
    // Side bursts pour legendary
    if (badge.tier === 'legendary') {
      setTimeout(() => {
        // Gauche
        confetti({
          ...CONFETTI_DEFAULTS,
          particleCount: 50,
          colors,
          angle: 60,
          origin: { x: 0, y: 0.6 },
        });
        // Droite
        confetti({
          ...CONFETTI_DEFAULTS,
          particleCount: 50,
          colors,
          angle: 120,
          origin: { x: 1, y: 0.6 },
        });
      }, 200);
      
      // Pluie d'or
      setTimeout(() => {
        confetti({
          ...CONFETTI_DEFAULTS,
          particleCount: 100,
          colors: ['#F59E0B', '#FBBF24'],
          gravity: 1.2,
          scalar: 0.8,
          origin: { x: 0.5, y: 0 },
        });
      }, 500);
    }
  }, [badge]);
  
  // Déclencher confetti à l'ouverture
  useEffect(() => {
    if (open && badge) {
      const timer = setTimeout(fireConfetti, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, badge, fireConfetti]);
  
  if (!badge) return null;
  
  const tierStyle = TIER_STYLES[badge.tier];
  const IconComponent = ICON_MAP[badge.icon] || Award;
  
  // Messages de célébration par tier
  const celebrationMessages: Record<string, string> = {
    common: 'Bien joué ! Continue comme ça !',
    rare: 'Impressionnant ! Tu progresses !',
    epic: 'Incroyable ! Un vrai exploit !',
    legendary: '🔥 LÉGENDAIRE ! Tu es au sommet !',
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <AnimatePresence>
          {open && (
            <>
              {/* Background glow pour legendary */}
              {badge.tier === 'legendary' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
              
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-center sr-only">
                  Nouveau badge débloqué !
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col items-center gap-6 py-4 relative z-10">
                {/* Titre animé */}
                <motion.div
                  className="text-center"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                    🎉 Nouveau badge !
                  </h2>
                </motion.div>
                
                {/* Badge avec animation */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  {/* Glow ring */}
                  <motion.div
                    className={cn(
                      'absolute inset-0 rounded-full blur-xl',
                      badge.tier === 'rare' && 'bg-blue-500/50',
                      badge.tier === 'epic' && 'bg-purple-500/50',
                      badge.tier === 'legendary' && 'bg-amber-500/60',
                    )}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Badge circle */}
                  <div
                    className={cn(
                      'relative w-28 h-28 rounded-full flex items-center justify-center border-4',
                      tierStyle.bgGradient,
                      tierStyle.glow,
                      badge.tier === 'legendary' ? 'border-amber-300' : tierStyle.border,
                    )}
                  >
                    <IconComponent className={cn('w-14 h-14', tierStyle.icon)} />
                    
                    {/* Sparkle effect pour legendary */}
                    {badge.tier === 'legendary' && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </div>
                </motion.div>
                
                {/* Nom et tier */}
                <motion.div
                  className="text-center space-y-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-xl font-bold">{badge.name}</h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-sm',
                      badge.tier === 'common' && 'border-gray-400 text-gray-600',
                      badge.tier === 'rare' && 'border-blue-400 text-blue-600 bg-blue-50',
                      badge.tier === 'epic' && 'border-purple-400 text-purple-600 bg-purple-50',
                      badge.tier === 'legendary' && 'border-amber-400 text-amber-600 bg-amber-50',
                    )}
                  >
                    {TIER_LABELS[badge.tier]}
                  </Badge>
                </motion.div>
                
                {/* Description */}
                <motion.p
                  className="text-center text-muted-foreground max-w-xs"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {badge.description}
                </motion.p>
                
                {/* Message de célébration */}
                <motion.p
                  className={cn(
                    'text-center font-medium',
                    badge.tier === 'legendary' && 'text-amber-600',
                    badge.tier === 'epic' && 'text-purple-600',
                    badge.tier === 'rare' && 'text-blue-600',
                  )}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {celebrationMessages[badge.tier]}
                </motion.p>
                
                {/* Actions */}
                <motion.div
                  className="flex gap-3 w-full"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {onShare && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onShare}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                  )}
                  <Button
                    className={cn(
                      'flex-1',
                      badge.tier === 'legendary' && 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700',
                    )}
                    onClick={onViewTrophyCase || onClose}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Voir mes badges
                  </Button>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default BadgeUnlockModal;
