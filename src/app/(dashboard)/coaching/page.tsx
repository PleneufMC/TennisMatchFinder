/**
 * Page Coaching — Marketplace profs (Lot 2).
 *
 * Onglet unique adaptatif :
 *  - Joueur : parcourt les créneaux ouverts, en réserve, voit le tarif indicatif,
 *    et peut « Devenir coach » (abonnement 15 €/mois).
 *  - Coach (abonnement actif) : gère son profil et ses créneaux (publier, annuler,
 *    confirmer, marquer effectué).
 *
 * La page serveur ne fait que rendre l'island client, qui charge le contexte
 * via /api/coaching/me et bascule entre les deux vues.
 */
import { CoachingClient } from '@/components/coaching/coaching-client';

// Page authentifiée s'appuyant sur useSearchParams (retour Stripe) : rendu dynamique.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Coaching | TennisMatchFinder',
  description:
    'Réservez un créneau avec un coach de votre club ou devenez coach pour publier vos créneaux.',
};

export default function CoachingPage() {
  return <CoachingClient />;
}
