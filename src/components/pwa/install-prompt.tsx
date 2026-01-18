'use client';

/**
 * PWA Install Prompt
 * 
 * Bannière qui invite l'utilisateur à installer l'application.
 * S'affiche uniquement si :
 * - L'installation est disponible
 * - L'app n'est pas déjà installée
 * - L'utilisateur n'a pas refusé récemment
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Afficher après un délai pour ne pas interrompre l'expérience
  useEffect(() => {
    if (isInstalled) return;

    const timer = setTimeout(() => {
      if (isInstallable || isIOS) {
        setIsVisible(true);
      }
    }, 5000); // 5 secondes après le chargement

    return () => clearTimeout(timer);
  }, [isInstallable, isIOS, isInstalled]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const success = await promptInstall();
      if (success) {
        setIsVisible(false);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSInstructions(false);
  };

  // Ne rien afficher si déjà installé
  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Smartphone className="w-5 h-5" />
                <span className="font-semibold">Installer l&apos;app</span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {!showIOSInstructions ? (
                <>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Installez TennisMatchFinder pour un accès rapide et des notifications push !
                  </p>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-sm font-bold border-2 border-white dark:border-gray-800">
                        🎾
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p>• Accès instantané depuis l&apos;écran d&apos;accueil</p>
                      <p>• Notifications de matchs en temps réel</p>
                      <p>• Mode hors-ligne</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleInstall}
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Installer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDismiss}
                      className="px-3"
                    >
                      Plus tard
                    </Button>
                  </div>
                </>
              ) : (
                /* Instructions iOS */
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                    Pour installer sur iPhone/iPad :
                  </p>
                  
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                        1
                      </span>
                      <span>
                        Appuyez sur <Share className="w-4 h-4 inline text-blue-500" /> en bas de l&apos;écran
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                        2
                      </span>
                      <span>
                        Faites défiler et appuyez sur <Plus className="w-4 h-4 inline" /> <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                        3
                      </span>
                      <span>Appuyez sur <strong>&quot;Ajouter&quot;</strong></span>
                    </li>
                  </ol>

                  <Button
                    variant="outline"
                    onClick={() => setShowIOSInstructions(false)}
                    className="w-full mt-2"
                  >
                    Compris !
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PWAInstallPrompt;
