/**
 * Analytics Library - TennisMatchFinder
 * 
 * Centralized analytics tracking for GA4 events.
 * Used for conversion tracking, funnel analysis, and user behavior monitoring.
 * 
 * Sprint Février 2026 - Focus: Activation & Conversion
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SignupStepName = 
  | 'email_entered'
  | 'club_selected'
  | 'profile_started'
  | 'level_selected'
  | 'preferences_set'
  | 'completed';

export type SignupStepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface SignupStepParams {
  step_number: SignupStepNumber;
  step_name: SignupStepName;
  club_id?: string;
  time_spent_seconds?: number;
}

export interface SignupFieldErrorParams {
  field_name: string;
  error_type: string;
  step_number?: number;
}

export interface SignupAbandonedParams {
  last_step: SignupStepNumber;
  last_step_name: SignupStepName;
  time_spent_seconds: number;
  fields_completed?: string[];
}

export interface FirstMatchRegisteredParams {
  days_since_signup: number;
  opponent_type: 'suggested' | 'manual' | 'search';
  match_format: string;
  is_winner: boolean;
}

export interface MatchRegisteredParams {
  match_id: string;
  opponent_elo_diff: number;
  match_format: string;
  is_new_opponent: boolean;
  has_suggestion: boolean;
}

export interface OnboardingStepParams {
  step_name: string;
  step_number: number;
  action: 'view' | 'complete' | 'skip';
  time_spent_seconds?: number;
}

export interface ActivationEventParams {
  action: string;
  days_since_signup: number;
  player_elo: number;
  matches_played: number;
}

// ============================================
// CORE TRACKING FUNCTION
// ============================================

/**
 * Core tracking function - sends event to GA4
 * Safe to call on server or client (checks for window.gtag)
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      ...params,
      timestamp: new Date().toISOString(),
    });
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GA4] ${eventName}`, params);
    }
  }
}

// ============================================
// SIGNUP FUNNEL TRACKING
// ============================================

/**
 * Track signup step progression with granularity
 * 
 * Steps:
 * 1. email_entered - Email saisi
 * 2. club_selected - Club choisi
 * 3. profile_started - Début profil (nom, prénom)
 * 4. level_selected - Niveau tennis choisi
 * 5. preferences_set - Disponibilités renseignées
 * 6. completed - Inscription terminée
 */
export function trackSignupStep(
  stepNumber: SignupStepNumber,
  stepName: SignupStepName,
  clubId?: string
): void {
  trackEvent('signup_step', {
    step_number: stepNumber,
    step_name: stepName,
    club_id: clubId || 'unknown',
    event_category: 'conversion_funnel',
  });
}

/**
 * Track field-level validation errors during signup
 * Helps identify friction points in the registration form
 */
export function trackSignupFieldError(
  fieldName: string,
  errorType: string,
  stepNumber?: number
): void {
  trackEvent('signup_field_error', {
    field_name: fieldName,
    error_type: errorType,
    step_number: stepNumber,
    event_category: 'conversion_funnel',
  });
}

/**
 * Track signup abandonment with context
 * Called when user leaves without completing registration
 */
export function trackSignupAbandoned(
  lastStep: SignupStepNumber,
  lastStepName: SignupStepName,
  timeSpentSeconds: number,
  fieldsCompleted?: string[]
): void {
  trackEvent('signup_abandoned', {
    last_step: lastStep,
    last_step_name: lastStepName,
    time_spent_seconds: timeSpentSeconds,
    fields_completed: fieldsCompleted?.join(','),
    event_category: 'conversion_funnel',
  });
}

/**
 * Track successful signup completion
 */
export function trackSignupCompleted(
  clubId: string,
  method: 'magic_link' | 'oauth_google' | 'oauth_apple' = 'magic_link',
  referrerId?: string
): void {
  trackEvent('signup_completed', {
    club_id: clubId,
    method,
    referrer_id: referrerId,
    event_category: 'conversion',
    value: 10, // Conversion value for Google Ads
  });
}

// ============================================
// ACTIVATION TRACKING
// ============================================

/**
 * Track first match registered - KEY ACTIVATION METRIC
 * This is the primary activation event we want to optimize
 */
export function trackFirstMatchRegistered(
  daysSinceSignup: number,
  opponentType: 'suggested' | 'manual' | 'search',
  matchFormat: string,
  isWinner: boolean
): void {
  trackEvent('first_match_registered', {
    days_since_signup: daysSinceSignup,
    opponent_type: opponentType,
    match_format: matchFormat,
    is_winner: isWinner,
    event_category: 'activation',
    value: 20, // High value for activation milestone
  });
}

/**
 * Track any match registration
 */
export function trackMatchRegistered(
  matchId: string,
  opponentEloDiff: number,
  matchFormat: string,
  isNewOpponent: boolean,
  hasSuggestion: boolean
): void {
  trackEvent('match_registered', {
    match_id: matchId,
    opponent_elo_diff: opponentEloDiff,
    match_format: matchFormat,
    is_new_opponent: isNewOpponent,
    has_suggestion: hasSuggestion,
    event_category: 'engagement',
  });
}

/**
 * Track match validation by opponent
 */
export function trackMatchValidated(
  matchId: string,
  validationType: 'manual' | 'auto'
): void {
  trackEvent('match_validated', {
    match_id: matchId,
    validation_type: validationType,
    event_category: 'engagement',
  });
}

// ============================================
// ONBOARDING TRACKING
// ============================================

/**
 * Track onboarding checklist step
 */
export function trackOnboardingStep(
  stepName: string,
  stepNumber: number,
  action: 'view' | 'complete' | 'skip',
  timeSpentSeconds?: number
): void {
  trackEvent('onboarding_step', {
    step_name: stepName,
    step_number: stepNumber,
    action,
    time_spent_seconds: timeSpentSeconds,
    event_category: 'activation_funnel',
  });
}

/**
 * Track onboarding completion
 */
export function trackOnboardingCompleted(
  totalTimeSeconds: number,
  skippedSteps: string[]
): void {
  trackEvent('onboarding_completed', {
    total_time_seconds: totalTimeSeconds,
    skipped_steps: skippedSteps.join(','),
    skipped_count: skippedSteps.length,
    event_category: 'activation_funnel',
    value: 5,
  });
}

// ============================================
// FEATURE USAGE TRACKING
// ============================================

/**
 * Track Match Now feature usage
 */
export function trackMatchNowActivated(
  durationMinutes: number,
  searchMode: 'club' | 'proximity'
): void {
  trackEvent('match_now_activated', {
    duration_minutes: durationMinutes,
    search_mode: searchMode,
    event_category: 'engagement',
  });
}

/**
 * Track suggestion interaction
 */
export function trackSuggestionViewed(
  suggestedPlayerId: string,
  rank: number,
  eloDiff: number
): void {
  trackEvent('suggestion_viewed', {
    suggested_player_id: suggestedPlayerId,
    rank,
    elo_diff: eloDiff,
    event_category: 'engagement',
  });
}

/**
 * Track suggestion action (propose match, view profile)
 */
export function trackSuggestionAction(
  suggestedPlayerId: string,
  action: 'propose_match' | 'view_profile' | 'dismiss'
): void {
  trackEvent('suggestion_action', {
    suggested_player_id: suggestedPlayerId,
    action,
    event_category: 'engagement',
  });
}

// ============================================
// EMAIL & NOTIFICATION TRACKING
// ============================================

/**
 * Track email open (via pixel or link click)
 */
export function trackEmailOpened(
  emailType: string,
  emailId?: string
): void {
  trackEvent('email_opened', {
    email_type: emailType,
    email_id: emailId,
    event_category: 'email',
  });
}

/**
 * Track email CTA click
 */
export function trackEmailCtaClicked(
  emailType: string,
  ctaName: string,
  emailId?: string
): void {
  trackEvent('email_cta_clicked', {
    email_type: emailType,
    cta_name: ctaName,
    email_id: emailId,
    event_category: 'email',
  });
}

/**
 * Track push notification interaction
 */
export function trackPushNotificationAction(
  notificationType: string,
  action: 'received' | 'clicked' | 'dismissed'
): void {
  trackEvent('push_notification_action', {
    notification_type: notificationType,
    action,
    event_category: 'push',
  });
}

// ============================================
// RETENTION TRACKING
// ============================================

/**
 * Track user return to app
 */
export function trackUserReturn(
  daysSinceLastVisit: number,
  entryPage: string
): void {
  trackEvent('user_return', {
    days_since_last_visit: daysSinceLastVisit,
    entry_page: entryPage,
    event_category: 'retention',
  });
}

/**
 * Track weekly challenge completion
 */
export function trackWeeklyChallengeCompleted(
  challengeType: string,
  streakCount: number
): void {
  trackEvent('weekly_challenge_completed', {
    challenge_type: challengeType,
    streak_count: streakCount,
    event_category: 'retention',
    value: streakCount, // Higher streak = higher value
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate days since a date
 */
export function daysSince(date: Date | string): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - targetDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get signup step name from number
 */
export function getSignupStepName(stepNumber: SignupStepNumber): SignupStepName {
  const stepMap: Record<SignupStepNumber, SignupStepName> = {
    1: 'email_entered',
    2: 'club_selected',
    3: 'profile_started',
    4: 'level_selected',
    5: 'preferences_set',
    6: 'completed',
  };
  return stepMap[stepNumber];
}

// ============================================
// SERVER-SIDE TRACKING (for CRON jobs, etc.)
// ============================================

/**
 * Server-side event tracking via Measurement Protocol
 * Used for CRON jobs and background processes
 * 
 * Note: Requires MEASUREMENT_ID and API_SECRET env vars
 */
export async function trackServerEvent(
  eventName: string,
  params: Record<string, unknown>,
  clientId: string
): Promise<boolean> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn('[Analytics] GA4 Measurement Protocol not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          events: [
            {
              name: eventName,
              params: {
                ...params,
                engagement_time_msec: 1,
              },
            },
          ],
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[Analytics] Server event tracking failed:', error);
    return false;
  }
}

// Note: All interfaces are already exported with 'export interface' above
// They can be imported directly:
// import type { SignupStepParams, FirstMatchRegisteredParams, ... } from '@/lib/analytics';
