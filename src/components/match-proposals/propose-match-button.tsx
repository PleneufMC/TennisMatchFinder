'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProposeMatchModal } from '@/components/match-proposals';

interface Player {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  currentElo?: number;
}

interface ProposeMatchButtonProps {
  player: Player;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ProposeMatchButton({ 
  player, 
  variant = 'default',
  size = 'default',
  className 
}: ProposeMatchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        className={className}
        onClick={() => setIsModalOpen(true)}
      >
        <Send className="h-4 w-4 mr-2" />
        Proposer un match
      </Button>

      <ProposeMatchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        player={player}
      />
    </>
  );
}
