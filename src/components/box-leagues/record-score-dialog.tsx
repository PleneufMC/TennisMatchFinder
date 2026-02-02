'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, AlertCircle, CheckCircle, UserX, Flag } from 'lucide-react';
import type { BoxLeagueMatch } from '@/lib/box-leagues/types';
import { cn } from '@/lib/utils';

interface RecordScoreDialogProps {
  match: BoxLeagueMatch | null;
  leagueId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ResultType = 'score' | 'forfeit';

export function RecordScoreDialog({
  match,
  leagueId,
  open,
  onOpenChange,
  onSuccess,
}: RecordScoreDialogProps) {
  const [resultType, setResultType] = useState<ResultType>('score');
  const [winnerId, setWinnerId] = useState<string>('');
  const [forfeitById, setForfeitById] = useState<string>('');
  const [score, setScore] = useState('');
  const [player1Sets, setPlayer1Sets] = useState(0);
  const [player2Sets, setPlayer2Sets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when match changes
  useEffect(() => {
    if (match) {
      setResultType('score');
      setWinnerId('');
      setForfeitById('');
      setScore('');
      setPlayer1Sets(0);
      setPlayer2Sets(0);
      setError(null);
    }
  }, [match]);

  // Auto-detect winner based on sets (only for score mode)
  useEffect(() => {
    if (resultType === 'score') {
      if (player1Sets > player2Sets && player1Sets >= 2) {
        setWinnerId(match?.player1Id || '');
      } else if (player2Sets > player1Sets && player2Sets >= 2) {
        setWinnerId(match?.player2Id || '');
      }
    }
  }, [player1Sets, player2Sets, match, resultType]);

  // When forfeit player is selected, set winner to the other player
  useEffect(() => {
    if (resultType === 'forfeit' && forfeitById && match) {
      const winner = forfeitById === match.player1Id ? match.player2Id : match.player1Id;
      setWinnerId(winner);
    }
  }, [forfeitById, match, resultType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!match) return;

    // Validation for score mode
    if (resultType === 'score') {
      if (!winnerId) {
        setError('Veuillez sélectionner le gagnant');
        return;
      }
      if (!score.trim()) {
        setError('Veuillez entrer le score (ex: 6-4 6-3)');
        return;
      }
      if (player1Sets === 0 && player2Sets === 0) {
        setError('Veuillez entrer le nombre de sets gagnés');
        return;
      }
      const winnerSets = winnerId === match.player1Id ? player1Sets : player2Sets;
      if (winnerSets < Math.max(player1Sets, player2Sets)) {
        setError('Le gagnant doit avoir le plus de sets');
        return;
      }
    }

    // Validation for forfeit mode
    if (resultType === 'forfeit') {
      if (!forfeitById) {
        setError('Veuillez sélectionner le joueur qui a abandonné');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const body = resultType === 'score' 
        ? {
            winnerId,
            score: score.trim(),
            player1Sets,
            player2Sets,
            createMainMatch: true,
          }
        : {
            winnerId,
            forfeitById,
            score: 'WO',
            player1Sets: forfeitById === match.player1Id ? 0 : 2,
            player2Sets: forfeitById === match.player2Id ? 0 : 2,
            isForfeit: true,
            createMainMatch: false, // Pas d'ELO pour les WO
          };

      const response = await fetch(
        `/api/box-leagues/${leagueId}/matches/${match.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!match) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Enregistrer le résultat
          </DialogTitle>
          <DialogDescription>
            Saisissez le score ou déclarez un abandon/WO
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Players Display */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* Player 1 */}
            <div className="text-center">
              <Avatar className="h-12 w-12 mx-auto mb-2">
                <AvatarImage src={match.player1?.avatarUrl || undefined} />
                <AvatarFallback>
                  {match.player1?.fullName?.slice(0, 2).toUpperCase() || 'J1'}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium text-sm truncate">
                {match.player1?.fullName || 'Joueur 1'}
              </p>
            </div>

            <div className="text-xl font-bold text-muted-foreground">VS</div>

            {/* Player 2 */}
            <div className="text-center">
              <Avatar className="h-12 w-12 mx-auto mb-2">
                <AvatarImage src={match.player2?.avatarUrl || undefined} />
                <AvatarFallback>
                  {match.player2?.fullName?.slice(0, 2).toUpperCase() || 'J2'}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium text-sm truncate">
                {match.player2?.fullName || 'Joueur 2'}
              </p>
            </div>
          </div>

          {/* Tabs for Score vs Forfeit */}
          <Tabs value={resultType} onValueChange={(v) => setResultType(v as ResultType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="score" className="gap-2">
                <Trophy className="h-4 w-4" />
                Score
              </TabsTrigger>
              <TabsTrigger value="forfeit" className="gap-2">
                <Flag className="h-4 w-4" />
                Abandon / WO
              </TabsTrigger>
            </TabsList>

            {/* Score Tab */}
            <TabsContent value="score" className="space-y-4 mt-4">
              {/* Winner Selection */}
              <div className="space-y-3">
                <Label>Qui a gagné ?</Label>
                <RadioGroup
                  value={winnerId}
                  onValueChange={setWinnerId}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="winner-p1"
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-colors',
                      winnerId === match.player1Id
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem
                      value={match.player1Id}
                      id="winner-p1"
                      className="sr-only"
                    />
                    {winnerId === match.player1Id && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <span className="text-sm font-medium">
                      {match.player1?.fullName?.split(' ')[0] || 'Joueur 1'}
                    </span>
                  </Label>

                  <Label
                    htmlFor="winner-p2"
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-colors',
                      winnerId === match.player2Id
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem
                      value={match.player2Id}
                      id="winner-p2"
                      className="sr-only"
                    />
                    {winnerId === match.player2Id && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <span className="text-sm font-medium">
                      {match.player2?.fullName?.split(' ')[0] || 'Joueur 2'}
                    </span>
                  </Label>
                </RadioGroup>
              </div>

              {/* Sets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="player1Sets">
                    Sets {match.player1?.fullName?.split(' ')[0] || 'J1'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPlayer1Sets(Math.max(0, player1Sets - 1))}
                      disabled={player1Sets === 0}
                    >
                      -
                    </Button>
                    <Input
                      id="player1Sets"
                      type="number"
                      min={0}
                      max={3}
                      value={player1Sets}
                      onChange={(e) => setPlayer1Sets(parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPlayer1Sets(Math.min(3, player1Sets + 1))}
                      disabled={player1Sets === 3}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="player2Sets">
                    Sets {match.player2?.fullName?.split(' ')[0] || 'J2'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPlayer2Sets(Math.max(0, player2Sets - 1))}
                      disabled={player2Sets === 0}
                    >
                      -
                    </Button>
                    <Input
                      id="player2Sets"
                      type="number"
                      min={0}
                      max={3}
                      value={player2Sets}
                      onChange={(e) => setPlayer2Sets(parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPlayer2Sets(Math.min(3, player2Sets + 1))}
                      disabled={player2Sets === 3}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Score détaillé */}
              <div className="space-y-2">
                <Label htmlFor="score">Score détaillé</Label>
                <Input
                  id="score"
                  placeholder="Ex: 6-4 6-3 ou 6-4 3-6 7-5"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Format: jeux gagnés par set séparés par des espaces
                </p>
              </div>
            </TabsContent>

            {/* Forfeit Tab */}
            <TabsContent value="forfeit" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Qui a déclaré forfait / abandonné ?</Label>
                <RadioGroup
                  value={forfeitById}
                  onValueChange={setForfeitById}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="forfeit-p1"
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-colors',
                      forfeitById === match.player1Id
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem
                      value={match.player1Id}
                      id="forfeit-p1"
                      className="sr-only"
                    />
                    {forfeitById === match.player1Id && (
                      <UserX className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {match.player1?.fullName?.split(' ')[0] || 'Joueur 1'}
                    </span>
                  </Label>

                  <Label
                    htmlFor="forfeit-p2"
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-colors',
                      forfeitById === match.player2Id
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem
                      value={match.player2Id}
                      id="forfeit-p2"
                      className="sr-only"
                    />
                    {forfeitById === match.player2Id && (
                      <UserX className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {match.player2?.fullName?.split(' ')[0] || 'Joueur 2'}
                    </span>
                  </Label>
                </RadioGroup>
              </div>

              {forfeitById && (
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                  <Flag className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <strong>{forfeitById === match.player1Id ? match.player1?.fullName : match.player2?.fullName}</strong> sera 
                    déclaré forfait. <strong>{forfeitById === match.player1Id ? match.player2?.fullName : match.player1?.fullName}</strong> gagne 
                    par WO (Walkover).
                    <br />
                    <span className="text-sm">Note: Les points de forfait ({match.leagueId ? 'selon le règlement' : '-1 pt'}) seront appliqués.</span>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (resultType === 'score' && !winnerId) || (resultType === 'forfeit' && !forfeitById)}
              variant={resultType === 'forfeit' ? 'destructive' : 'default'}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : resultType === 'forfeit' ? (
                <>
                  <Flag className="h-4 w-4 mr-2" />
                  Déclarer forfait
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
