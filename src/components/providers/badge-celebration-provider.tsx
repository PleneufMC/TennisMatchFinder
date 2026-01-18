'use client';

/**
 * Badge Celebration Provider
 * 
 * Provider global qui vérifie les badges non vus après chaque chargement
 * et affiche le modal de célébration pour chaque nouveau badge débloqué.
 * 
 * Fonctionnement :
 * 1. Au montage, fetch les badges non vus via /api/badges
 * 2. Affiche le modal pour chaque badge non vu (un à la fois)
 * 3. Marque le badge comme vu via POST /api/badges/[badgeId]/seen
 * 4. Passe au badge suivant
 */

import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BadgeUnlockModal } from '@/components/gamification/BadgeUnlockModal';
import type { BadgeDefinition } from '@/lib/gamification/badges';

// ============================================
// TYPES
// ============================================

interface UnseenBadge extends BadgeDefinition {
  earnedAt: string | null;
  progress: number;
  seen: boolean;
}

interface BadgeCelebrationContextType {
  /** Force le refresh des badges (après un match confirmé par ex.) */
  refreshBadges: () => Promise<void>;
  /** Nombre de badges en attente de célébration */
  pendingCount: number;
}

// ============================================
// CONTEXT
// ============================================

const BadgeCelebrationContext = createContext<BadgeCelebrationContextType>({
  refreshBadges: async () => {},
  pendingCount: 0,
});

export const useBadgeCelebration = () => useContext(BadgeCelebrationContext);

// ============================================
// PROVIDER
// ============================================

export function BadgeCelebrationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [unseenBadges, setUnseenBadges] = useState<UnseenBadge[]>([]);
  const [currentBadge, setCurrentBadge] = useState<UnseenBadge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch badges non vus
  const fetchUnseenBadges = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/badges', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }
      
      const data = await response.json();
      const unseen = (data.unseenBadges || []) as UnseenBadge[];
      
      if (unseen.length > 0) {
        setUnseenBadges(unseen);
        // Afficher le premier badge
        const firstBadge = unseen[0];
        if (firstBadge) {
          setCurrentBadge(firstBadge);
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      console.error('[BadgeCelebration] Error fetching badges:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status]);
  
  // Marquer un badge comme vu
  const markBadgeAsSeen = useCallback(async (badgeId: string) => {
    try {
      await fetch(`/api/badges/${badgeId}/seen`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[BadgeCelebration] Error marking badge as seen:', error);
    }
  }, []);
  
  // Fermer le modal et passer au badge suivant
  const handleClose = useCallback(async () => {
    if (currentBadge) {
      // Marquer comme vu
      await markBadgeAsSeen(currentBadge.id);
      
      // Retirer de la liste
      const remaining = unseenBadges.filter(b => b.id !== currentBadge.id);
      setUnseenBadges(remaining);
      
      if (remaining.length > 0) {
        // Afficher le suivant après un court délai
        const nextBadge = remaining[0];
        if (nextBadge) {
          setTimeout(() => {
            setCurrentBadge(nextBadge);
            setIsModalOpen(true);
          }, 500);
        }
      } else {
        setCurrentBadge(null);
      }
    }
    
    setIsModalOpen(false);
  }, [currentBadge, unseenBadges, markBadgeAsSeen]);
  
  // Naviguer vers le Trophy Case
  const handleViewTrophyCase = useCallback(() => {
    handleClose();
    router.push('/achievements');
  }, [handleClose, router]);
  
  // Partager (TODO: implémenter le partage social)
  const handleShare = useCallback(() => {
    if (!currentBadge) return;
    
    // Web Share API si disponible
    if (navigator.share) {
      navigator.share({
        title: `J'ai débloqué le badge "${currentBadge.name}" !`,
        text: `${currentBadge.description} - TennisMatchFinder`,
        url: 'https://tennismatchfinder.net/achievements',
      }).catch(() => {
        // Silently fail if user cancels
      });
    } else {
      // Fallback: copier le lien
      navigator.clipboard.writeText(
        `J'ai débloqué le badge "${currentBadge.name}" sur TennisMatchFinder ! 🏆\nhttps://tennismatchfinder.net`
      );
    }
  }, [currentBadge]);
  
  // Fetch au montage si authentifié
  useEffect(() => {
    if (status === 'authenticated') {
      // Délai pour ne pas bloquer le rendu initial
      const timer = setTimeout(() => {
        fetchUnseenBadges();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status, fetchUnseenBadges]);
  
  // Contexte pour permettre le refresh externe
  const contextValue: BadgeCelebrationContextType = {
    refreshBadges: fetchUnseenBadges,
    pendingCount: unseenBadges.length,
  };
  
  return (
    <BadgeCelebrationContext.Provider value={contextValue}>
      {children}
      
      {/* Modal de célébration */}
      <BadgeUnlockModal
        badge={currentBadge}
        open={isModalOpen}
        onClose={handleClose}
        onShare={handleShare}
        onViewTrophyCase={handleViewTrophyCase}
      />
    </BadgeCelebrationContext.Provider>
  );
}

export default BadgeCelebrationProvider;
