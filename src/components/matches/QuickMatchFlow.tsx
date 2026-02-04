'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Search,
  User,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useGoogleAnalytics } from '@/components/google-analytics';
import { trackFirstMatchRegistered, trackMatchRegistered } from '@/lib/analytics';

// ============================================
// TYPES & VALIDATION
// ============================================

type Step = 'opponent' | 'score' | 'confirm';

interface Player {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  currentElo: number;
}

interface MatchData {
  opponentId: string;
  opponent?: Player;
  winnerId: string;
  score: string;
  matchFormat: string;
  playedAt: string;
}

const matchSchema = z.object({
  opponentId: z.string().min(1, 'Sélectionne un adversaire'),
  winnerId: z.string().min(1, 'Indique le vainqueur'),
  score: z.string().min(3, 'Score invalide').max(50, 'Score trop long'),
  matchFormat: z.string().min(1, 'Choisis un format'),
  playedAt: z.string().min(1, 'Indique la date du match'),
});

// ============================================
// QUICK MATCH FLOW COMPONENT
// ============================================

interface QuickMatchFlowProps {
  clubId: string;
  currentPlayerId: string;
  currentPlayerName: string;
  clubPlayers: Player[];
  suggestedOpponents?: Player[];
}

/**
 * QuickMatchFlow - Simplified 3-step match registration
 * 
 * Steps:
 * 1. Select opponent (with suggestions)
 * 2. Enter score and winner
 * 3. Confirm and submit
 * 
 * Sprint Février 2026 - Activation Priority
 */
export function QuickMatchFlow({
  clubId,
  currentPlayerId,
  currentPlayerName,
  clubPlayers,
  suggestedOpponents = [],
}: QuickMatchFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('opponent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchData, setMatchData] = useState<Partial<MatchData>>({
    matchFormat: 'two_sets',
    playedAt: new Date().toISOString().split('T')[0],
  });

  const { trackEvent } = useGoogleAnalytics();

  // Filter players based on search
  const filteredPlayers = clubPlayers
    .filter(p => p.id !== currentPlayerId)
    .filter(p => 
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Progress calculation
  const stepIndex = ['opponent', 'score', 'confirm'].indexOf(step);
  const progress = ((stepIndex + 1) / 3) * 100;

  // Step navigation
  const goToStep = (newStep: Step) => {
    trackEvent('quick_match_step', {
      from_step: step,
      to_step: newStep,
      event_category: 'match_registration',
    });
    setStep(newStep);
  };

  // Handle opponent selection
  const selectOpponent = (player: Player) => {
    setMatchData(prev => ({
      ...prev,
      opponentId: player.id,
      opponent: player,
    }));
    goToStep('score');
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!matchData.opponentId || !matchData.winnerId || !matchData.score) {
      toast.error('Données incomplètes');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          opponentId: matchData.opponentId,
          winnerId: matchData.winnerId,
          score: matchData.score,
          matchFormat: matchData.matchFormat,
          playedAt: matchData.playedAt,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'enregistrement');
      }

      // Track analytics
      if (result.activation?.isFirstMatch) {
        trackFirstMatchRegistered(
          result.activation.daysSinceSignup,
          result.activation.opponentType || 'manual',
          matchData.matchFormat || 'two_sets',
          matchData.winnerId === currentPlayerId
        );
      }

      trackMatchRegistered(
        result.match.id,
        (matchData.opponent?.currentElo || 1200) - 1200, // Approximate ELO diff
        matchData.matchFormat || 'two_sets',
        true, // Assume new opponent for now
        suggestedOpponents.some(s => s.id === matchData.opponentId)
      );

      toast.success('Match enregistré !', {
        description: 'En attente de confirmation par ton adversaire.',
      });

      // Redirect to matches page
      router.push('/matchs');
    } catch (error) {
      console.error('Match submission error:', error);
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Étape {stepIndex + 1} sur 3</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {['Adversaire', 'Score', 'Confirmer'].map((label, i) => (
            <div
              key={label}
              className={cn(
                'flex flex-col items-center gap-1',
                i <= stepIndex ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  i < stepIndex
                    ? 'bg-primary text-primary-foreground'
                    : i === stepIndex
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted'
                )}
              >
                {i < stepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card>
        {step === 'opponent' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Qui était ton adversaire ?
              </CardTitle>
              <CardDescription>
                Sélectionne le joueur contre qui tu as joué
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un joueur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Suggested opponents */}
              {suggestedOpponents.length > 0 && !searchQuery && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Suggestions
                  </p>
                  <div className="space-y-2">
                    {suggestedOpponents.slice(0, 3).map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        onClick={() => selectOpponent(player)}
                        highlighted
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All players */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {searchQuery ? 'Résultats' : 'Tous les joueurs'}
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onClick={() => selectOpponent(player)}
                    />
                  ))}
                  {filteredPlayers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun joueur trouvé
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 'score' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Résultat du match
              </CardTitle>
              <CardDescription>
                vs {matchData.opponent?.fullName || 'Adversaire'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Winner selection */}
              <div className="space-y-3">
                <Label>Qui a gagné ?</Label>
                <RadioGroup
                  value={matchData.winnerId}
                  onValueChange={(value) =>
                    setMatchData(prev => ({ ...prev, winnerId: value }))
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="winner-me"
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                      matchData.winnerId === currentPlayerId
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-muted hover:border-muted-foreground/50'
                    )}
                  >
                    <RadioGroupItem value={currentPlayerId} id="winner-me" />
                    <div>
                      <span className="font-medium">Moi</span>
                      <span className="block text-xs text-muted-foreground">
                        {currentPlayerName}
                      </span>
                    </div>
                  </Label>
                  <Label
                    htmlFor="winner-opponent"
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                      matchData.winnerId === matchData.opponentId
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-muted hover:border-muted-foreground/50'
                    )}
                  >
                    <RadioGroupItem value={matchData.opponentId || ''} id="winner-opponent" />
                    <div>
                      <span className="font-medium">Adversaire</span>
                      <span className="block text-xs text-muted-foreground truncate max-w-[100px]">
                        {matchData.opponent?.fullName}
                      </span>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Score input */}
              <div className="space-y-2">
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  placeholder="ex: 6-4 6-2"
                  value={matchData.score || ''}
                  onChange={(e) =>
                    setMatchData(prev => ({ ...prev, score: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Format: 6-4 6-2 ou 7-6(5) 3-6 6-4
                </p>
              </div>

              {/* Match format */}
              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={matchData.matchFormat}
                  onValueChange={(value) =>
                    setMatchData(prev => ({ ...prev, matchFormat: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_set">1 set gagnant</SelectItem>
                    <SelectItem value="two_sets">2 sets gagnants</SelectItem>
                    <SelectItem value="two_sets_super_tb">2 sets + Super TB</SelectItem>
                    <SelectItem value="three_sets">3 sets gagnants</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="playedAt">Date du match</Label>
                <Input
                  id="playedAt"
                  type="date"
                  value={matchData.playedAt || ''}
                  onChange={(e) =>
                    setMatchData(prev => ({ ...prev, playedAt: e.target.value }))
                  }
                />
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToStep('opponent')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button
                  type="button"
                  onClick={() => goToStep('confirm')}
                  disabled={!matchData.winnerId || !matchData.score}
                  className="flex-1"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'confirm' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Confirmation
              </CardTitle>
              <CardDescription>
                Vérifie les informations avant de valider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Match summary */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Adversaire</span>
                  <span className="font-medium">{matchData.opponent?.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vainqueur</span>
                  <span className="font-medium">
                    {matchData.winnerId === currentPlayerId
                      ? currentPlayerName
                      : matchData.opponent?.fullName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="font-medium">{matchData.score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {matchData.playedAt
                      ? new Date(matchData.playedAt).toLocaleDateString('fr-FR')
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Info box */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm">
                <p className="text-blue-700 dark:text-blue-300">
                  💡 Ton adversaire recevra une notification pour confirmer le match.
                  Le match sera validé automatiquement après 24h sans contestation.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goToStep('score')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      Valider
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface PlayerCardProps {
  player: Player;
  onClick: () => void;
  highlighted?: boolean;
}

function PlayerCard({ player, onClick, highlighted }: PlayerCardProps) {
  const initials = player.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
        highlighted
          ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
          : 'hover:bg-muted/50'
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={player.avatarUrl || undefined} alt={player.fullName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{player.fullName}</p>
        <p className="text-sm text-muted-foreground">ELO {player.currentElo}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
