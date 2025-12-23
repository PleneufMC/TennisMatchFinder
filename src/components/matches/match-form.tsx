'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { createMatchSchema, type CreateMatchInput } from '@/lib/validations/match';
import { calculateMatchElo, formatEloDelta } from '@/lib/elo';
import { cn } from '@/lib/utils';

interface Opponent {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
}

interface MatchFormProps {
  currentPlayer: {
    id: string;
    fullName: string;
    currentElo: number;
  };
  opponents: Opponent[];
  clubId: string;
}

export function MatchForm({ currentPlayer, opponents, clubId }: MatchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<CreateMatchInput>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: {
      opponentId: '',
      score: '',
      winnerId: '',
      playedAt: new Date(),
      gameType: 'simple',
    },
  });

  const filteredOpponents = opponents.filter((o) =>
    o.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOpponent = (opponent: Opponent) => {
    setSelectedOpponent(opponent);
    form.setValue('opponentId', opponent.id);
    setSearchQuery('');
  };

  const handleSelectWinner = (id: string) => {
    setWinnerId(id);
    form.setValue('winnerId', id);
  };

  // Simuler le calcul ELO
  const eloPreview = selectedOpponent && winnerId
    ? calculateMatchElo(
        {
          id: winnerId === currentPlayer.id ? currentPlayer.id : selectedOpponent.id,
          currentElo: winnerId === currentPlayer.id ? currentPlayer.currentElo : selectedOpponent.currentElo,
          matchesPlayed: 0,
        },
        {
          id: winnerId === currentPlayer.id ? selectedOpponent.id : currentPlayer.id,
          currentElo: winnerId === currentPlayer.id ? selectedOpponent.currentElo : currentPlayer.currentElo,
          matchesPlayed: 0,
        },
        [],
        []
      )
    : null;

  const onSubmit = async (data: CreateMatchInput) => {
    if (!selectedOpponent) {
      toast.error('Veuillez sélectionner un adversaire');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            playedAt: data.playedAt.toISOString(),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors de l\'enregistrement');
        }

        const newElo = result.eloChanges.currentPlayer.after;

        toast.success('Match enregistré !', {
          description: `Votre ELO passe à ${newElo}`,
        });

        router.push('/matchs');
        router.refresh();
      } catch (error) {
        console.error('Error creating match:', error);
        toast.error('Erreur lors de l\'enregistrement du match');
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Sélection de l'adversaire */}
      <div className="space-y-4">
        <Label>Adversaire</Label>
        
        {selectedOpponent ? (
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <PlayerAvatar
                src={selectedOpponent.avatarUrl}
                name={selectedOpponent.fullName}
                size="md"
              />
              <div>
                <p className="font-medium">{selectedOpponent.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedOpponent.currentElo} ELO
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedOpponent(null)}
            >
              Changer
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Rechercher un adversaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto space-y-1 rounded-lg border p-2">
              {filteredOpponents.length > 0 ? (
                filteredOpponents.map((opponent) => (
                  <button
                    key={opponent.id}
                    type="button"
                    onClick={() => handleSelectOpponent(opponent)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <PlayerAvatar
                      src={opponent.avatarUrl}
                      name={opponent.fullName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{opponent.fullName}</p>
                    </div>
                    <Badge variant="secondary">{opponent.currentElo}</Badge>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun adversaire trouvé
                </p>
              )}
            </div>
          </div>
        )}
        {form.formState.errors.opponentId && (
          <p className="text-sm text-destructive">
            {form.formState.errors.opponentId.message}
          </p>
        )}
      </div>

      {/* Sélection du gagnant */}
      {selectedOpponent && (
        <div className="space-y-4">
          <Label>Qui a gagné ?</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSelectWinner(currentPlayer.id)}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-center',
                winnerId === currentPlayer.id
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              <Trophy
                className={cn(
                  'h-8 w-8 mx-auto mb-2',
                  winnerId === currentPlayer.id ? 'text-green-600' : 'text-muted-foreground'
                )}
              />
              <p className="font-medium">{currentPlayer.fullName}</p>
              <p className="text-sm text-muted-foreground">Moi</p>
            </button>
            <button
              type="button"
              onClick={() => handleSelectWinner(selectedOpponent.id)}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-center',
                winnerId === selectedOpponent.id
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              <Trophy
                className={cn(
                  'h-8 w-8 mx-auto mb-2',
                  winnerId === selectedOpponent.id ? 'text-green-600' : 'text-muted-foreground'
                )}
              />
              <p className="font-medium">{selectedOpponent.fullName}</p>
              <p className="text-sm text-muted-foreground">Adversaire</p>
            </button>
          </div>
        </div>
      )}

      {/* Score */}
      <div className="space-y-2">
        <Label htmlFor="score">Score</Label>
        <Input
          id="score"
          placeholder="Ex: 6-4 6-2"
          {...form.register('score')}
          error={form.formState.errors.score?.message}
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="playedAt">Date du match</Label>
        <Input
          id="playedAt"
          type="date"
          defaultValue={new Date().toISOString().split('T')[0]}
          onChange={(e) => form.setValue('playedAt', new Date(e.target.value))}
        />
      </div>

      {/* Options */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="surface">Surface (optionnel)</Label>
          <select
            id="surface"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register('surface')}
          >
            <option value="">Non spécifié</option>
            <option value="terre battue">Terre battue</option>
            <option value="dur">Dur</option>
            <option value="gazon">Gazon</option>
            <option value="indoor">Indoor</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Lieu (optionnel)</Label>
          <Input
            id="location"
            placeholder="Ex: Court 3"
            {...form.register('location')}
          />
        </div>
      </div>

      {/* Aperçu ELO */}
      {eloPreview && (
        <div className="rounded-lg border p-4 bg-muted/30">
          <p className="font-medium mb-3">Aperçu des changements ELO</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{currentPlayer.fullName}</p>
              <p className="font-mono">
                {currentPlayer.currentElo} →{' '}
                <span
                  className={
                    winnerId === currentPlayer.id ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {winnerId === currentPlayer.id
                    ? eloPreview.winner.eloAfter
                    : eloPreview.loser.eloAfter}
                </span>{' '}
                ({formatEloDelta(
                  winnerId === currentPlayer.id
                    ? eloPreview.winner.delta
                    : eloPreview.loser.delta
                )})
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{selectedOpponent?.fullName}</p>
              <p className="font-mono">
                {selectedOpponent?.currentElo} →{' '}
                <span
                  className={
                    winnerId === selectedOpponent?.id ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {winnerId === selectedOpponent?.id
                    ? eloPreview.winner.eloAfter
                    : eloPreview.loser.eloAfter}
                </span>{' '}
                ({formatEloDelta(
                  winnerId === selectedOpponent?.id
                    ? eloPreview.winner.delta
                    : eloPreview.loser.delta
                )})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !selectedOpponent || !winnerId}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          'Enregistrer le match'
        )}
      </Button>
    </form>
  );
}
