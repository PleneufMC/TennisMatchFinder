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
import { Loader2, Trophy, AlertCircle, CheckCircle } from 'lucide-react';
import type { BoxLeagueMatch } from '@/lib/box-leagues/types';
import { cn } from '@/lib/utils';

interface RecordScoreDialogProps {
  match: BoxLeagueMatch | null;
  leagueId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecordScoreDialog({
  match,
  leagueId,
  open,
  onOpenChange,
  onSuccess,
}: RecordScoreDialogProps) {
  const [winnerId, setWinnerId] = useState<string>('');
  const [score, setScore] = useState('');
  const [player1Sets, setPlayer1Sets] = useState(0);
  const [player2Sets, setPlayer2Sets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when match changes
  useEffect(() => {
    if (match) {
      setWinnerId('');
      setScore('');
      setPlayer1Sets(0);
      setPlayer2Sets(0);
      setError(null);
    }
  }, [match]);

  // Auto-detect winner based on sets
  useEffect(() => {
    if (player1Sets > player2Sets && player1Sets >= 2) {
      setWinnerId(match?.player1Id || '');
    } else if (player2Sets > player1Sets && player2Sets >= 2) {
      setWinnerId(match?.player2Id || '');
    }
  }, [player1Sets, player2Sets, match]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!match || !winnerId) return;

    // Validation
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

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/box-leagues/${leagueId}/matches/${match.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            winnerId,
            score: score.trim(),
            player1Sets,
            player2Sets,
            createMainMatch: true, // Intégrer à l'ELO
          }),
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
            Saisissez le score de votre match de Box League
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Players */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* Player 1 */}
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={match.player1?.avatarUrl || undefined} />
                <AvatarFallback>
                  {match.player1?.fullName?.slice(0, 2).toUpperCase() || 'J1'}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium text-sm truncate">
                {match.player1?.fullName || 'Joueur 1'}
              </p>
              <p className="text-xs text-muted-foreground">
                {match.player1?.currentElo} ELO
              </p>
            </div>

            <div className="text-2xl font-bold text-muted-foreground">VS</div>

            {/* Player 2 */}
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={match.player2?.avatarUrl || undefined} />
                <AvatarFallback>
                  {match.player2?.fullName?.slice(0, 2).toUpperCase() || 'J2'}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium text-sm truncate">
                {match.player2?.fullName || 'Joueur 2'}
              </p>
              <p className="text-xs text-muted-foreground">
                {match.player2?.currentElo} ELO
              </p>
            </div>
          </div>

          {/* Winner Selection */}
          <div className="space-y-3">
            <Label>Qui a gagné ?</Label>
            <RadioGroup
              value={winnerId}
              onValueChange={setWinnerId}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="winner-p1"
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors',
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
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors',
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
            <Button type="submit" disabled={loading || !winnerId}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
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
