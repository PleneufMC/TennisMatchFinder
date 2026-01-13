'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowUp, 
  ArrowDown, 
  Info, 
  Zap, 
  Users, 
  RefreshCw, 
  Sparkles,
  Target,
  Percent
} from 'lucide-react';
import { FORMAT_LABELS, type MatchFormat } from '@/lib/elo/format-coefficients';
import type { EloBreakdown } from '@/lib/elo/calculator';
import { cn } from '@/lib/utils';

interface EloBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWinner: boolean;
  delta: number;
  newElo: number;
  breakdown: EloBreakdown;
  matchFormat: MatchFormat;
  opponentName?: string;
}

export function EloBreakdownModal({
  isOpen,
  onClose,
  isWinner,
  delta,
  newElo,
  breakdown,
  matchFormat,
  opponentName,
}: EloBreakdownModalProps) {
  const formatLabel = FORMAT_LABELS[matchFormat] || matchFormat;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isWinner ? (
              <ArrowUp className="h-5 w-5 text-green-500" />
            ) : (
              <ArrowDown className="h-5 w-5 text-red-500" />
            )}
            {isWinner ? 'Victoire !' : 'Défaite'}
            {opponentName && (
              <span className="text-muted-foreground font-normal text-sm">
                vs {opponentName}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Détail du calcul de votre changement ELO
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résultat principal */}
          <div className="text-center py-6 bg-muted rounded-lg">
            <div className={cn(
              'text-5xl font-bold',
              isWinner ? 'text-green-500' : 'text-red-500'
            )}>
              {delta > 0 ? '+' : ''}{delta}
            </div>
            <div className="text-lg text-muted-foreground mt-1">
              points ELO
            </div>
            <Separator className="my-4" />
            <div className="text-muted-foreground">
              Nouveau classement : <span className="font-bold text-foreground text-xl">{newElo}</span>
            </div>
          </div>

          {/* Probabilité de victoire */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Probabilité de victoire attendue</span>
            </div>
            <Badge variant="outline" className="text-blue-600">
              {breakdown.winProbability}%
            </Badge>
          </div>

          {/* Breakdown détaillé */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Détail du calcul
            </h4>
            
            <div className="space-y-2 text-sm">
              {/* Base */}
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Changement de base</span>
                  <Badge variant="outline" className="text-xs">
                    K={breakdown.kFactor}
                  </Badge>
                </div>
                <span className="font-mono">
                  {isWinner ? '+' : '-'}{breakdown.rawChange}
                </span>
              </div>

              {/* Format */}
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>Format ({formatLabel})</span>
                </div>
                <Badge 
                  variant={breakdown.formatCoefficient < 1 ? 'secondary' : 'default'}
                  className={cn(
                    breakdown.formatCoefficient === 1.0 && 'bg-green-600',
                    breakdown.formatCoefficient === 0.8 && 'bg-blue-600',
                    breakdown.formatCoefficient === 0.5 && 'bg-amber-600',
                    breakdown.formatCoefficient === 0.3 && 'bg-purple-600'
                  )}
                >
                  ×{breakdown.formatCoefficient}
                </Badge>
              </div>

              {/* Marge de victoire */}
              {breakdown.marginModifier !== 1 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span>{breakdown.marginLabel}</span>
                  </div>
                  <Badge variant={breakdown.marginModifier > 1 ? 'default' : 'secondary'}>
                    ×{breakdown.marginModifier}
                  </Badge>
                </div>
              )}

              {/* Nouvel adversaire */}
              {breakdown.newOpponentBonus > 1 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span>🆕 Nouvel adversaire</span>
                  </div>
                  <Badge className="bg-green-600">×{breakdown.newOpponentBonus}</Badge>
                </div>
              )}

              {/* Upset bonus */}
              {breakdown.upsetBonus > 1 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>⚡ Victoire exploit !</span>
                  </div>
                  <Badge className="bg-amber-600">×{breakdown.upsetBonus}</Badge>
                </div>
              )}

              {/* Répétition malus */}
              {breakdown.repetitionMalus < 1 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-500" />
                    <span>🔄 Adversaire répété</span>
                  </div>
                  <Badge variant="secondary">×{breakdown.repetitionMalus}</Badge>
                </div>
              )}

              {/* Diversité bonus */}
              {breakdown.diversityBonus > 1 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>🌈 Bonus diversité</span>
                  </div>
                  <Badge className="bg-purple-600">×{breakdown.diversityBonus}</Badge>
                </div>
              )}

              {/* Résultat final */}
              <div className="flex justify-between items-center py-3 font-medium bg-muted rounded-lg px-3 mt-2">
                <span>Résultat final</span>
                <span className={cn(
                  'font-mono text-lg',
                  isWinner ? 'text-green-500' : 'text-red-500'
                )}>
                  {delta > 0 ? '+' : ''}{breakdown.finalChange}
                </span>
              </div>
            </div>
          </div>

          {/* Message explicatif */}
          {breakdown.formatCoefficient < 1 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-sm">
              <p className="text-blue-800 dark:text-blue-200">
                <strong>💡 Impact réduit</strong> : Les matchs en {formatLabel.toLowerCase()} ont 
                plus de variance statistique. Joue en 2 ou 3 sets pour un impact complet !
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Composant inline pour afficher le breakdown sans modal
 */
export function EloBreakdownInline({
  isWinner,
  delta,
  breakdown,
  matchFormat,
}: {
  isWinner: boolean;
  delta: number;
  breakdown: EloBreakdown;
  matchFormat: MatchFormat;
}) {
  const formatLabel = FORMAT_LABELS[matchFormat] || matchFormat;
  
  // Construire la formule
  const parts: string[] = [];
  parts.push(`Base: ${isWinner ? '+' : ''}${breakdown.rawChange}`);
  
  if (breakdown.formatCoefficient !== 1) {
    parts.push(`Format ${formatLabel} (×${breakdown.formatCoefficient})`);
  }
  if (breakdown.marginModifier !== 1) {
    parts.push(`${breakdown.marginLabel} (×${breakdown.marginModifier})`);
  }
  if (breakdown.newOpponentBonus > 1) {
    parts.push(`Nouvel adv. (×${breakdown.newOpponentBonus})`);
  }
  if (breakdown.upsetBonus > 1) {
    parts.push(`Exploit (×${breakdown.upsetBonus})`);
  }
  if (breakdown.repetitionMalus < 1) {
    parts.push(`Répétition (×${breakdown.repetitionMalus})`);
  }
  if (breakdown.diversityBonus > 1) {
    parts.push(`Diversité (×${breakdown.diversityBonus})`);
  }

  return (
    <div className="text-sm text-muted-foreground">
      <span className={cn(
        'font-bold',
        isWinner ? 'text-green-500' : 'text-red-500'
      )}>
        {delta > 0 ? '+' : ''}{delta} ELO
      </span>
      <span className="mx-2">→</span>
      <span>{parts.join(' × ')}</span>
      <span className="mx-2">=</span>
      <span className="font-medium">{delta > 0 ? '+' : ''}{breakdown.finalChange}</span>
    </div>
  );
}
