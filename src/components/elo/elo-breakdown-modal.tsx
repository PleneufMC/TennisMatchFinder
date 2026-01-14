'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Info,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Users,
  Repeat,
  Sparkles,
  Trophy,
  HelpCircle,
  Calculator,
  ChevronRight,
  Award,
} from 'lucide-react';
import type { EloBreakdown } from '@/lib/elo/calculator';

interface EloBreakdownModalProps {
  breakdown: EloBreakdown;
  winnerName: string;
  loserName: string;
  winnerEloBefore: number;
  loserEloBefore: number;
  winnerEloAfter: number;
  loserEloAfter: number;
  score: string;
  isCurrentUserWinner?: boolean;
  trigger?: React.ReactNode;
}

export function EloBreakdownModal({
  breakdown,
  winnerName,
  loserName,
  winnerEloBefore,
  loserEloBefore,
  winnerEloAfter,
  loserEloAfter,
  score,
  isCurrentUserWinner,
  trigger,
}: EloBreakdownModalProps) {
  const [open, setOpen] = useState(false);

  const winnerDelta = winnerEloAfter - winnerEloBefore;
  const loserDelta = loserEloAfter - loserEloBefore;

  // Calcul des modificateurs actifs
  const activeModifiers = [];
  if (breakdown.formatCoefficient !== 1.0) {
    activeModifiers.push({
      label: `Format ${breakdown.formatLabel}`,
      value: breakdown.formatCoefficient,
      icon: Target,
      color: breakdown.formatCoefficient < 1 ? 'text-orange-500' : 'text-green-500',
      description: breakdown.formatCoefficient < 1 
        ? 'Impact réduit (format court)' 
        : 'Impact complet',
    });
  }
  if (breakdown.marginModifier !== 1.0) {
    activeModifiers.push({
      label: breakdown.marginLabel,
      value: breakdown.marginModifier,
      icon: breakdown.marginModifier > 1 ? TrendingUp : TrendingDown,
      color: breakdown.marginModifier > 1 ? 'text-green-500' : 'text-orange-500',
      description: breakdown.marginModifier > 1 
        ? 'Bonus victoire écrasante' 
        : 'Réduction match serré',
    });
  }
  if (breakdown.newOpponentBonus > 1) {
    activeModifiers.push({
      label: 'Nouvel adversaire',
      value: breakdown.newOpponentBonus,
      icon: Users,
      color: 'text-blue-500',
      description: '+15% pour diversifier vos matchs',
    });
  }
  if (breakdown.upsetBonus > 1) {
    activeModifiers.push({
      label: 'Victoire exploit !',
      value: breakdown.upsetBonus,
      icon: Trophy,
      color: 'text-amber-500',
      description: '+20% pour battre un joueur +100 ELO',
    });
  }
  if (breakdown.repetitionMalus < 1) {
    activeModifiers.push({
      label: 'Matchs répétés',
      value: breakdown.repetitionMalus,
      icon: Repeat,
      color: 'text-red-500',
      description: 'Réduction pour matchs fréquents vs même adversaire',
    });
  }
  if (breakdown.diversityBonus > 1) {
    activeModifiers.push({
      label: 'Bonus diversité',
      value: breakdown.diversityBonus,
      icon: Sparkles,
      color: 'text-purple-500',
      description: '+10% pour 3+ adversaires cette semaine',
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Comment est calculé l&apos;ELO ?</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Détail du calcul ELO
          </DialogTitle>
          <DialogDescription>
            Transparence totale sur l&apos;évolution de votre classement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Résultat du match */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Résultat</p>
              <p className="text-2xl font-bold">{score}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="default" className="bg-green-600">
                  {winnerName}
                </Badge>
                <span className="text-muted-foreground">bat</span>
                <Badge variant="outline">
                  {loserName}
                </Badge>
              </div>
            </div>
          </div>

          {/* Changements ELO */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${isCurrentUserWinner === true ? 'bg-green-50 dark:bg-green-950 ring-2 ring-green-500' : 'bg-muted/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{winnerName}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground">{winnerEloBefore}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-xl font-bold">{winnerEloAfter}</span>
              </div>
              <Badge className="bg-green-600 mt-2">+{winnerDelta}</Badge>
            </div>

            <div className={`p-4 rounded-lg ${isCurrentUserWinner === false ? 'bg-red-50 dark:bg-red-950 ring-2 ring-red-500' : 'bg-muted/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">{loserName}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground">{loserEloBefore}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-xl font-bold">{loserEloAfter}</span>
              </div>
              <Badge variant="destructive" className="mt-2">{loserDelta}</Badge>
            </div>
          </div>

          <Separator />

          {/* Formule */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Formule de calcul
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm">
              <p className="text-muted-foreground mb-2">Δ ELO = K × (1 - P) × Modificateurs</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">K (facteur) =</span>
                  <span className="ml-1 font-bold">{breakdown.kFactor}</span>
                  <span className="text-muted-foreground ml-1">({breakdown.kFactorLabel})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">P (proba victoire) =</span>
                  <span className="ml-1 font-bold">{breakdown.winProbability}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Probabilité de victoire */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Probabilité de victoire
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{winnerName}</span>
                <span className="font-bold">{breakdown.winProbability}%</span>
              </div>
              <Progress value={breakdown.winProbability} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {breakdown.winProbability > 70 
                  ? `${winnerName} était favori, gain ELO modéré`
                  : breakdown.winProbability < 30
                  ? `${winnerName} était outsider, gain ELO important !`
                  : 'Match équilibré, gain ELO standard'}
              </p>
            </div>
          </div>

          {/* Modificateurs appliqués */}
          {activeModifiers.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Modificateurs appliqués
                </h4>
                <div className="space-y-2">
                  {activeModifiers.map((mod, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <mod.icon className={`h-4 w-4 ${mod.color}`} />
                        <div>
                          <p className="text-sm font-medium">{mod.label}</p>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </div>
                      </div>
                      <Badge variant={mod.value > 1 ? 'default' : 'secondary'} className={mod.value > 1 ? 'bg-green-600' : ''}>
                        ×{mod.value.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Résumé du calcul */}
          <Separator />
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Résumé du calcul
            </h4>
            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Changement brut</span>
                <span>{breakdown.rawChange} points</span>
              </div>
              {activeModifiers.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total modificateurs (×{activeModifiers.reduce((acc, m) => acc * m.value, 1).toFixed(2)})
                  </span>
                  <span>{breakdown.formatCoefficient !== 1 ? `Format ×${breakdown.formatCoefficient}` : ''}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Changement final</span>
                <span className="text-green-600">+{breakdown.finalChange} points</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Le perdant perd 80% du gain du gagnant ({Math.abs(loserDelta)} points)
              </p>
            </div>
          </div>

          {/* Note USP */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Pourquoi cette transparence ?
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Contrairement à d&apos;autres plateformes, TennisMatchFinder vous montre 
                  exactement comment votre ELO est calculé. Chaque modificateur est visible 
                  et justifié pour un système juste et compréhensible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Version compacte pour affichage inline
 */
export function EloChangeDisplay({
  delta,
  showSign = true,
  size = 'default',
}: {
  delta: number;
  showSign?: boolean;
  size?: 'sm' | 'default' | 'lg';
}) {
  const isPositive = delta > 0;
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    default: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center font-bold rounded
        ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}
        ${sizeClasses[size]}
      `}
    >
      {showSign && (isPositive ? '+' : '')}
      {delta}
    </span>
  );
}
