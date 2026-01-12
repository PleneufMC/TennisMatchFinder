'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import type { PlayerData } from '@/types/player';

interface UsePlayerReturn {
  player: PlayerData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePlayer(): UsePlayerReturn {
  const { data: session, status, update } = useSession();

  const player = session?.user?.player || null;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
      if (status === 'authenticated' && !player) {
        console.warn('[usePlayer] User authenticated but no player data:', {
          userId: session?.user?.id,
          userName: session?.user?.name,
          userEmail: session?.user?.email,
          hasPlayer: !!player,
        });
      }
    }
  }, [status, player, session]);

  return {
    player,
    isLoading,
    isAuthenticated,
    error: null,
    refetch: () => update(),
  };
}
