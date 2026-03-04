'use client';

import { useState } from 'react';
import { Check, X, Calendar, Clock, MessageSquare, Loader2, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';

interface Player {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  currentElo?: number;
}

interface MatchProposal {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  proposedDate: string | null;
  proposedTime: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  respondedAt: string | null;
  fromPlayer: Player;
  toPlayer: Player;
  isFromMe: boolean;
}

interface ProposalCardProps {
  proposal: MatchProposal;
  onUpdate?: () => void;
}

export function ProposalCard({ proposal, onUpdate }: ProposalCardProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [showDeclineMessage, setShowDeclineMessage] = useState(false);
  const [declineMessage, setDeclineMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState<'accept' | 'decline' | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const otherPlayer = proposal.isFromMe ? proposal.toPlayer : proposal.fromPlayer;

  const handleRespond = async (action: 'accept' | 'decline') => {
    if (action === 'decline' && !showDeclineMessage) {
      setShowDeclineMessage(true);
      return;
    }

    setActionInProgress(action);
    setIsResponding(true);

    try {
      const response = await fetch(`/api/match-proposals/${proposal.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          message: action === 'decline' ? declineMessage : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la réponse');
        return;
      }

      toast.success(data.message);
      onUpdate?.();
    } catch (error) {
      console.error('Error responding to proposal:', error);
      toast.error('Erreur lors de la réponse');
    } finally {
      setIsResponding(false);
      setActionInProgress(null);
      setShowDeclineMessage(false);
      setDeclineMessage('');
    }
  };

  const handleCancel = async () => {
    setIsResponding(true);

    try {
      const response = await fetch(`/api/match-proposals/${proposal.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de l\'annulation');
        return;
      }

      toast.success('Proposition annulée');
      onUpdate?.();
    } catch (error) {
      console.error('Error canceling proposal:', error);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setIsResponding(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const statusBadge = {
    pending: { label: 'En attente', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
    accepted: { label: 'Acceptée', variant: 'default' as const, className: 'bg-green-500' },
    declined: { label: 'Refusée', variant: 'destructive' as const, className: '' },
    expired: { label: 'Expirée', variant: 'secondary' as const, className: '' },
  };

  const status = statusBadge[proposal.status];

  return (
    <Card className={proposal.status === 'pending' && !proposal.isFromMe ? 'border-primary/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profil/${otherPlayer.id}`}>
              <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary">
                <AvatarImage src={otherPlayer.avatarUrl || undefined} alt={otherPlayer.fullName} />
                <AvatarFallback>{getInitials(otherPlayer.fullName)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <CardTitle className="text-base">
                <Link href={`/profil/${otherPlayer.id}`} className="hover:text-primary">
                  {otherPlayer.fullName}
                </Link>
              </CardTitle>
              <CardDescription className="text-xs">
                {proposal.isFromMe ? 'Proposition envoyée' : 'Proposition reçue'} • {' '}
                {new Date(proposal.createdAt).toLocaleDateString('fr-FR')}
              </CardDescription>
            </div>
          </div>
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date et heure proposées */}
        {(proposal.proposedDate || proposal.proposedTime) && (
          <div className="flex flex-wrap gap-3 text-sm">
            {proposal.proposedDate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(proposal.proposedDate)}</span>
              </div>
            )}
            {proposal.proposedTime && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{proposal.proposedTime}</span>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {proposal.message && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="text-muted-foreground italic">&quot;{proposal.message}&quot;</p>
          </div>
        )}

        {/* Actions pour les propositions reçues en attente */}
        {proposal.status === 'pending' && !proposal.isFromMe && (
          <div className="pt-2 space-y-3">
            {showDeclineMessage ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Raison du refus (optionnel)..."
                  value={declineMessage}
                  onChange={(e) => setDeclineMessage(e.target.value)}
                  rows={2}
                  maxLength={200}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeclineMessage(false)}
                    disabled={isResponding}
                  >
                    Retour
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRespond('decline')}
                    disabled={isResponding}
                  >
                    {actionInProgress === 'decline' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Confirmer le refus
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRespond('accept')}
                  disabled={isResponding}
                >
                  {actionInProgress === 'accept' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Accepter
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRespond('decline')}
                  disabled={isResponding}
                >
                  <X className="h-4 w-4 mr-1" />
                  Refuser
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action pour annuler une proposition envoyée */}
        {proposal.status === 'pending' && proposal.isFromMe && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isResponding}
              className="text-muted-foreground hover:text-destructive"
            >
              {isResponding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              Annuler la proposition
            </Button>
          </div>
        )}

        {/* Message pour proposition acceptée */}
        {proposal.status === 'accepted' && (
          <div className="pt-2">
            <Link href={`/profil/${otherPlayer.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <User className="h-4 w-4 mr-2" />
                Contacter {otherPlayer.fullName}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
