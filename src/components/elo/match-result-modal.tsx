'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, X, Share2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EloBreakdown } from './elo-breakdown';
import { cn } from '@/lib/utils';
import type { ModifiersResult } from '@/lib/elo/types';

interface MatchResultModalProps {
  open: boolean;
  onClose: () => void;
  isWinner: boolean;
  playerName: string;
  opponentName: string;
  opponentElo: number;
  score: string;
  eloBefore: number;
  eloAfter: number;
  delta: number;
  kFactor: number;
  expectedScore: number;
  modifiers: ModifiersResult;
  clubRank?: number;
  clubTotal?: number;
  newBadges?: Array<{ id: string; name: string; rarity: string }>;
}

export function MatchResultModal({
  open,
  onClose,
  isWinner,
  playerName,
  opponentName,
  opponentElo,
  score,
  eloBefore,
  eloAfter,
  delta,
  kFactor,
  expectedScore,
  modifiers,
  clubRank,
  clubTotal,
  newBadges = [],
}: MatchResultModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Confetti pour les victoires
  useEffect(() => {
    if (open && isWinner && !showConfetti) {
      setShowConfetti(true);
      
      // Confetti de victoire
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      
      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#16a34a', '#15803d'],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#16a34a', '#15803d'],
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [open, isWinner, showConfetti]);

  // Reset confetti state when modal closes
  useEffect(() => {
    if (!open) {
      setShowConfetti(false);
    }
  }, [open]);

  // Confetti supplémentaire pour les badges légendaires
  useEffect(() => {
    if (open && newBadges.some(b => b.rarity === 'legendary')) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#eab308', '#fcd34d'],
        });
      }, 500);
    }
  }, [open, newBadges]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isWinner ? (
              <>
                <Trophy className="h-6 w-6 text-green-500" />
                <span className="text-green-600">Victoire !</span>
              </>
            ) : (
              <>
                <span className="text-2xl">😔</span>
                <span className="text-red-600">Défaite</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            contre {opponentName} • Score : {score}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Animation du delta ELO */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="flex justify-center py-4"
              >
                <div className={cn(
                  'text-center p-6 rounded-2xl',
                  delta > 0 
                    ? 'bg-green-50 dark:bg-green-900/20' 
                    : 'bg-red-50 dark:bg-red-900/20'
                )}>
                  <motion.p
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={cn(
                      'text-5xl font-bold',
                      delta > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {delta > 0 ? '+' : ''}{delta}
                  </motion.p>
                  <p className="text-sm text-muted-foreground mt-1">points ELO</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl font-bold mt-2"
                  >
                    {eloAfter} ELO
                  </motion.p>
                  {clubRank && clubTotal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Badge variant="secondary" className="mt-2">
                        #{clubRank} du club
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nouveaux badges débloqués */}
          {newBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            >
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                🏆 Nouveau{newBadges.length > 1 ? 'x' : ''} badge{newBadges.length > 1 ? 's' : ''} débloqué{newBadges.length > 1 ? 's' : ''} !
              </h4>
              <div className="flex flex-wrap gap-2">
                {newBadges.map((badge) => (
                  <Badge 
                    key={badge.id}
                    variant="outline"
                    className={cn(
                      badge.rarity === 'legendary' && 'border-amber-500 bg-amber-100 dark:bg-amber-900/50',
                      badge.rarity === 'epic' && 'border-purple-500 bg-purple-100 dark:bg-purple-900/50',
                      badge.rarity === 'rare' && 'border-blue-500 bg-blue-100 dark:bg-blue-900/50',
                    )}
                  >
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Breakdown ELO compact */}
          <EloBreakdown
            playerName={playerName}
            opponentName={opponentName}
            opponentElo={opponentElo}
            isWinner={isWinner}
            eloBefore={eloBefore}
            eloAfter={eloAfter}
            delta={delta}
            kFactor={kFactor}
            expectedScore={expectedScore}
            modifiers={modifiers}
            compact={true}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Fermer
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Voir mes matchs
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
