'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Zap, Clock, X, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
import { cn } from '@/lib/utils';

interface MatchNowAvailability {
  id: string;
  availableUntil: string | Date;
  message: string | null;
  gameTypes: string[];
  isActive: boolean;
}

interface MatchNowToggleProps {
  initialAvailability?: MatchNowAvailability | null;
  availableCount?: number;
  onActivate: (params: {
    durationMinutes: number;
    message?: string;
    gameTypes: string[];
  }) => Promise<void>;
  onDeactivate: () => Promise<void>;
}

export function MatchNowToggle({
  initialAvailability,
  availableCount = 0,
  onActivate,
  onDeactivate,
}: MatchNowToggleProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [availability, setAvailability] = useState<MatchNowAvailability | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [duration, setDuration] = useState(120);
  const [message, setMessage] = useState('');
  const [gameTypes, setGameTypes] = useState<string[]>(['simple']);

  // Initialiser avec la disponibilité existante
  useEffect(() => {
    if (initialAvailability && new Date(initialAvailability.availableUntil) > new Date()) {
      setIsAvailable(true);
      setAvailability(initialAvailability);
    } else {
      setIsAvailable(false);
      setAvailability(null);
    }
  }, [initialAvailability]);

  // Countdown timer
  useEffect(() => {
    if (!availability) return;

    const interval = setInterval(() => {
      const until = new Date(availability.availableUntil);
      if (until <= new Date()) {
        setIsAvailable(false);
        setAvailability(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [availability]);

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      await onActivate({ durationMinutes: duration, message, gameTypes });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error activating:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    try {
      await onDeactivate();
      setIsAvailable(false);
      setAvailability(null);
    } catch (error) {
      console.error('Error deactivating:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGameType = (type: string) => {
    setGameTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const timeRemaining = availability
    ? formatDistanceToNow(new Date(availability.availableUntil), { locale: fr })
    : null;

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300',
      isAvailable
        ? 'border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
        : ''
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className={cn(
              'w-5 h-5',
              isAvailable ? 'text-green-500 animate-pulse' : 'text-muted-foreground'
            )} />
            Match Now
          </CardTitle>
          {availableCount > 0 && !isAvailable && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Users className="w-3 h-3 mr-1" />
              {availableCount} dispo
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAvailable && availability ? (
          // État actif
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-100/50 dark:bg-green-900/30 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">Vous êtes visible</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{timeRemaining}</span>
              </div>
            </div>

            {availability.message && (
              <p className="text-sm text-muted-foreground italic">
                &quot;{availability.message}&quot;
              </p>
            )}

            <div className="flex gap-2">
              {availability.gameTypes.map((type) => (
                <Badge key={type} variant="outline">
                  {type === 'simple' ? 'Simple' : 'Double'}
                </Badge>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
              onClick={handleDeactivate}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              {isLoading ? 'Annulation...' : 'Ne plus être disponible'}
            </Button>
          </div>
        ) : (
          // État inactif
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Signalez que vous êtes disponible pour jouer maintenant et soyez
              visible par les autres membres du club.
            </p>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Zap className="w-4 h-4 mr-2" />
                  Je suis disponible
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    Activer Match Now
                  </DialogTitle>
                  <DialogDescription>
                    Les membres avec un ELO similaire seront notifiés de votre disponibilité.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Durée */}
                  <div className="space-y-3">
                    <Label>Durée de disponibilité</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[duration]}
                        onValueChange={([value]) => value !== undefined && setDuration(value)}
                        min={30}
                        max={240}
                        step={30}
                        className="flex-1"
                      />
                      <span className="w-20 text-right font-medium">
                        {Math.floor(duration / 60)}h{duration % 60 > 0 ? `${duration % 60}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Type de jeu */}
                  <div className="space-y-3">
                    <Label>Type de jeu</Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={gameTypes.includes('simple') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleGameType('simple')}
                      >
                        Simple
                      </Button>
                      <Button
                        type="button"
                        variant={gameTypes.includes('double') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleGameType('double')}
                      >
                        Double
                      </Button>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-3">
                    <Label>Message (optionnel)</Label>
                    <Textarea
                      placeholder="Ex: Dispo courts 5-7, niveau intermédiaire+"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/200
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleActivate}
                    disabled={isLoading || gameTypes.length === 0}
                  >
                    {isLoading ? 'Activation...' : 'Activer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
