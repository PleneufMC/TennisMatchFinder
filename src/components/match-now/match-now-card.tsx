'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, MessageSquare, Zap, Send } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MatchNowAvailability {
  id: string;
  playerId: string;
  availableUntil: string | Date;
  message: string | null;
  gameTypes: string[];
  player?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
}

interface MatchNowCardProps {
  availability: MatchNowAvailability;
  currentPlayerElo?: number;
  onRespond?: (availabilityId: string, message: string) => Promise<void>;
  isLoading?: boolean;
}

export function MatchNowCard({
  availability,
  currentPlayerElo,
  onRespond,
  isLoading = false,
}: MatchNowCardProps) {
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [message, setMessage] = useState('');

  const player = availability.player;
  if (!player) return null;

  const availableUntil = new Date(availability.availableUntil);
  const timeRemaining = formatDistanceToNow(availableUntil, { locale: fr, addSuffix: false });
  
  // Calculer la différence ELO
  const eloDiff = currentPlayerElo ? player.currentElo - currentPlayerElo : 0;
  const eloDiffLabel = eloDiff > 0 ? `+${eloDiff}` : eloDiff.toString();

  const handleRespond = async () => {
    if (onRespond) {
      await onRespond(availability.id, message);
      setMessage('');
      setShowMessageInput(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10">
      {/* Badge "Disponible maintenant" */}
      <div className="absolute top-2 right-2">
        <Badge className="bg-green-500 text-white animate-pulse">
          <Zap className="w-3 h-3 mr-1" />
          Maintenant
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-green-500/50">
            <AvatarImage src={player.avatarUrl || undefined} alt={player.fullName} />
            <AvatarFallback className="bg-green-100 text-green-700">
              {player.fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{player.fullName}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{player.currentElo} ELO</span>
              {currentPlayerElo && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  eloDiff > 50 ? 'bg-red-100 text-red-700' :
                  eloDiff < -50 ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                )}>
                  {eloDiffLabel} vs vous
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Message du joueur */}
        {availability.message && (
          <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">{availability.message}</p>
          </div>
        )}

        {/* Types de jeu */}
        <div className="flex items-center gap-2">
          {availability.gameTypes.map((type) => (
            <Badge key={type} variant="outline" className="text-xs">
              {type === 'simple' ? 'Simple' : 'Double'}
            </Badge>
          ))}
        </div>

        {/* Temps restant */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Disponible encore {timeRemaining}</span>
        </div>

        {/* Input message optionnel */}
        {showMessageInput && (
          <div className="space-y-2 pt-2">
            <Textarea
              placeholder="Ajouter un message (optionnel)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {!showMessageInput ? (
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => setShowMessageInput(true)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Je veux jouer !
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowMessageInput(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleRespond}
              disabled={isLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
