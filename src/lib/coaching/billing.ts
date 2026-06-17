/**
 * Facturation Coach — abonnement 15 €/mois via Stripe Subscriptions.
 *
 * Distinct des abonnements joueurs (premium/pro) : on stocke l'état directement
 * dans coach_profiles (pas dans la table subscriptions). Le Checkout coach porte
 * metadata.type = 'coach_subscription' pour que le webhook route correctement.
 *
 * PAS de Stripe Connect. Le coach paie TMF pour l'OUTIL (publication de créneaux).
 */

import { db } from '@/lib/db';
import { coachProfiles, players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { stripe, STRIPE_COACH_PRICE_ID } from '@/lib/stripe/config';
import {
  getCoachProfileByPlayer,
  upsertCoachProfile,
  isCoachSubscriptionActive,
  type CoachSubscriptionStatus,
} from './service';

// Marqueur metadata permettant au webhook de distinguer un abonnement coach
export const COACH_SUBSCRIPTION_METADATA_TYPE = 'coach_subscription';

/** Mappe un statut Stripe vers notre enum coach_subscription_status. */
function mapStripeStatusToCoach(stripeStatus: string): CoachSubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    case 'canceled':
    case 'unpaid':
    case 'paused':
    default:
      return 'canceled';
  }
}

/**
 * Crée une session Stripe Checkout pour l'abonnement coach (15 €/mois).
 * Garantit l'existence d'un profil coach (créé en brouillon si besoin) et
 * réutilise/crée le customer Stripe rattaché à ce profil.
 */
export async function createCoachCheckoutSession(params: {
  playerId: string;
  email: string;
  name?: string;
  clubId?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const { playerId, email, name, clubId, successUrl, cancelUrl } = params;

  // S'assurer qu'un profil coach existe (brouillon, non publié, sans abo encore)
  let profile = await getCoachProfileByPlayer(playerId);
  if (!profile) {
    profile = await upsertCoachProfile({ playerId, clubId: clubId ?? null });
  }

  // Réutiliser ou créer le customer Stripe du coach
  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: { playerId, coachProfileId: profile.id },
    });
    customerId = customer.id;
    await db
      .update(coachProfiles)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(coachProfiles.id, profile.id));
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: STRIPE_COACH_PRICE_ID, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: COACH_SUBSCRIPTION_METADATA_TYPE,
      playerId,
      coachProfileId: profile.id,
    },
    subscription_data: {
      metadata: {
        type: COACH_SUBSCRIPTION_METADATA_TYPE,
        playerId,
        coachProfileId: profile.id,
      },
    },
    billing_address_collection: 'required',
  });

  return session;
}

/** Ouvre le portail de gestion d'abonnement Stripe pour le coach. */
export async function createCoachPortalSession(playerId: string, returnUrl: string) {
  const profile = await getCoachProfileByPlayer(playerId);
  if (!profile?.stripeCustomerId) {
    throw new Error('Aucun abonnement coach trouvé');
  }
  return stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: returnUrl,
  });
}

/**
 * Met à jour l'état de l'abonnement coach depuis un événement webhook Stripe
 * (customer.subscription.created/updated portant metadata.type='coach_subscription').
 * Active/désactive aussi le flag players.is_coach selon l'état de l'abo.
 */
export async function handleCoachSubscriptionChange(sub: {
  id: string;
  customer: string;
  status: string;
  current_period_end?: number;
  cancel_at_period_end: boolean;
  metadata: { playerId?: string; coachProfileId?: string };
}): Promise<void> {
  const { playerId, coachProfileId } = sub.metadata;
  if (!playerId && !coachProfileId) {
    console.error('[coach-billing] subscription sans playerId/coachProfileId');
    return;
  }

  const status = mapStripeStatusToCoach(sub.status);
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000)
    : null;

  // Cibler le profil par coachProfileId si dispo, sinon par playerId
  const whereClause = coachProfileId
    ? eq(coachProfiles.id, coachProfileId)
    : eq(coachProfiles.playerId, playerId as string);

  await db
    .update(coachProfiles)
    .set({
      stripeSubscriptionId: sub.id,
      stripeCustomerId: sub.customer,
      subscriptionStatus: status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(whereClause);

  // Synchroniser le flag players.is_coach : actif => coach, sinon retiré du rôle public
  if (playerId) {
    await db
      .update(players)
      .set({ isCoach: isCoachSubscriptionActive(status) })
      .where(eq(players.id, playerId));
  }
}

/** Traite la suppression d'un abonnement coach (fin d'abonnement). */
export async function handleCoachSubscriptionDeleted(stripeSubscriptionId: string): Promise<void> {
  const [profile] = await db
    .select()
    .from(coachProfiles)
    .where(eq(coachProfiles.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (!profile) return;

  await db
    .update(coachProfiles)
    .set({
      subscriptionStatus: 'canceled',
      isPublished: false, // plus d'abo => plus visible
      updatedAt: new Date(),
    })
    .where(eq(coachProfiles.id, profile.id));

  // Retirer le rôle coach public
  await db.update(players).set({ isCoach: false }).where(eq(players.id, profile.playerId));
}
