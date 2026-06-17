'use client';

import { useState, useEffect } from 'react';
import { Gift, Clock } from 'lucide-react';

// Configuration Early Bird — source unique de vérité pour la date de fin
export const EARLY_BIRD_END_DATE = new Date('2026-06-30T23:59:59');

/**
 * EarlyBirdCountdown — île client.
 *
 * Calculé côté client à l'hydratation puis rafraîchi chaque heure, afin que le
 * nombre de jours restants reste exact même si la landing (Server Component) est
 * mise en cache / pré-rendue. Évite l'affichage d'un compteur figé/périmé.
 */
export function EarlyBirdCountdown() {
  const computeDaysLeft = () => {
    const timeLeft = EARLY_BIRD_END_DATE.getTime() - Date.now();
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  };

  // Valeur initiale stable pour le rendu serveur/hydratation, puis recalcul client.
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    setDaysLeft(computeDaysLeft());
    const interval = setInterval(() => setDaysLeft(computeDaysLeft()), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Offre terminée : on n'affiche plus le bandeau Early Bird.
  if (daysLeft === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-6">
      {/* Badge principale */}
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full px-5 py-2.5 shadow-lg shadow-amber-500/30">
        <Gift className="h-5 w-5" />
        <span className="font-bold">Offre Early Bird</span>
      </div>

      {/* Compte à rebours */}
      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2">
        <Clock className="h-4 w-4 text-amber-300" />
        <span className="text-white font-medium">
          Gratuit jusqu&apos;au <span className="text-amber-300 font-bold">30 juin 2026</span>
        </span>
        {daysLeft !== null && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {daysLeft}j
          </span>
        )}
      </div>
    </div>
  );
}
