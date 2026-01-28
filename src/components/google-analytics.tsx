'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Typage global pour gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set' | 'consent',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
  consent?: boolean;
}

export function GoogleAnalytics({ measurementId, consent = false }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Tracker les changements de page
  useEffect(() => {
    if (!consent || !measurementId) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Envoyer le pageview
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', measurementId, {
        page_path: url,
        page_title: document.title,
      });
    }
  }, [pathname, searchParams, measurementId, consent]);

  // Ne rien afficher si pas de consentement ou pas d'ID
  if (!consent || !measurementId) {
    return null;
  }

  return (
    <>
      {/* Script Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              'analytics_storage': 'granted'
            });
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  );
}

// Composant wrapper qui gère le consentement
export function GoogleAnalyticsWithConsent({ measurementId }: { measurementId: string }) {
  // Lire le consentement depuis le cookie
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);

  useEffect(() => {
    // Fonction pour vérifier le consentement
    const checkConsent = () => {
      const consentCookie = document.cookie
        .split(';')
        .find((c) => c.trim().startsWith('tmf_cookie_consent='));
      
      if (consentCookie) {
        try {
          const value = decodeURIComponent(consentCookie.split('=')[1] || '');
          const parsed = JSON.parse(value);
          setHasAnalyticsConsent(parsed.preferences?.analytics === true);
        } catch {
          setHasAnalyticsConsent(false);
        }
      }
    };

    // Vérifier immédiatement
    checkConsent();

    // Écouter les changements de consentement
    const handleStorageChange = () => checkConsent();
    window.addEventListener('storage', handleStorageChange);
    
    // Intervalle pour détecter les changements de cookie
    const interval = setInterval(checkConsent, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return <GoogleAnalytics measurementId={measurementId} consent={hasAnalyticsConsent} />;
}

// Hook pour tracker des événements personnalisés
export function useGoogleAnalytics() {
  const trackEvent = (
    eventName: string,
    eventParams?: Record<string, unknown>
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams);
    }
  };

  // Événements prédéfinis pour TennisMatchFinder
  const trackMatchProposal = (matchId: string, opponentElo: number) => {
    trackEvent('match_proposal', {
      match_id: matchId,
      opponent_elo: opponentElo,
      event_category: 'engagement',
    });
  };

  const trackMatchResult = (matchId: string, result: 'win' | 'loss', eloDelta: number) => {
    trackEvent('match_result', {
      match_id: matchId,
      result,
      elo_delta: eloDelta,
      event_category: 'gameplay',
    });
  };

  const trackBadgeEarned = (badgeId: string, badgeName: string) => {
    trackEvent('badge_earned', {
      badge_id: badgeId,
      badge_name: badgeName,
      event_category: 'achievement',
    });
  };

  const trackSubscription = (tier: string, action: 'start' | 'upgrade' | 'cancel') => {
    trackEvent('subscription', {
      tier,
      action,
      event_category: 'monetization',
    });
  };

  const trackSignup = (method: 'email' | 'magic_link') => {
    trackEvent('sign_up', {
      method,
      event_category: 'acquisition',
    });
  };

  const trackClubJoin = (clubId: string) => {
    trackEvent('club_join', {
      club_id: clubId,
      event_category: 'engagement',
    });
  };

  const trackTournamentRegister = (tournamentId: string, format: string) => {
    trackEvent('tournament_register', {
      tournament_id: tournamentId,
      format,
      event_category: 'competition',
    });
  };

  // ===== ÉVÉNEMENTS DE CONVERSION MARKETING =====
  // Pour les campagnes d'acquisition (Google Ads, Meta Ads)
  
  const trackSignupStarted = (source: 'landing_hero' | 'landing_cta' | 'pricing_page' | 'navbar' | 'footer' | 'register_form' | 'join_club') => {
    trackEvent('signup_started', {
      event_category: 'conversion',
      event_label: source,
      value: 1,
    });
  };

  const trackSignupCompleted = (clubSlug: string, method: 'email' | 'magic_link' = 'magic_link') => {
    trackEvent('signup_completed', {
      event_category: 'conversion',
      event_label: clubSlug,
      method,
      value: 10, // Valeur de conversion pour Google Ads
    });
  };

  const trackFirstMatchCreated = (eloGained: number) => {
    trackEvent('first_match_created', {
      event_category: 'activation',
      event_label: 'match_recorded',
      elo_gained: eloGained,
      value: 5,
    });
  };

  const trackMatchNowActivated = () => {
    trackEvent('match_now_activated', {
      event_category: 'engagement',
      event_label: 'availability_set',
    });
  };

  const trackEloViewed = (playerElo: number) => {
    trackEvent('elo_viewed', {
      event_category: 'engagement',
      event_label: 'ranking_consulted',
      player_elo: playerElo,
    });
  };

  const trackLandingPageView = (variant?: string, utmSource?: string, utmMedium?: string, utmCampaign?: string) => {
    trackEvent('landing_page_view', {
      event_category: 'acquisition',
      page_variant: variant || 'default',
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });
  };

  const trackCtaClicked = (ctaName: string, ctaLocation: string) => {
    trackEvent('cta_clicked', {
      event_category: 'engagement',
      cta_name: ctaName,
      cta_location: ctaLocation,
    });
  };

  const trackPricingViewed = (tier?: string) => {
    trackEvent('pricing_viewed', {
      event_category: 'monetization',
      tier_viewed: tier || 'all',
    });
  };

  // ===== ÉVÉNEMENTS FUNNEL INSCRIPTION (Step-by-step tracking) =====
  // Pour identifier précisément où les users abandonnent
  
  type SignupStepName = 'fullname' | 'email' | 'city' | 'level' | 'club_option' | 'submit_attempt';
  
  const trackSignupStep = (
    step: SignupStepName,
    stepNumber: number,
    metadata?: Record<string, unknown>
  ) => {
    trackEvent('signup_step', {
      event_category: 'conversion_funnel',
      step_name: step,
      step_number: stepNumber,
      ...metadata,
    });
    // Log en dev pour debug
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GA4] signup_step: ${step} (step ${stepNumber})`, metadata);
    }
  };

  const trackSignupFieldFocus = (fieldName: string) => {
    trackEvent('signup_field_focus', {
      event_category: 'conversion_funnel',
      field_name: fieldName,
    });
  };

  const trackSignupFieldComplete = (fieldName: string, isValid: boolean) => {
    trackEvent('signup_field_complete', {
      event_category: 'conversion_funnel',
      field_name: fieldName,
      is_valid: isValid,
    });
  };

  const trackSignupError = (fieldName: string, errorMessage: string) => {
    trackEvent('signup_error', {
      event_category: 'conversion_funnel',
      field_name: fieldName,
      error_message: errorMessage,
    });
  };

  const trackSignupAbandonment = (
    lastStepCompleted: SignupStepName,
    timeSpentSeconds: number
  ) => {
    trackEvent('signup_abandonment', {
      event_category: 'conversion_funnel',
      last_step: lastStepCompleted,
      time_spent_seconds: timeSpentSeconds,
    });
  };

  // ===== ÉVÉNEMENTS ONBOARDING (Post-inscription) =====
  
  type OnboardingStepName = 'welcome' | 'profile' | 'level' | 'availability' | 'first_match';
  
  const trackOnboardingStep = (
    step: OnboardingStepName,
    stepNumber: number,
    action: 'view' | 'complete' | 'skip'
  ) => {
    trackEvent('onboarding_step', {
      event_category: 'activation_funnel',
      step_name: step,
      step_number: stepNumber,
      action,
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GA4] onboarding_step: ${step} (${action})`);
    }
  };

  const trackOnboardingCompleted = (totalTimeSeconds: number, skippedSteps: string[]) => {
    trackEvent('onboarding_completed', {
      event_category: 'activation_funnel',
      total_time_seconds: totalTimeSeconds,
      skipped_steps: skippedSteps.join(','),
      value: 5,
    });
  };

  return {
    trackEvent,
    // Événements produit existants
    trackMatchProposal,
    trackMatchResult,
    trackBadgeEarned,
    trackSubscription,
    trackSignup,
    trackClubJoin,
    trackTournamentRegister,
    // Nouveaux événements de conversion marketing
    trackSignupStarted,
    trackSignupCompleted,
    trackFirstMatchCreated,
    trackMatchNowActivated,
    trackEloViewed,
    trackLandingPageView,
    trackCtaClicked,
    trackPricingViewed,
    // Funnel inscription step-by-step
    trackSignupStep,
    trackSignupFieldFocus,
    trackSignupFieldComplete,
    trackSignupError,
    trackSignupAbandonment,
    // Funnel onboarding
    trackOnboardingStep,
    trackOnboardingCompleted,
  };
}
