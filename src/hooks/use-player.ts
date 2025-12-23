'use client';

import { useSession } from 'next-auth/react';

interface PlayerData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
  clubId: string;
  clubName: string;
  clubSlug: string;
  isAdmin: boolean;
  isVerified: boolean;
}

interface UsePlayerReturn {
  player: PlayerData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePlayer(): UsePlayerReturn {
  const { data: session, status, update } = useSession();

  const player = session?.user?.player || null;
  const isLoading = status === 'loading';
  const error = null; // NextAuth doesn't provide error in the same way

  return {
    player,
    isLoading,
    error,
    refetch: () => update(),
  };
}
