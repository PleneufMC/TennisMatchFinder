'use client';

/**
 * Hook pour gérer l'installation de la PWA
 * 
 * Gère :
 * - Détection de la disponibilité de l'installation
 * - Déclenchement du prompt d'installation
 * - Tracking du statut d'installation
 * - Détection si déjà installé
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UsePWAInstallReturn {
  /** L'installation est-elle disponible ? */
  isInstallable: boolean;
  /** L'app est-elle déjà installée ? */
  isInstalled: boolean;
  /** Est-on sur iOS (installation manuelle) ? */
  isIOS: boolean;
  /** Déclenche le prompt d'installation */
  promptInstall: () => Promise<boolean>;
  /** L'utilisateur a-t-il refusé l'installation ? */
  wasDismissed: boolean;
}

const DISMISSED_KEY = 'tmf_pwa_dismissed';
const DISMISSED_EXPIRY_DAYS = 7;

export function usePWAInstall(): UsePWAInstallReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [wasDismissed, setWasDismissed] = useState(false);

  // Vérifier si l'utilisateur a refusé récemment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed < DISMISSED_EXPIRY_DAYS) {
        setWasDismissed(true);
      } else {
        localStorage.removeItem(DISMISSED_KEY);
      }
    }
  }, []);

  // Détecter iOS
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                        !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);
  }, []);

  // Détecter si déjà installé
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Méthode 1: display-mode standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Méthode 2: navigator.standalone (iOS Safari)
    const isIOSStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    
    // Méthode 3: Référrer indique une PWA
    const isFromHomescreen = document.referrer.includes('android-app://');

    setIsInstalled(isStandalone || isIOSStandalone || isFromHomescreen);
  }, []);

  // Capturer l'événement beforeinstallprompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher Chrome d'afficher automatiquement le prompt
      e.preventDefault();
      // Stocker l'événement pour l'utiliser plus tard
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      // Nettoyer le dismissed flag
      localStorage.removeItem(DISMISSED_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Fonction pour déclencher l'installation
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      return false;
    }

    try {
      // Afficher le prompt
      await installPrompt.prompt();

      // Attendre la réponse de l'utilisateur
      const choiceResult = await installPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setInstallPrompt(null);
        return true;
      } else {
        // L'utilisateur a refusé
        setWasDismissed(true);
        localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error prompting install:', error);
      return false;
    }
  }, [installPrompt]);

  return {
    isInstallable: !!installPrompt && !isInstalled && !wasDismissed,
    isInstalled,
    isIOS,
    promptInstall,
    wasDismissed,
  };
}

export default usePWAInstall;
