export { stripe, STRIPE_PLANS, getPlanByPriceId, getTierFromPriceId } from './config';
export type { PlanId, Plan } from './config';

export { getStripe } from './client';

export {
  getOrCreateStripeCustomer,
  getUserSubscription,
  getUserTier,
  hasPremiumAccess,
  hasProAccess,
  createCheckoutSession,
  createPortalSession,
  handleSubscriptionChange,
  handleSubscriptionDeleted,
  recordPayment,
  getPlanLimits,
  canUseFeature,
} from './subscription';

export {
  PREMIUM_FEATURES,
  tierHasAccess,
  userHasAccess,
  getRemainingWeeklySuggestions,
  getUpgradePrompt,
  paywallResponse,
} from './paywall';
export type { PremiumFeature } from './paywall';
