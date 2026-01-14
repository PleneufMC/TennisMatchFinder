'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle,
  AlertTriangle,
  Star
} from 'lucide-react';
import { RatingModal } from '@/components/reputation/rating-modal';

interface MatchConfirmFormProps {
  matchId: string;
  opponent?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export function MatchConfirmForm({ matchId, opponent }: MatchConfirmFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<'confirmed' | 'rejected' | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

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

  return (
    <div className="space-y-6">
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
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important :</strong> En confirmant, les classements ELO seront mis à jour 
          immédiatement. En refusant, la déclaration sera annulée et votre adversaire 
          pourra la soumettre à nouveau avec le bon résultat.
        </AlertDescription>
      </Alert>
    </div>
  );
}
