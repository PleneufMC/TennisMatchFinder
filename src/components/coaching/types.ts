/**
 * Types côté client pour la marketplace coaching.
 * Les dates arrivent sérialisées en string via JSON.
 */

export interface CoachProfileDTO {
  id: string;
  playerId: string;
  clubId: string | null;
  bio: string | null;
  hourlyRateCents: number | null;
  specialties: string[];
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'incomplete' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoachSlotDTO {
  id: string;
  coachProfileId: string;
  coachPlayerId: string;
  clubId: string | null;
  startTime: string;
  durationMinutes: number;
  priceCents: number | null;
  location: string | null;
  notes: string | null;
  status: 'open' | 'booked' | 'confirmed' | 'completed' | 'cancelled';
  bookedByPlayerId: string | null;
  bookedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpenSlotDTO extends CoachSlotDTO {
  coach: { id: string; fullName: string; avatarUrl: string | null };
}

export interface CoachingContext {
  isCoach: boolean;
  subscriptionActive: boolean;
  profile: CoachProfileDTO | null;
  slots: CoachSlotDTO[];
  completedCount: number;
}

/** Formate un prix en centimes en libellé euros (ou null si non renseigné). */
export function formatPrice(priceCents: number | null | undefined): string | null {
  if (priceCents === null || priceCents === undefined) return null;
  const euros = priceCents / 100;
  return euros.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

/** Libellé lisible d'un statut de créneau. */
export const SLOT_STATUS_LABELS: Record<CoachSlotDTO['status'], string> = {
  open: 'Disponible',
  booked: 'Réservé',
  confirmed: 'Confirmé',
  completed: 'Effectué',
  cancelled: 'Annulé',
};
