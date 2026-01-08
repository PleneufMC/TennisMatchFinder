'use client';

import Script from 'next/script';
import { useEffect } from 'react';
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

  return {
    trackEvent,
    trackMatchProposal,
    trackMatchResult,
    trackBadgeEarned,
    trackSubscription,
    trackSignup,
    trackClubJoin,
    trackTournamentRegister,
  };
}

// Import manquant
import { useState } from 'react';
