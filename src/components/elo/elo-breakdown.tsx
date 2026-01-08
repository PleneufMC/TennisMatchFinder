'use client';

import { TrendingUp, TrendingDown, Info, Users, Trophy, Repeat, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ModifierDetail, ModifierType } from '@/lib/elo/types';

interface EloBreakdownProps {
  playerName: string;
  opponentName: string;
  opponentElo: number;
  isWinner: boolean;
  eloBefore: number;
  eloAfter: number;
  delta: number;
  kFactor: number;
  expectedScore: number;
  modifiers: {
    totalModifier: number;
    details: ModifierDetail[];
  };
  clubRank?: number;
  clubTotal?: number;
  compact?: boolean;
}

const modifierIcons: Record<ModifierType, React.ReactNode> = {
  new_opponent: <Users className="h-4 w-4" />,
  repetition: <Repeat className="h-4 w-4" />,
  upset: <Trophy className="h-4 w-4" />,
  weekly_diversity: <Sparkles className="h-4 w-4" />,
};

const modifierColors: Record<ModifierType, string> = {
  new_opponent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  repetition: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  upset: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  weekly_diversity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

export function EloBreakdown({
  playerName,
  opponentName,
  opponentElo,
  isWinner,
  eloBefore,
  eloAfter,
  delta,
  kFactor,
  expectedScore,
  modifiers,
  clubRank,
  clubTotal,
  compact = false,
}: EloBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  const winProbability = Math.round(expectedScore * 100);
  const resultText = isWinner ? 'Victoire' : 'Défaite';
  const resultColor = isWinner ? 'text-green-600' : 'text-red-600';
  const deltaColor = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600';
  const deltaIcon = delta > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />;

  // Calculer la base du delta (sans modificateurs)
  const baseDelta = Math.round(delta / modifiers.totalModifier);

  return (
    <Card className={cn(
      'overflow-hidden transition-all',
      isWinner ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className={resultColor}>{resultText}</span>
              <span className="text-muted-foreground font-normal">contre {opponentName}</span>
            </CardTitle>
            <CardDescription className="mt-1">
              {opponentName} • {opponentElo} ELO
            </CardDescription>
          </div>
          
          {/* Delta principal */}
          <div className={cn('flex items-center gap-2 text-2xl font-bold', deltaColor)}>
            {deltaIcon}
            <span>{delta > 0 ? '+' : ''}{delta}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Nouvel ELO */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Nouvel ELO</p>
            <p className="text-2xl font-bold">{eloAfter}</p>
          </div>
          {clubRank && clubTotal && (
            <Badge variant="secondary" className="text-sm">
              #{clubRank} / {clubTotal}
            </Badge>
          )}
        </div>

        {/* Barre de progression probabilité */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Probabilité de victoire estimée</span>
            <span className="font-medium">{winProbability}%</span>
          </div>
          <Progress value={winProbability} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {winProbability > 50 
              ? `Vous étiez favori (${winProbability}% de chances)`
              : winProbability < 50
                ? `Vous étiez outsider (${100 - winProbability}% de chances contre vous)`
                : 'Match équilibré (50/50)'
            }
          </p>
        </div>

        {/* Section détails (collapsible en mode compact) */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between" size="sm">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Détail du calcul
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-3 space-y-4">
            {/* Breakdown du calcul */}
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <h4 className="font-medium text-sm mb-3">Décomposition</h4>
              
              {/* Base */}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Points de base</span>
                <span className="font-mono text-sm">
                  {delta > 0 ? '+' : ''}{baseDelta}
                </span>
              </div>

              {/* Facteur K */}
              <div className="flex items-center justify-between py-1 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Facteur K</span>
                  <Badge variant="outline" className="text-xs">
                    {kFactor <= 16 ? 'Expert' : kFactor <= 24 ? 'Établi' : kFactor <= 32 ? 'Intermédiaire' : 'Nouveau'}
                  </Badge>
                </div>
                <span className="font-mono text-sm">{kFactor}</span>
              </div>

              {/* Modificateurs */}
              {modifiers.details.length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Modificateurs appliqués</p>
                  {modifiers.details.map((mod, index) => (
                    <div 
                      key={index}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-md',
                        modifierColors[mod.type]
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {modifierIcons[mod.type]}
                        <span className="text-sm">{mod.description}</span>
                      </div>
                      <span className="font-mono text-sm font-medium">
                        ×{mod.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {modifiers.details.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-2 border-t">
                  Aucun modificateur appliqué pour ce match
                </p>
              )}

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t font-medium">
                <span>Variation totale</span>
                <span className={cn('font-mono', deltaColor)}>
                  {delta > 0 ? '+' : ''}{delta} pts
                </span>
              </div>
            </div>

            {/* Formule */}
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
              <p className="font-medium mb-1">Formule ELO TennisMatchFinder :</p>
              <code className="text-[10px]">
                Δ = K × Modificateurs × (Résultat - Attendu)
              </code>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
