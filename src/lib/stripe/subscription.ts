import { db } from '@/lib/db';
import { subscriptions, payments, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { stripe, getTierFromPriceId, STRIPE_PLANS } from './config';
import type { SubscriptionTier, SubscriptionStatus } from '@/lib/db/schema';

// Get or create Stripe customer
export async function getOrCreateStripeCustomer(userId: string, email: string, name?: string) {
  // Check if user already has a subscription with a customer ID
  const existingSub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existingSub.length > 0) {
    const sub = existingSub[0];
    if (sub && sub.stripeCustomerId) {
      return sub.stripeCustomerId;
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  return customer.id;
}

// Get user's active subscription
export async function getUserSubscription(userId: string) {
  const sub = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      )
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return sub[0] || null;
}

// Get user's subscription tier (defaults to 'free')
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  // 🎁 EARLY BIRD MODE: Tout le monde a accès Pro gratuitement pendant la phase de lancement
  // TODO: Désactiver cette ligne quand on active le paywall
  if (process.env.EARLY_BIRD_MODE === 'true') {
    return 'pro';
  }
  
  const sub = await getUserSubscription(userId);
  if (!sub) return 'free';
  
  // Check if subscription is still valid
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) {
    return 'free';
  }
  
  return sub.tier;
}

// Check if user has premium access (premium or pro)
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === 'premium' || tier === 'pro';
}

// Check if user has pro access
export async function hasProAccess(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === 'pro';
}

// Create checkout session
export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const customerId = await getOrCreateStripeCustomer(userId, email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });

  return session;
}

// Create customer portal session
export async function createPortalSession(userId: string, returnUrl: string) {
  const sub = await getUserSubscription(userId);
  if (!sub) {
    throw new Error('No active subscription found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

// Handle subscription created/updated from webhook
export async function handleSubscriptionChange(
  stripeSubscription: {
    id: string;
    customer: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    canceled_at: number | null;
    trial_start: number | null;
    trial_end: number | null;
    items: { data: Array<{ price: { id: string } }> };
    metadata: { userId?: string };
  }
) {
  const userId = stripeSubscription.metadata.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const priceItem = stripeSubscription.items.data[0];
  const priceId = priceItem?.price.id || '';
  const tier = getTierFromPriceId(priceId);

  // Check if subscription exists
  const existingSub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
    .limit(1);

  const subData = {
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: priceId,
    tier,
    status: stripeSubscription.status as SubscriptionStatus,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    canceledAt: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000)
      : null,
    trialStart: stripeSubscription.trial_start
      ? new Date(stripeSubscription.trial_start * 1000)
      : null,
    trialEnd: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : null,
    updatedAt: new Date(),
  };

  if (existingSub.length > 0) {
    const existing = existingSub[0];
    if (!existing) {
      console.error('Subscription not found despite length > 0');
      return;
    }
    // Update existing subscription
    await db
      .update(subscriptions)
      .set(subData)
      .where(eq(subscriptions.id, existing.id));
  } else {
    // Create new subscription
    await db.insert(subscriptions).values({
      userId,
      stripeCustomerId: stripeSubscription.customer as string,
      ...subData,
    });
  }
}

// Handle subscription deleted from webhook
export async function handleSubscriptionDeleted(stripeSubscriptionId: string) {
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

// Record a payment
export async function recordPayment(
  userId: string,
  stripePaymentIntentId: string,
  stripeInvoiceId: string | null,
  amount: number,
  currency: string,
  status: string,
  subscriptionId?: string
) {
  await db.insert(payments).values({
    userId,
    subscriptionId,
    stripePaymentIntentId,
    stripeInvoiceId,
    amount,
    currency,
    status,
    paidAt: status === 'succeeded' ? new Date() : null,
  });
}

// Get plan limits for a tier
export function getPlanLimits(tier: SubscriptionTier) {
  switch (tier) {
    case 'pro':
      return STRIPE_PLANS.PRO.limits;
    case 'premium':
      return STRIPE_PLANS.PREMIUM.limits;
    default:
      return STRIPE_PLANS.FREE.limits;
  }
}

// Check if user can use a feature
export async function canUseFeature(
  userId: string,
  feature: keyof (typeof STRIPE_PLANS.FREE.limits)
): Promise<boolean> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);
  
  const featureValue = limits[feature];
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }
  // For numeric limits, -1 means unlimited
  return featureValue === -1 || featureValue > 0;
}
