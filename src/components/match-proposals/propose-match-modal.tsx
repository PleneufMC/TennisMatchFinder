'use client';

import { useState } from 'react';
import { Calendar, Clock, MessageSquare, Send, Loader2, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/toast';

interface Player {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  currentElo?: number;
}

interface ProposeMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player;
  onSuccess?: () => void;
}

export function ProposeMatchModal({
  open,
  onOpenChange,
  player,
  onSuccess,
}: ProposeMatchModalProps) {
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/match-proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPlayerId: player.id,
          proposedDate: proposedDate || undefined,
          proposedTime: proposedTime || undefined,
          message: message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de l\'envoi de la proposition');
        return;
      }

      toast.success(`Proposition envoyée à ${player.fullName} !`);
      onOpenChange(false);
      
      // Reset form
      setProposedDate('');
      setProposedTime('');
      setMessage('');
      
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast.error('Erreur lors de l\'envoi de la proposition');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date minimum = aujourd'hui
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Proposer un match
          </DialogTitle>
          <DialogDescription>
            Envoyez une invitation à jouer à ce joueur
          </DialogDescription>
        </DialogHeader>

        {/* Joueur destinataire */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Avatar className="h-12 w-12">
            <AvatarImage src={player.avatarUrl || undefined} alt={player.fullName} />
            <AvatarFallback>{getInitials(player.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{player.fullName}</p>
            {player.currentElo && (
              <p className="text-sm text-muted-foreground">ELO {player.currentElo}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 py-2">
          {/* Date proposée */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date proposée
              <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              min={today}
            />
          </div>

          {/* Heure proposée */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Heure proposée
              <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Input
              id="time"
              type="time"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message
              <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Un message pour accompagner votre proposition..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer la proposition
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
