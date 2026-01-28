'use client';

import { useState } from 'react';
import { Flag, Loader2, AlertTriangle } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

interface ReportPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
}

const REPORT_CATEGORIES = [
  { value: 'spam', label: '📧 Spam', description: 'Publicité, messages répétitifs' },
  { value: 'harassment', label: '😠 Harcèlement', description: 'Insultes, menaces, comportement agressif' },
  { value: 'fake_profile', label: '🎭 Faux profil', description: 'Usurpation d\'identité, informations fausses' },
  { value: 'cheating', label: '🏆 Triche', description: 'Scores falsifiés, manipulation du classement' },
  { value: 'inappropriate', label: '⚠️ Contenu inapproprié', description: 'Contenu offensant ou inapproprié' },
  { value: 'other', label: '📝 Autre', description: 'Autre motif non listé' },
] as const;

export function ReportPlayerDialog({
  open,
  onOpenChange,
  playerId,
  playerName,
}: ReportPlayerDialogProps) {
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!category) {
      toast({
        title: 'Catégorie requise',
        description: 'Veuillez sélectionner une catégorie de signalement',
        variant: 'destructive',
      });
      return;
    }

    if (description.length < 10) {
      toast({
        title: 'Description requise',
        description: 'Veuillez fournir plus de détails (minimum 10 caractères)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/players/${playerId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Signalement envoyé',
          description: 'Merci pour votre signalement. Notre équipe l\'examinera rapidement.',
        });
        onOpenChange(false);
        setCategory('');
        setDescription('');
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
        description: 'Impossible d\'envoyer le signalement',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCategory('');
      setDescription('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-orange-500" />
            Signaler {playerName}
          </DialogTitle>
          <DialogDescription>
            Décrivez le problème rencontré avec ce joueur. Les signalements abusifs peuvent entraîner des sanctions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Motif du signalement *</Label>
            <RadioGroup value={category} onValueChange={setCategory}>
              <div className="grid gap-2">
                {REPORT_CATEGORIES.map((cat) => (
                  <div key={cat.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={cat.value} id={cat.value} className="mt-1" />
                    <Label htmlFor={cat.value} className="flex flex-col cursor-pointer">
                      <span className="font-medium">{cat.label}</span>
                      <span className="text-xs text-muted-foreground">{cat.description}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez précisément ce qui s'est passé..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/2000 caractères
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-200">Important</p>
              <p className="text-orange-700 dark:text-orange-300">
                Les signalements sont examinés par notre équipe. Les faux signalements répétés peuvent entraîner la suspension de votre compte.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !category || description.length < 10}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Flag className="h-4 w-4 mr-2" />
                Envoyer le signalement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
