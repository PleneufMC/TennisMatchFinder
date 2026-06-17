/**
 * Service Coaching - Marketplace profs
 *
 * Modèle économique : abonnement coach 15 €/mois (Stripe Subscriptions existant).
 * PAS de Stripe Connect, PAS de commission par lead. Le coach paie pour l'OUTIL
 * (publication de créneaux + visibilité), ce qui rend le modèle insensible à la
 * désintermédiation. Le paiement du cours joueur->coach se fait HORS plateforme :
 * le tarif est affiché à titre purement indicatif.
 *
 * Cette couche porte la logique métier : profil coach, CRUD créneaux, cycle de vie
 * (open->booked->confirmed->completed|cancelled) et réservation par un joueur.
 * La souscription Stripe est branchée séparément (étape 2.2).
 */

import { db } from '@/lib/db';
import { coachProfiles, coachSlots, players, notifications } from '@/lib/db/schema';
import { and, desc, eq, gte, ne, sql } from 'drizzle-orm';

// Durée standard d'un créneau de coaching (minutes)
export const COACH_SLOT_DURATION_MINUTES = 60;

// Statuts considérés comme "abonnement actif" (droit de publier des créneaux)
const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'past_due'] as const;

// ============================================
// TYPES
// ============================================

export type CoachSubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete';
export type CoachSlotStatus = 'open' | 'booked' | 'confirmed' | 'completed' | 'cancelled';

export interface CoachProfile {
  id: string;
  playerId: string;
  clubId: string | null;
  bio: string | null;
  hourlyRateCents: number | null;
  specialties: string[];
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: CoachSubscriptionStatus | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoachSlot {
  id: string;
  coachProfileId: string;
  coachPlayerId: string;
  clubId: string | null;
  startTime: Date;
  durationMinutes: number;
  priceCents: number | null;
  location: string | null;
  notes: string | null;
  status: CoachSlotStatus;
  bookedByPlayerId: string | null;
  bookedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertCoachProfileParams {
  playerId: string;
  clubId?: string | null;
  bio?: string | null;
  hourlyRateCents?: number | null;
  specialties?: string[];
}

export interface CreateCoachSlotParams {
  coachProfileId: string;
  coachPlayerId: string;
  clubId?: string | null;
  startTime: Date;
  priceCents?: number | null;
  location?: string | null;
  notes?: string | null;
}

// ============================================
// HELPERS
// ============================================

/** Un abonnement coach est "actif" (droit de publier) si son statut le permet. */
export function isCoachSubscriptionActive(
  status: CoachSubscriptionStatus | null | undefined
): boolean {
  if (!status) return false;
  return (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

// ============================================
// PROFIL COACH
// ============================================

/** Récupère le profil coach d'un joueur (null si pas coach). */
export async function getCoachProfileByPlayer(playerId: string): Promise<CoachProfile | null> {
  const [row] = await db
    .select()
    .from(coachProfiles)
    .where(eq(coachProfiles.playerId, playerId))
    .limit(1);
  return (row as CoachProfile) ?? null;
}

/** Récupère un profil coach par son id. */
export async function getCoachProfileById(id: string): Promise<CoachProfile | null> {
  const [row] = await db
    .select()
    .from(coachProfiles)
    .where(eq(coachProfiles.id, id))
    .limit(1);
  return (row as CoachProfile) ?? null;
}

/**
 * Crée ou met à jour le profil coach d'un membre (infos publiques).
 * N'active PAS l'abonnement : la souscription Stripe est gérée séparément (2.2).
 * Synchronise aussi le flag players.is_coach.
 */
export async function upsertCoachProfile(params: UpsertCoachProfileParams): Promise<CoachProfile> {
  const { playerId, clubId, bio, hourlyRateCents, specialties } = params;

  const existing = await getCoachProfileByPlayer(playerId);

  let profile: CoachProfile;
  if (existing) {
    const [updated] = await db
      .update(coachProfiles)
      .set({
        ...(clubId !== undefined ? { clubId } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(hourlyRateCents !== undefined ? { hourlyRateCents } : {}),
        ...(specialties !== undefined ? { specialties } : {}),
        updatedAt: new Date(),
      })
      .where(eq(coachProfiles.id, existing.id))
      .returning();
    profile = updated as CoachProfile;
  } else {
    const [created] = await db
      .insert(coachProfiles)
      .values({
        playerId,
        clubId: clubId ?? null,
        bio: bio ?? null,
        hourlyRateCents: hourlyRateCents ?? null,
        specialties: specialties ?? [],
        isPublished: false,
      })
      .returning();
    profile = created as CoachProfile;
  }

  // Marque le membre comme coach (un joueur peut être aussi coach)
  await db.update(players).set({ isCoach: true }).where(eq(players.id, playerId));

  return profile;
}

/** Active/désactive la visibilité publique du profil coach. */
export async function setCoachPublished(playerId: string, isPublished: boolean): Promise<void> {
  await db
    .update(coachProfiles)
    .set({ isPublished, updatedAt: new Date() })
    .where(eq(coachProfiles.playerId, playerId));
}

// ============================================
// CRÉNEAUX (côté coach)
// ============================================

/**
 * Crée un créneau de coaching (60 min). Refuse si l'abonnement coach n'est pas actif.
 */
export async function createCoachSlot(params: CreateCoachSlotParams): Promise<CoachSlot> {
  const { coachProfileId, coachPlayerId, clubId, startTime, priceCents, location, notes } = params;

  const profile = await getCoachProfileById(coachProfileId);
  if (!profile) {
    throw new Error('Profil coach introuvable');
  }
  if (profile.playerId !== coachPlayerId) {
    throw new Error('Ce profil coach ne vous appartient pas');
  }
  if (!isCoachSubscriptionActive(profile.subscriptionStatus)) {
    throw new Error('Un abonnement coach actif est requis pour publier des créneaux');
  }

  const [created] = await db
    .insert(coachSlots)
    .values({
      coachProfileId,
      coachPlayerId,
      clubId: clubId ?? profile.clubId ?? null,
      startTime,
      durationMinutes: COACH_SLOT_DURATION_MINUTES,
      priceCents: priceCents ?? profile.hourlyRateCents ?? null,
      location: location ?? null,
      notes: notes ?? null,
      status: 'open',
    })
    .returning();

  if (!created) {
    throw new Error('Erreur lors de la création du créneau');
  }
  return created as CoachSlot;
}

/** Liste les créneaux d'un coach (les plus récents d'abord). */
export async function getSlotsByCoach(coachPlayerId: string): Promise<CoachSlot[]> {
  const rows = await db
    .select()
    .from(coachSlots)
    .where(eq(coachSlots.coachPlayerId, coachPlayerId))
    .orderBy(desc(coachSlots.startTime));
  return rows as CoachSlot[];
}

/**
 * Liste les créneaux ouverts à venir (réservables), avec infos coach.
 * clubId optionnel : si fourni, filtre sur ce club (séparation multi-club),
 * sinon renvoie tous les créneaux ouverts (vue cross-club / proximité).
 */
export async function getOpenSlots(clubId?: string | null): Promise<
  (CoachSlot & {
    coach: { id: string; fullName: string; avatarUrl: string | null };
  })[]
> {
  const now = new Date();
  const rows = await db
    .select({
      slot: coachSlots,
      coach: {
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
      },
    })
    .from(coachSlots)
    .innerJoin(players, eq(coachSlots.coachPlayerId, players.id))
    .where(
      and(
        eq(coachSlots.status, 'open'),
        gte(coachSlots.startTime, now),
        clubId ? eq(coachSlots.clubId, clubId) : undefined
      )
    )
    .orderBy(coachSlots.startTime);

  return rows.map((r) => ({ ...(r.slot as CoachSlot), coach: r.coach }));
}

/** Annule un créneau (par le coach propriétaire). */
export async function cancelCoachSlot(slotId: string, coachPlayerId: string): Promise<void> {
  const [slot] = await db
    .select()
    .from(coachSlots)
    .where(eq(coachSlots.id, slotId))
    .limit(1);

  if (!slot || slot.coachPlayerId !== coachPlayerId) {
    throw new Error('Créneau introuvable ou non autorisé');
  }
  if (slot.status === 'completed') {
    throw new Error('Un créneau déjà effectué ne peut pas être annulé');
  }

  await db
    .update(coachSlots)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(coachSlots.id, slotId));

  // Prévenir le joueur si le créneau était réservé
  if (slot.bookedByPlayerId) {
    await db.insert(notifications).values({
      userId: slot.bookedByPlayerId,
      type: 'coach_slot_cancelled',
      title: '❌ Créneau de coaching annulé',
      message: 'Le coach a annulé un créneau que vous aviez réservé.',
      link: '/coaching',
      data: { slotId },
    });
  }
}

// ============================================
// RÉSERVATION (côté joueur)
// ============================================

/**
 * Réserve un créneau ouvert pour un joueur. Attribution "rempli par joueur Y"
 * tracée par construction (bookedByPlayerId). Garde anti-collision via la clause
 * WHERE status='open' dans l'UPDATE.
 */
export async function bookCoachSlot(slotId: string, playerId: string): Promise<CoachSlot> {
  const [slot] = await db
    .select()
    .from(coachSlots)
    .where(eq(coachSlots.id, slotId))
    .limit(1);

  if (!slot) {
    throw new Error('Créneau introuvable');
  }
  if (slot.coachPlayerId === playerId) {
    throw new Error('Vous ne pouvez pas réserver votre propre créneau');
  }
  if (slot.status !== 'open') {
    throw new Error('Ce créneau n\'est plus disponible');
  }

  // UPDATE conditionnel : ne réussit que si le créneau est toujours 'open'
  const [updated] = await db
    .update(coachSlots)
    .set({
      status: 'booked',
      bookedByPlayerId: playerId,
      bookedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(coachSlots.id, slotId), eq(coachSlots.status, 'open')))
    .returning();

  if (!updated) {
    throw new Error('Ce créneau vient d\'être réservé par quelqu\'un d\'autre');
  }

  // Notifier le coach
  const [player] = await db
    .select({ fullName: players.fullName })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  await db.insert(notifications).values({
    userId: slot.coachPlayerId,
    type: 'coach_slot_booked',
    title: '🎾 Créneau réservé !',
    message: `${player?.fullName ?? 'Un joueur'} a réservé un de vos créneaux de coaching.`,
    link: '/coaching/creneaux',
    data: { slotId, bookedByPlayerId: playerId },
  });

  return updated as CoachSlot;
}

/**
 * Transition de statut d'un créneau par le coach :
 * confirm  : booked    -> confirmed
 * complete : confirmed -> completed (cours effectué : base stats/avis)
 */
export async function updateSlotStatusByCoach(
  slotId: string,
  coachPlayerId: string,
  action: 'confirm' | 'complete'
): Promise<CoachSlot> {
  const [slot] = await db
    .select()
    .from(coachSlots)
    .where(eq(coachSlots.id, slotId))
    .limit(1);

  if (!slot || slot.coachPlayerId !== coachPlayerId) {
    throw new Error('Créneau introuvable ou non autorisé');
  }

  if (action === 'confirm') {
    if (slot.status !== 'booked') {
      throw new Error('Seul un créneau réservé peut être confirmé');
    }
    const [updated] = await db
      .update(coachSlots)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(eq(coachSlots.id, slotId))
      .returning();
    return updated as CoachSlot;
  }

  // action === 'complete'
  if (slot.status !== 'confirmed') {
    throw new Error('Seul un créneau confirmé peut être marqué comme effectué');
  }
  const [updated] = await db
    .update(coachSlots)
    .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
    .where(eq(coachSlots.id, slotId))
    .returning();
  return updated as CoachSlot;
}

/** Compte les créneaux effectués d'un coach (stats). */
export async function countCompletedSlots(coachPlayerId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(coachSlots)
    .where(and(eq(coachSlots.coachPlayerId, coachPlayerId), eq(coachSlots.status, 'completed')));
  return row?.count ?? 0;
}
