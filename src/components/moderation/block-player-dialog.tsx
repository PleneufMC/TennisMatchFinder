'use client';

import { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface BlockPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
}

export function BlockPlayerDialog({
  open,
  onOpenChange,
  playerId,
  playerName,
}: BlockPlayerDialogProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBlock = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/players/${playerId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Joueur bloqué',
          description: `${playerName} ne pourra plus vous contacter ni vous voir dans les suggestions.`,
        });
        onOpenChange(false);
        setReason('');
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Une erreur est survenue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de bloquer ce joueur',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Bloquer {playerName} ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            En bloquant ce joueur :
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Il ne pourra plus vous envoyer de messages</li>
              <li>Il ne vous verra plus dans les suggestions</li>
              <li>Vous ne le verrez plus dans les suggestions</li>
              <li>Vous pourrez le débloquer à tout moment dans les paramètres</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reason">Raison (optionnelle, privée)</Label>
          <Textarea
            id="reason"
            placeholder="Pourquoi bloquez-vous ce joueur ? (Cette information reste privée)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Blocage...
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Bloquer
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
