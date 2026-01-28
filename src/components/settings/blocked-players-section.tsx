'use client';

import { useState, useEffect } from 'react';
import { Ban, Loader2, UserX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
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

interface BlockedPlayer {
  blockId: string;
  blockedAt: string;
  reason: string | null;
  player: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
}

export function BlockedPlayersSection() {
  const [blockedPlayers, setBlockedPlayers] = useState<BlockedPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBlockedPlayers();
  }, []);

  const fetchBlockedPlayers = async () => {
    try {
      const res = await fetch('/api/players/blocked');
      if (res.ok) {
        const data = await res.json();
        setBlockedPlayers(data.blockedPlayers);
      }
    } catch (error) {
      console.error('Error fetching blocked players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (playerId: string, playerName: string) => {
    setUnblockingId(playerId);
    try {
      const res = await fetch(`/api/players/${playerId}/block`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setBlockedPlayers(prev => prev.filter(bp => bp.player.id !== playerId));
        toast({
          title: 'Joueur débloqué',
          description: `${playerName} peut à nouveau vous contacter.`,
        });
      } else {
        const data = await res.json();
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible de débloquer ce joueur',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ban className="h-5 w-5" />
          Joueurs bloqués
        </CardTitle>
        <CardDescription>
          Les joueurs bloqués ne peuvent pas vous contacter ni vous voir dans les suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : blockedPlayers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun joueur bloqué</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedPlayers.map((bp) => (
              <div
                key={bp.blockId}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    src={bp.player.avatarUrl}
                    name={bp.player.fullName}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">{bp.player.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {bp.player.currentElo} ELO
                    </p>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={unblockingId === bp.player.id}
                    >
                      {unblockingId === bp.player.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Débloquer'
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Débloquer {bp.player.fullName} ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ce joueur pourra à nouveau vous envoyer des messages et vous voir dans les suggestions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUnblock(bp.player.id, bp.player.fullName)}
                      >
                        Débloquer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
