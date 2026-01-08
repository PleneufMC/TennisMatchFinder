'use client';

import { useRouter } from 'next/navigation';
import { Crown, Sparkles, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  requiredTier: 'premium' | 'pro';
}

export function PaywallModal({
  open,
  onClose,
  title,
  message,
  requiredTier,
}: PaywallModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/pricing');
    onClose();
  };

  const Icon = requiredTier === 'pro' ? Crown : Sparkles;
  const tierName = requiredTier === 'pro' ? 'Pro' : 'Premium';
  const tierColor = requiredTier === 'pro' ? 'text-amber-500' : 'text-primary';
  const tierBg = requiredTier === 'pro' ? 'bg-amber-500/10' : 'bg-primary/10';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-12 w-12 rounded-full ${tierBg} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${tierColor}`} />
            </div>
            <Badge variant="secondary" className={tierColor}>
              {tierName}
            </Badge>
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">
              Avantages {tierName} :
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {requiredTier === 'premium' ? (
                <>
                  <li>✓ Suggestions illimitées</li>
                  <li>✓ Statistiques avancées</li>
                  <li>✓ Forum complet</li>
                  <li>✓ Chat illimité</li>
                  <li>✓ Explication ELO détaillée</li>
                </>
              ) : (
                <>
                  <li>✓ Tout Premium inclus</li>
                  <li>✓ Tournois & Box Leagues</li>
                  <li>✓ Analytics premium</li>
                  <li>✓ Support prioritaire</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Plus tard
          </Button>
          <Button onClick={handleUpgrade} className="gap-2">
            <Icon className="h-4 w-4" />
            Passer à {tierName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
