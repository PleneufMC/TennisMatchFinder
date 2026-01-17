'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dices, Loader2, Users, Trophy, CheckCircle } from 'lucide-react';

interface Pool {
  poolNumber: number;
  poolLetter: string;
  players: {
    id: string;
    name: string;
    elo: number;
  }[];
}

interface DrawPoolsButtonProps {
  leagueId: string;
  leagueName: string;
  poolCount: number;
  participantCount: number;
  poolsDrawn: boolean;
  onDrawComplete?: () => void;
}

export function DrawPoolsButton({
  leagueId,
  leagueName,
  poolCount,
  participantCount,
  poolsDrawn,
  onDrawComplete,
}: DrawPoolsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [pools, setPools] = useState<Pool[]>([]);
  const [error, setError] = useState<string | null>(null);

  const minPlayersNeeded = poolCount * 2;
  const canDraw = participantCount >= minPlayersNeeded && !poolsDrawn;

  async function handleDraw() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/box-leagues/${leagueId}/draw-pools`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du tirage');
      }

      setPools(data.pools);
      setShowResult(true);
      onDrawComplete?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (poolsDrawn) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Tirage effectué</span>
      </div>
    );
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="default"
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            disabled={!canDraw || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Dices className="h-4 w-4" />
            )}
            Tirage au sort
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Dices className="h-5 w-5 text-amber-500" />
              Effectuer le tirage au sort ?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Vous allez répartir <strong>{participantCount} joueurs</strong> en{' '}
                  <strong>{poolCount} poules</strong> pour &quot;{leagueName}&quot;.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                    ⚠️ Cette action est irréversible
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Une fois le tirage effectué, les joueurs seront notifiés de leur poule
                    et ne pourront plus changer de groupe.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{participantCount} joueurs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span>{poolCount} poules</span>
                  </div>
                  <div className="text-muted-foreground">
                    ~{Math.ceil(participantCount / poolCount)} joueurs/poule
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDraw}
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Tirage en cours...
                </>
              ) : (
                <>
                  <Dices className="h-4 w-4 mr-2" />
                  Lancer le tirage
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog résultat */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Tirage effectué avec succès !
            </DialogTitle>
            <DialogDescription>
              Les {participantCount} joueurs ont été répartis en {poolCount} poules.
              Chaque joueur a reçu une notification.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 py-4">
            {pools.map((pool) => (
              <Card key={pool.poolNumber} className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {pool.poolLetter}
                      </Badge>
                      Poule {pool.poolLetter}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {pool.players.length} joueurs
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pool.players.map((player, idx) => (
                      <li
                        key={player.id}
                        className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="font-medium">{player.name}</span>
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {player.elo} ELO
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowResult(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </>
  );
}
