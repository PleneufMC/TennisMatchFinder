import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Pricing configuration
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
      dataExport: false,
    },
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    description: 'Pour les joueurs réguliers',
    price: 99,
    yearlyPrice: 99,
    monthlyPrice: 9.99,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    features: [
      'Suggestions illimitées',
      'Statistiques avancées',
      'Forum (lecture & écriture)',
      'Chat illimité',
      'Filtres avancés classement',
      'Badge "Membre Premium"',
      'Explication ELO détaillée',
    ],
    limits: {
      suggestionsPerWeek: -1, // unlimited
      forumWrite: true,
      chatUnlimited: true,
      advancedStats: true,
      tournaments: false,
      dataExport: true,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    description: 'L\'expérience complète',
    price: 149,
    yearlyPrice: 149,
    monthlyPrice: 14.99,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    features: [
      'Tout Premium +',
      'Tournois & Box Leagues',
      'Analytics premium',
      'Historique complet',
      'Badge "Membre Pro"',
      'Support prioritaire',
      'Accès anticipé aux nouvelles fonctionnalités',
    ],
    limits: {
      suggestionsPerWeek: -1,
      forumWrite: true,
      chatUnlimited: true,
      advancedStats: true,
      tournaments: true,
      dataExport: true,
    },
  },
} as const;

export type PlanId = keyof typeof STRIPE_PLANS;
export type Plan = (typeof STRIPE_PLANS)[PlanId];

// Helper to get plan by Stripe price ID
export function getPlanByPriceId(priceId: string): Plan | null {
  if (
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdMonthly ||
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdYearly
  ) {
    return STRIPE_PLANS.PREMIUM;
  }
  if (
    priceId === STRIPE_PLANS.PRO.stripePriceIdMonthly ||
    priceId === STRIPE_PLANS.PRO.stripePriceIdYearly
  ) {
    return STRIPE_PLANS.PRO;
  }
  return null;
}

// Helper to get tier from price ID
export function getTierFromPriceId(priceId: string): 'free' | 'premium' | 'pro' {
  if (
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdMonthly ||
    priceId === STRIPE_PLANS.PREMIUM.stripePriceIdYearly
  ) {
    return 'premium';
  }
  if (
    priceId === STRIPE_PLANS.PRO.stripePriceIdMonthly ||
    priceId === STRIPE_PLANS.PRO.stripePriceIdYearly
  ) {
    return 'pro';
  }
  return 'free';
}
