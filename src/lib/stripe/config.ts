import Stripe from 'stripe';

// Lazy initialization of Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backward compatibility - use getStripe() for lazy initialization
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
  get invoices() { return getStripe().invoices; },
  get prices() { return getStripe().prices; },
  get products() { return getStripe().products; },
};

// ============================================
// STRIPE PRODUCTS & PRICES (REAL IDs)
// ============================================
// Premium Mensuel: prod_TkkGjS5zwAMEG0 / price_1SnEm8IkmQ7vFcvcvPLnGOT2 (9.99€/mois)
// Premium Annuel:  prod_TkkIGodB2NEhoJ / price_1SnEnTIkmQ7vFcvcJdy5nWog (99€/an)
// ============================================

// Pricing configuration - Only FREE and PREMIUM (no Pro for now)
export const STRIPE_PLANS = {
  FREE: {
    id: 'free',
    name: 'Gratuit',
    description: 'Découvrez TennisMatchFinder',
    price: 0,
    priceId: null,
    features: [
      '3 suggestions d\'adversaires / semaine',
      'Statistiques basiques',
      'Forum (lecture seule)',
      'Chat limité',
      'Classement (vue)',
    ],
    limits: {
      suggestionsPerWeek: 3,
      forumWrite: false,
      chatUnlimited: false,
      advancedStats: false,
      tournaments: false,
      boxLeagues: false,
      dataExport: false,
    },
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    description: 'Toutes les fonctionnalités pour les joueurs passionnés',
    price: 99,
    yearlyPrice: 99,
    monthlyPrice: 9.99,
    // Real Stripe Price IDs
    stripeProductIdMonthly: 'prod_TkkGjS5zwAMEG0',
    stripeProductIdYearly: 'prod_TkkIGodB2NEhoJ',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_1SnEm8IkmQ7vFcvcvPLnGOT2',
    stripePriceIdYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || 'price_1SnEnTIkmQ7vFcvcJdy5nWog',
    features: [
      'Suggestions illimitées',
      'Statistiques avancées',
      'Forum (lecture & écriture)',
      'Chat illimité',
      'Filtres avancés classement',
      'Badge "Membre Premium"',
      'Explication ELO détaillée',
      'Tournois & Box Leagues',
      'Export des données',
      'Support prioritaire',
    ],
    limits: {
      suggestionsPerWeek: -1, // unlimited
      forumWrite: true,
      chatUnlimited: true,
      advancedStats: true,
      tournaments: true,
      boxLeagues: true,
      dataExport: true,
    },
  },
} as const;

// Keep PRO as alias to PREMIUM for backward compatibility
// In the future, PRO could be a separate "Club" plan
export const STRIPE_PLANS_WITH_PRO = {
  ...STRIPE_PLANS,
  PRO: STRIPE_PLANS.PREMIUM, // Alias for now
} as const;

export type PlanId = 'free' | 'premium';
export type Plan = (typeof STRIPE_PLANS)[keyof typeof STRIPE_PLANS];

// Helper to get plan by Stripe price ID
export function getPlanByPriceId(priceId: string): Plan | null {
  if (
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdMonthly ||
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdYearly
  ) {
    return STRIPE_PLANS.PREMIUM;
  }
  return null;
}

// Helper to get tier from price ID
export function getTierFromPriceId(priceId: string): 'free' | 'premium' {
  if (
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdMonthly ||
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdYearly
  ) {
    return 'premium';
  }
  return 'free';
}

// Helper to check if a price ID is valid
export function isValidPriceId(priceId: string): boolean {
  return (
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdMonthly ||
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdYearly
  );
}
