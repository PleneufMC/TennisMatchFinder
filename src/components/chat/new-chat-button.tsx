'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/avatar';
import type { Player } from '@/lib/db/schema';

interface NewChatButtonProps {
  currentPlayerId: string;
  clubId: string;
  targetPlayer: Player;
}

export function NewChatButton({
  currentPlayerId,
  clubId,
  targetPlayer,
}: NewChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartChat = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          player1Id: currentPlayerId,
          player2Id: targetPlayer.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const { roomId } = await response.json();
      router.push(`/chat/${roomId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={isLoading}
      className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
    >
      <PlayerAvatar
        src={targetPlayer.avatarUrl}
        name={targetPlayer.fullName}
        size="lg"
      />

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{targetPlayer.fullName}</p>
        <p className="text-sm text-muted-foreground">
          ELO: {targetPlayer.currentElo} • {targetPlayer.matchesPlayed} match
          {targetPlayer.matchesPlayed !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-shrink-0">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}
