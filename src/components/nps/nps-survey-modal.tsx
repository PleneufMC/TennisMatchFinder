/**
 * Modal NPS Survey
 * 
 * Affiche un survey NPS élégant demandant à l'utilisateur
 * de noter la probabilité qu'il recommande TennisMatchFinder.
 */

'use client';

import { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface NpsSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason: 'matches_milestone' | 'days_since_signup' | 'manual';
  triggerValue?: number;
}

export function NpsSurveyModal({ 
  isOpen, 
  onClose, 
  triggerReason, 
  triggerValue 
}: NpsSurveyModalProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleScoreClick = (value: number) => {
    setScore(value);
    setShowFeedback(true);
  };

  const handleSubmit = async () => {
    if (score === null) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          feedback: feedback.trim() || undefined,
          triggerReason,
          triggerValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      toast.success('Merci pour votre retour ! 🎾');
      onClose();
    } catch (error) {
      console.error('NPS submission error:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await fetch('/api/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dismissed: true,
          triggerReason,
          triggerValue,
        }),
      });
    } catch (error) {
      console.error('NPS dismiss error:', error);
    }
    onClose();
  };

  const getScoreColor = (value: number, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground';
    }
    if (value <= 6) return 'bg-red-500 text-white';
    if (value <= 8) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getScoreLabel = () => {
    if (score === null) return '';
    if (score <= 6) return 'Nous sommes désolés 😞';
    if (score <= 8) return 'Merci pour votre retour 😊';
    return 'Super, merci ! 🎉';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Votre avis compte ! 🎾
          </DialogTitle>
          <DialogDescription className="text-center">
            Sur une échelle de 0 à 10, quelle est la probabilité que vous recommandiez TennisMatchFinder à un ami ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Score selector */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Peu probable</span>
              <span>Très probable</span>
            </div>
            
            <div className="grid grid-cols-11 gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  onClick={() => handleScoreClick(value)}
                  className={cn(
                    'h-10 rounded-md font-medium text-sm transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    getScoreColor(value, score === value)
                  )}
                >
                  {value}
                </button>
              ))}
            </div>

            {score !== null && (
              <p className="text-center text-sm font-medium">
                {getScoreLabel()}
              </p>
            )}
          </div>

          {/* Feedback textarea (shown after score selection) */}
          {showFeedback && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Label htmlFor="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Un commentaire ? (optionnel)
              </Label>
              <Textarea
                id="feedback"
                placeholder={
                  score !== null && score <= 6
                    ? "Qu'est-ce qu'on pourrait améliorer ?"
                    : "Qu'est-ce que vous appréciez le plus ?"
                }
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="flex-1"
          >
            Plus tard
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={score === null || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              'Envoi...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
