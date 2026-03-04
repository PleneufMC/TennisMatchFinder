'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarDays, 
  Clock, 
  MessageSquare, 
  Check, 
  X, 
  Send, 
  Inbox,
  User,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
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

interface Player {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
}

interface Proposal {
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

export default function MatchProposalsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<'accept' | 'decline' | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (sessionStatus === 'authenticated') {
      fetchProposals();
    }
  }, [sessionStatus, router]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/match-proposals');
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Erreur lors du chargement des propositions');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (proposalId: string, action: 'accept' | 'decline') => {
    setRespondingTo(proposalId);
    try {
      const response = await fetch(`/api/match-proposals/${proposalId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la réponse');
      }

      toast.success(
        action === 'accept' 
          ? 'Proposition acceptée ! Contactez votre adversaire.'
          : 'Proposition déclinée.'
      );

      // Rafraîchir les propositions
      await fetchProposals();
    } catch (error) {
      console.error('Error responding:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la réponse');
    } finally {
      setRespondingTo(null);
      setDialogAction(null);
      setSelectedProposal(null);
    }
  };

  const openDialog = (proposal: Proposal, action: 'accept' | 'decline') => {
    setSelectedProposal(proposal);
    setDialogAction(action);
  };

  const receivedProposals = proposals.filter(p => !p.isFromMe);
  const sentProposals = proposals.filter(p => p.isFromMe);
  const pendingReceived = receivedProposals.filter(p => p.status === 'pending');

  const getStatusBadge = (status: Proposal['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Acceptée</Badge>;
      case 'declined':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Refusée</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Expirée</Badge>;
      default:
        return null;
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

  const ProposalCard = ({ proposal, showActions }: { proposal: Proposal; showActions: boolean }) => {
    const otherPlayer = proposal.isFromMe ? proposal.toPlayer : proposal.fromPlayer;
    const isPending = proposal.status === 'pending';
    const isResponding = respondingTo === proposal.id;

    return (
      <Card className={`transition-all ${isPending && showActions ? 'border-primary/50 shadow-md' : ''}`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* Avatar du joueur */}
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherPlayer?.avatarUrl || undefined} />
              <AvatarFallback>
                {otherPlayer?.fullName?.charAt(0) || <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>

            {/* Contenu principal */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{otherPlayer?.fullName || 'Joueur inconnu'}</p>
                  <p className="text-sm text-muted-foreground">
                    ELO: {otherPlayer?.currentElo || 1500}
                  </p>
                </div>
                {getStatusBadge(proposal.status)}
              </div>

              {/* Date et heure proposées */}
              {(proposal.proposedDate || proposal.proposedTime) && (
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {proposal.proposedDate && (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(proposal.proposedDate)}
                    </div>
                  )}
                  {proposal.proposedTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {proposal.proposedTime}
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              {proposal.message && (
                <div className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{proposal.message}</p>
                </div>
              )}

              {/* Date de création */}
              <p className="text-xs text-muted-foreground">
                {proposal.isFromMe ? 'Envoyée' : 'Reçue'} le {new Date(proposal.createdAt).toLocaleDateString('fr-FR')}
              </p>

              {/* Actions pour propositions reçues en attente */}
              {showActions && isPending && !proposal.isFromMe && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openDialog(proposal, 'accept')}
                    disabled={isResponding}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Accepter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDialog(proposal, 'decline')}
                    disabled={isResponding}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Décliner
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="container py-6 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Propositions de match</h1>
        <p className="text-muted-foreground">
          Gérez vos invitations et propositions de match
        </p>
      </div>

      {/* Alerte si propositions en attente */}
      {pendingReceived.length > 0 && (
        <div className="mb-4 p-4 bg-primary/10 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-primary" />
          <p className="text-sm">
            Vous avez <strong>{pendingReceived.length}</strong> proposition{pendingReceived.length > 1 ? 's' : ''} en attente de réponse
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Reçues ({receivedProposals.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Envoyées ({sentProposals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          {receivedProposals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="mb-2">Aucune proposition reçue</CardTitle>
                <CardDescription>
                  Vous n&apos;avez pas encore reçu de proposition de match.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {receivedProposals.map(proposal => (
                <ProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sentProposals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="mb-2">Aucune proposition envoyée</CardTitle>
                <CardDescription>
                  Vous n&apos;avez pas encore proposé de match.
                  <br />
                  Allez sur le profil d&apos;un joueur pour lui proposer un match !
                </CardDescription>
                <Button 
                  className="mt-4" 
                  onClick={() => router.push('/classement')}
                >
                  Voir le classement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentProposals.map(proposal => (
                <ProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation */}
      <AlertDialog 
        open={!!dialogAction && !!selectedProposal} 
        onOpenChange={() => { setDialogAction(null); setSelectedProposal(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === 'accept' ? 'Accepter la proposition ?' : 'Décliner la proposition ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === 'accept' ? (
                <>
                  Vous acceptez la proposition de match de <strong>{selectedProposal?.fromPlayer?.fullName}</strong>.
                  Une notification sera envoyée et vous pourrez organiser les détails.
                </>
              ) : (
                <>
                  Vous déclinez la proposition de match de <strong>{selectedProposal?.fromPlayer?.fullName}</strong>.
                  Cette action est définitive.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProposal && dialogAction && handleRespond(selectedProposal.id, dialogAction)}
              className={dialogAction === 'decline' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {dialogAction === 'accept' ? 'Accepter' : 'Décliner'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
