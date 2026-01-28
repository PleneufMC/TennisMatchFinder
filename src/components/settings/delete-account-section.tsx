'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2, XCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';

interface PendingRequest {
  id: string;
  status: string;
  requestedAt: string;
  scheduledDeletionAt: string;
  daysRemaining: number;
}

interface DeleteAccountSectionProps {
  userEmail: string;
}

const REASON_CATEGORIES = [
  { value: 'not_using', label: 'Je n\'utilise plus l\'application' },
  { value: 'privacy', label: 'Préoccupations concernant la vie privée' },
  { value: 'found_alternative', label: 'J\'ai trouvé une alternative' },
  { value: 'too_complex', label: 'L\'application est trop complexe' },
  { value: 'other', label: 'Autre raison' },
];

export function DeleteAccountSection({ userEmail }: DeleteAccountSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  
  // Form state
  const [confirmEmail, setConfirmEmail] = useState('');
  const [reasonCategory, setReasonCategory] = useState<string>('');
  const [reason, setReason] = useState('');

  // Load pending request status
  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch('/api/account/delete');
        if (response.ok) {
          const data = await response.json();
          if (data.hasPendingRequest) {
            setPendingRequest(data.request);
          }
        }
      } catch (error) {
        console.error('Error loading deletion status:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStatus();
  }, []);

  const handleSubmitRequest = async () => {
    if (confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
      toast.error('L\'email ne correspond pas');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmEmail,
          reasonCategory: reasonCategory || undefined,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Demande de suppression enregistrée');
        setPendingRequest({
          id: data.requestId,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          scheduledDeletionAt: data.scheduledDeletionAt,
          daysRemaining: 7,
        });
        setIsDialogOpen(false);
        // Reset form
        setConfirmEmail('');
        setReasonCategory('');
        setReason('');
      } else {
        toast.error(data.error || 'Erreur lors de la demande');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsCancelling(true);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Demande de suppression annulée');
        setPendingRequest(null);
      } else {
        toast.error(data.error || 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If there's a pending request
  if (pendingRequest) {
    const scheduledDate = new Date(pendingRequest.scheduledDeletionAt);
    const formattedDate = scheduledDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-700 dark:text-amber-300">
              Suppression programmée
            </CardTitle>
          </div>
          <CardDescription>
            Votre compte sera supprimé le {formattedDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Délai restant</p>
                <p className="text-2xl font-bold text-amber-600">
                  {pendingRequest.daysRemaining} jour{pendingRequest.daysRemaining > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Demandé le</p>
                <p>{new Date(pendingRequest.requestedAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Vous avez reçu un email avec un lien pour annuler ou confirmer immédiatement la suppression.
          </p>

          <Button
            variant="outline"
            onClick={() => setShowCancelConfirm(true)}
            disabled={isCancelling}
            className="w-full"
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Annulation...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Annuler la suppression
              </>
            )}
          </Button>
        </CardContent>

        {/* Cancel confirmation dialog */}
        <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler la suppression ?</AlertDialogTitle>
              <AlertDialogDescription>
                Votre compte sera conservé et toutes vos données resteront intactes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Non, continuer la suppression</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelRequest}>
                Oui, conserver mon compte
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  }

  // No pending request - show delete button
  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle className="text-red-600 dark:text-red-400">Zone de danger</CardTitle>
        </div>
        <CardDescription>
          Actions irréversibles concernant votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer mon compte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Supprimer votre compte
              </DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Toutes vos données seront supprimées après un délai de 7 jours.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Warning box */}
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  Ce qui sera supprimé :
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1 list-disc list-inside">
                  <li>Votre profil et données personnelles</li>
                  <li>Votre historique ELO et statistiques</li>
                  <li>Vos badges et récompenses</li>
                  <li>Vos messages et publications</li>
                </ul>
              </div>

              {/* Reason category */}
              <div className="space-y-2">
                <Label>Pourquoi souhaitez-vous partir ? (optionnel)</Label>
                <RadioGroup value={reasonCategory} onValueChange={setReasonCategory}>
                  {REASON_CATEGORIES.map((cat) => (
                    <div key={cat.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={cat.value} id={cat.value} />
                      <Label htmlFor={cat.value} className="font-normal cursor-pointer">
                        {cat.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Additional comments */}
              {reasonCategory === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Précisez (optionnel)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Dites-nous en plus..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={500}
                  />
                </div>
              )}

              {/* Email confirmation */}
              <div className="space-y-2">
                <Label htmlFor="confirmEmail">
                  Pour confirmer, entrez votre email : <strong>{userEmail}</strong>
                </Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  placeholder={userEmail}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleSubmitRequest}
                disabled={isSubmitting || confirmEmail.toLowerCase() !== userEmail.toLowerCase()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Demander la suppression'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Conformément au RGPD, vous disposez d&apos;un délai de 7 jours pour annuler.
        </p>
      </CardContent>
    </Card>
  );
}
