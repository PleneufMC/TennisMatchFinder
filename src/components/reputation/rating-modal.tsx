'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  Clock, 
  Shield, 
  Heart, 
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  opponent: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  onRatingSubmitted?: () => void;
}

interface RatingCriteria {
  id: 'punctuality' | 'fairPlay' | 'friendliness';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const RATING_CRITERIA: RatingCriteria[] = [
  {
    id: 'punctuality',
    label: 'Ponctualité',
    description: 'Arrivée à l\'heure, respect du planning',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    id: 'fairPlay',
    label: 'Fair-play',
    description: 'Respect des règles, annonces honnêtes',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: 'friendliness',
    label: 'Convivialité',
    description: 'Attitude positive, bonne ambiance',
    icon: <Heart className="h-5 w-5" />,
  },
];

function StarRating({ 
  value, 
  onChange, 
  disabled = false 
}: { 
  value: number; 
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className={cn(
            'p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <Star
            className={cn(
              'h-7 w-7 transition-colors',
              (hoverValue || value) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function RatingModal({ 
  isOpen, 
  onClose, 
  matchId, 
  opponent,
  onRatingSubmitted 
}: RatingModalProps) {
  const [ratings, setRatings] = useState({
    punctuality: 0,
    fairPlay: 0,
    friendliness: 0,
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const averageRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 3;
  const isValid = Object.values(ratings).every((r) => r > 0);

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${matchId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          punctuality: ratings.punctuality,
          fairPlay: ratings.fairPlay,
          friendliness: ratings.friendliness,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'évaluation');
      }

      setIsSuccess(true);
      onRatingSubmitted?.();

      // Fermer après 2 secondes
      setTimeout(() => {
        onClose();
        // Reset state
        setIsSuccess(false);
        setRatings({ punctuality: 0, fairPlay: 0, friendliness: 0 });
        setComment('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
    setRatings({ punctuality: 0, fairPlay: 0, friendliness: 0 });
    setComment('');
    setError(null);
  };

  // Écran de succès
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Merci pour votre évaluation !</h3>
            <p className="text-muted-foreground">
              Votre avis aide la communauté à trouver de bons partenaires.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Évaluer votre adversaire
          </DialogTitle>
          <DialogDescription>
            Votre évaluation est anonyme et aide les autres joueurs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profil adversaire */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={opponent.avatarUrl || undefined} />
              <AvatarFallback>
                {opponent.fullName.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{opponent.fullName}</p>
              <p className="text-sm text-muted-foreground">
                Comment s&apos;est passé ce match ?
              </p>
            </div>
          </div>

          {/* Critères d'évaluation */}
          <div className="space-y-4">
            {RATING_CRITERIA.map((criteria) => (
              <div key={criteria.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{criteria.icon}</span>
                    <div>
                      <Label className="font-medium">{criteria.label}</Label>
                      <p className="text-xs text-muted-foreground">{criteria.description}</p>
                    </div>
                  </div>
                  <StarRating
                    value={ratings[criteria.id]}
                    onChange={(value) => setRatings((prev) => ({ ...prev, [criteria.id]: value }))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Moyenne */}
          {isValid && (
            <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 5</span>
            </div>
          )}

          {/* Commentaire optionnel */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm">
              Commentaire (optionnel, visible uniquement par les admins)
            </Label>
            <Textarea
              id="comment"
              placeholder="Un détail à signaler ? (ex: arrivé 10min en retard, très fair-play sur les annonces)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Passer
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Envoyer l&apos;évaluation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
