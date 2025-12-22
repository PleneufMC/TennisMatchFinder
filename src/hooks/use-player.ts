'use client';

import { useEffect, useState } from 'react';
import { getClient } from '@/lib/supabase/client';
import type { Player, Club } from '@/types';

type PlayerWithClub = Player & { clubs: Club };

interface UsePlayerReturn {
  player: PlayerWithClub | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePlayer(): UsePlayerReturn {
  const [player, setPlayer] = useState<PlayerWithClub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getClient();

  const fetchPlayer = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer l'utilisateur authentifié
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setPlayer(null);
        return;
      }

      // Récupérer le profil joueur avec le club
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*, clubs(*)')
        .eq('id', user.id)
        .single();

      if (playerError) {
        throw playerError;
      }

      setPlayer(playerData as PlayerWithClub);
    } catch (err) {
      console.error('Error fetching player:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch player'));
      setPlayer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayer();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchPlayer();
        } else if (event === 'SIGNED_OUT') {
          setPlayer(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    player,
    isLoading,
    error,
    refetch: fetchPlayer,
  };
}
