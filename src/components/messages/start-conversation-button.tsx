'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StartConversationButtonProps {
  playerId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function StartConversationButton({
  playerId,
  variant = 'outline',
  size = 'default',
  className,
}: StartConversationButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherPlayerId: playerId }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversation.id}`);
      } else {
        console.error('Failed to create conversation');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4 mr-2" />
      )}
      Message
    </Button>
  );
}
