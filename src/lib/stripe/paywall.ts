import { getUserTier, getPlanLimits } from './subscription';
import type { SubscriptionTier } from '@/lib/db/schema';

// Features that require premium access
export const PREMIUM_FEATURES = {
  // Suggestions
  UNLIMITED_SUGGESTIONS: 'unlimited_suggestions',
  
  // Forum
  FORUM_WRITE: 'forum_write',
  FORUM_CREATE_THREAD: 'forum_create_thread',
  
  // Chat
  CHAT_UNLIMITED: 'chat_unlimited',
  
  // Stats
  ADVANCED_STATS: 'advanced_stats',
  ELO_EXPLANATION: 'elo_explanation',
  
  // Classement
  RANKING_FILTERS: 'ranking_filters',
  
  // Export
  DATA_EXPORT: 'data_export',
  
  // Pro only
  TOURNAMENTS: 'tournaments',
  BOX_LEAGUES: 'box_leagues',
  PREMIUM_ANALYTICS: 'premium_analytics',
} as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[keyof typeof PREMIUM_FEATURES];

// Feature requirements mapping
const FEATURE_REQUIREMENTS: Record<PremiumFeature, SubscriptionTier[]> = {
  [PREMIUM_FEATURES.UNLIMITED_SUGGESTIONS]: ['premium', 'pro'],
  [PREMIUM_FEATURES.FORUM_WRITE]: ['premium', 'pro'],
  [PREMIUM_FEATURES.FORUM_CREATE_THREAD]: ['premium', 'pro'],
  [PREMIUM_FEATURES.CHAT_UNLIMITED]: ['premium', 'pro'],
  [PREMIUM_FEATURES.ADVANCED_STATS]: ['premium', 'pro'],
  [PREMIUM_FEATURES.ELO_EXPLANATION]: ['premium', 'pro'],
  [PREMIUM_FEATURES.RANKING_FILTERS]: ['premium', 'pro'],
  [PREMIUM_FEATURES.DATA_EXPORT]: ['premium', 'pro'],
  [PREMIUM_FEATURES.TOURNAMENTS]: ['pro'],
  [PREMIUM_FEATURES.BOX_LEAGUES]: ['pro'],
  [PREMIUM_FEATURES.PREMIUM_ANALYTICS]: ['pro'],
};

// Check if a tier has access to a feature
export function tierHasAccess(tier: SubscriptionTier, feature: PremiumFeature): boolean {
  const requiredTiers = FEATURE_REQUIREMENTS[feature];
  return requiredTiers.includes(tier);
}

// Check if user has access to a feature
export async function userHasAccess(userId: string, feature: PremiumFeature): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tierHasAccess(tier, feature);
}

// Get remaining suggestions for user this week
export async function getRemainingWeeklySuggestions(
  userId: string,
  usedThisWeek: number
): Promise<{ remaining: number; unlimited: boolean }> {
  const tier = await getUserTier(userId);
  const limits = getPlanLimits(tier);
  
  if (limits.suggestionsPerWeek === -1) {
    return { remaining: -1, unlimited: true };
  }
  
  const remaining = Math.max(0, limits.suggestionsPerWeek - usedThisWeek);
  return { remaining, unlimited: false };
}

// Get upgrade prompt message for a feature
export function getUpgradePrompt(feature: PremiumFeature): {
  title: string;
  message: string;
  requiredTier: 'premium' | 'pro';
} {
  const requiredTiers = FEATURE_REQUIREMENTS[feature];
  const requiredTier = requiredTiers.includes('premium') ? 'premium' : 'pro';
  
  const prompts: Record<PremiumFeature, { title: string; message: string }> = {
    [PREMIUM_FEATURES.UNLIMITED_SUGGESTIONS]: {
      title: 'Suggestions illimitées',
      message: 'Passez à Premium pour obtenir des suggestions illimitées et trouver plus facilement des adversaires.',
    },
    [PREMIUM_FEATURES.FORUM_WRITE]: {
      title: 'Participez aux discussions',
      message: 'Passez à Premium pour publier et répondre sur le forum du club.',
    },
    [PREMIUM_FEATURES.FORUM_CREATE_THREAD]: {
      title: 'Créer un sujet',
      message: 'Passez à Premium pour créer de nouveaux sujets de discussion.',
    },
    [PREMIUM_FEATURES.CHAT_UNLIMITED]: {
      title: 'Chat illimité',
      message: 'Passez à Premium pour un accès complet au chat.',
    },
    [PREMIUM_FEATURES.ADVANCED_STATS]: {
      title: 'Statistiques avancées',
      message: 'Passez à Premium pour accéder à des analyses détaillées de vos performances.',
    },
    [PREMIUM_FEATURES.ELO_EXPLANATION]: {
      title: 'Explication ELO',
      message: 'Passez à Premium pour comprendre en détail chaque variation de votre ELO.',
    },
    [PREMIUM_FEATURES.RANKING_FILTERS]: {
      title: 'Filtres avancés',
      message: 'Passez à Premium pour filtrer le classement par période et critères.',
    },
    [PREMIUM_FEATURES.DATA_EXPORT]: {
      title: 'Export de données',
      message: 'Passez à Premium pour exporter vos statistiques et historique.',
    },
    [PREMIUM_FEATURES.TOURNAMENTS]: {
      title: 'Tournois',
      message: 'Passez à Pro pour participer aux tournois et compétitions.',
    },
    [PREMIUM_FEATURES.BOX_LEAGUES]: {
      title: 'Box Leagues',
      message: 'Passez à Pro pour participer aux Box Leagues mensuelles.',
    },
    [PREMIUM_FEATURES.PREMIUM_ANALYTICS]: {
      title: 'Analytics Premium',
      message: 'Passez à Pro pour accéder aux analyses les plus avancées.',
    },
  };
  
  return {
    ...prompts[feature],
    requiredTier,
  };
}

// Paywall error response for API routes
export function paywallResponse(feature: PremiumFeature) {
  const prompt = getUpgradePrompt(feature);
  return {
    error: 'premium_required',
    feature,
    title: prompt.title,
    message: prompt.message,
    requiredTier: prompt.requiredTier,
    upgradeUrl: '/pricing',
  };
}
