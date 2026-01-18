/**
 * Page Offline — Affichée quand l'utilisateur est hors connexion
 */

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Hors connexion',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-md">
        {/* Icône animée */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <span className="text-4xl">🎾</span>
          </div>
        </div>

        {/* Message principal */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Vous êtes hors connexion
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Pas de connexion Internet détectée. Vérifiez votre connexion et réessayez.
        </p>

        {/* Ce qui reste accessible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
          <p className="font-medium text-gray-900 dark:text-white mb-2">
            📱 En mode hors-ligne, vous pouvez :
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Consulter votre profil en cache</li>
            <li>• Voir vos derniers matchs</li>
            <li>• Parcourir les pages déjà visitées</li>
          </ul>
        </div>

        {/* Bouton de retry */}
        <Button
          onClick={() => window.location.reload()}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>

        {/* Info sur la PWA */}
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          TennisMatchFinder fonctionne mieux avec une connexion Internet.
          <br />
          Les données seront synchronisées automatiquement à la reconnexion.
        </p>
      </div>
    </div>
  );
}
