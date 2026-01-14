'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle,
  AlertTriangle,
  Star,
  Clock,
  Flag
} from 'lucide-react';
import { RatingModal } from '@/components/reputation/rating-modal';
import { MATCH_VALIDATION_CONFIG, getTimeUntilAutoValidation } from '@/lib/constants/validation';

interface MatchConfirmFormProps {
  matchId: string;
  opponent?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  autoValidateAt?: string;
}

export function MatchConfirmForm({ matchId, opponent, autoValidateAt }: MatchConfirmFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<'confirmed' | 'rejected' | 'contested' | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showContestDialog, setShowContestDialog] = useState(false);
  const [contestReason, setContestReason] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Countdown pour l'auto-validation
  useEffect(() => {
    if (!autoValidateAt) return;

    const updateCountdown = () => {
      const autoValidateDate = new Date(autoValidateAt);
      const result = getTimeUntilAutoValidation(autoValidateDate);
      setTimeRemaining(result.formatted);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Mise à jour toutes les minutes

    return () => clearInterval(interval);
  }, [autoValidateAt]);

  const handleAction = async (action: 'confirm' | 'reject') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${matchId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'opération');
      }

      setSuccess(action === 'confirm' ? 'confirmed' : 'rejected');

      // Si confirmation et qu'on a les infos de l'adversaire, proposer l'évaluation
      if (action === 'confirm' && opponent) {
        // Afficher le modal d'évaluation après un court délai
        setTimeout(() => {
          setShowRatingModal(true);
        }, 1500);
      } else {
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push('/matchs');
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContest = async () => {
    if (contestReason.trim().length < 10) {
      setError('Veuillez fournir une raison détaillée (minimum 10 caractères)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${matchId}/contest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: contestReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la contestation');
      }

      setShowContestDialog(false);
      setSuccess('contested');

      // Rediriger après 3 secondes
      setTimeout(() => {
        router.push('/matchs');
        router.refresh();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingModalClose = () => {
    setShowRatingModal(false);
    router.push('/matchs');
    router.refresh();
  };

  if (success === 'confirmed') {
    return (
      <>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Match confirmé !</h3>
          <p className="text-muted-foreground mb-4">
            Les classements ELO ont été mis à jour.
          </p>
          {opponent ? (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              Chargement de l&apos;évaluation...
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Redirection en cours...
            </p>
          )}
        </div>

        {/* Modal d'évaluation */}
        {opponent && (
          <RatingModal
            isOpen={showRatingModal}
            onClose={handleRatingModalClose}
            matchId={matchId}
            opponent={opponent}
          />
        )}
      </>
    );
  }

  if (success === 'rejected') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <XCircle className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Match refusé</h3>
        <p className="text-muted-foreground mb-4">
          La déclaration a été annulée. Votre adversaire en sera notifié.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirection en cours...
        </p>
      </div>
    );
  }

  if (success === 'contested') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
          <Flag className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Contestation enregistrée</h3>
        <p className="text-muted-foreground mb-4">
          Un administrateur va examiner votre demande et vous tiendra informé.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirection en cours...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Countdown auto-validation */}
      {autoValidateAt && timeRemaining && (
        <Alert className="border-amber-200 bg-amber-50">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Auto-validation dans {timeRemaining}</strong> si aucune action de votre part.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Button
          onClick={() => handleAction('confirm')}
          disabled={isSubmitting}
          className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          )}
          Confirmer le résultat
        </Button>

        <Button
          variant="outline"
          onClick={() => handleAction('reject')}
          disabled={isSubmitting}
          className="w-full h-14 text-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <XCircle className="h-5 w-5 mr-2" />
          )}
          Ce résultat est incorrect
        </Button>

        <Button
          variant="ghost"
          onClick={() => setShowContestDialog(true)}
          disabled={isSubmitting}
          className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        >
          <Flag className="h-4 w-4 mr-2" />
          Contester officiellement (litige)
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important :</strong> En confirmant, les classements ELO seront mis à jour 
          immédiatement. En refusant, la déclaration sera annulée et votre adversaire 
          pourra la soumettre à nouveau avec le bon résultat.
        </AlertDescription>
      </Alert>

      {/* Dialog de contestation */}
      <Dialog open={showContestDialog} onOpenChange={setShowContestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-600" />
              Contester ce match
            </DialogTitle>
            <DialogDescription>
              La contestation notifiera un administrateur qui examinera le cas.
              Vous avez droit à {MATCH_VALIDATION_CONFIG.maxContestationsPerMonth} contestations par mois.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contest-reason">Raison de la contestation *</Label>
              <Textarea
                id="contest-reason"
                placeholder="Expliquez pourquoi vous contestez ce résultat (minimum 10 caractères)..."
                value={contestReason}
                onChange={(e) => setContestReason(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {contestReason.length}/500 caractères
              </p>
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                Les contestations abusives peuvent entraîner des sanctions.
                Utilisez cette option uniquement en cas de réel désaccord.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContestDialog(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleContest}
              disabled={isSubmitting || contestReason.trim().length < 10}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Flag className="h-4 w-4 mr-2" />
              )}
              Soumettre la contestation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
