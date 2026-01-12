'use client';

import Script from 'next/script';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Typage global pour fbq (Facebook Pixel)
declare global {
  interface Window {
    fbq: {
      (command: 'init', pixelId: string): void;
      (command: 'track', eventName: string, params?: Record<string, unknown>): void;
      (command: 'trackCustom', eventName: string, params?: Record<string, unknown>): void;
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[];
      push: (...args: unknown[]) => void;
      loaded: boolean;
      version: string;
    };
    _fbq: Window['fbq'];
  }
}

interface MetaPixelProps {
  pixelId: string;
  consent?: boolean;
}

/**
 * Composant Meta Pixel (Facebook Pixel)
 * Charge le script et initialise le pixel avec gestion du consentement
 */
export function MetaPixel({ pixelId, consent = false }: MetaPixelProps) {
  const pathname = usePathname();

  // Tracker les changements de page
  useEffect(() => {
    if (!consent || !pixelId) return;

    // Envoyer le pageview à chaque changement de route
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, pixelId, consent]);

  // Ne rien afficher si pas de consentement ou pas d'ID
  if (!consent || !pixelId) {
    return null;
  }

  return (
    <>
      {/* Script Meta Pixel */}
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Noscript fallback pour les navigateurs sans JS */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

/**
 * Composant wrapper qui gère le consentement cookies
 * Utilise le même cookie que GA4 (tmf_cookie_consent)
 */
export function MetaPixelWithConsent({ pixelId }: { pixelId: string }) {
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const consentCookie = document.cookie
        .split(';')
        .find((c) => c.trim().startsWith('tmf_cookie_consent='));

      if (consentCookie) {
        try {
          const value = decodeURIComponent(consentCookie.split('=')[1] || '');
          const parsed = JSON.parse(value);
          // Utilise la même préférence "analytics" que GA4
          setHasAnalyticsConsent(parsed.preferences?.analytics === true);
        } catch {
          setHasAnalyticsConsent(false);
        }
      }
    };

    checkConsent();

    // Écouter les changements
    const handleStorageChange = () => checkConsent();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkConsent, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return <MetaPixel pixelId={pixelId} consent={hasAnalyticsConsent} />;
}

/**
 * Hook pour tracker des événements Meta Pixel
 * 
 * Événements standards Meta :
 * - PageView (automatique)
 * - ViewContent
 * - Lead
 * - CompleteRegistration
 * - InitiateCheckout
 * - Purchase
 * - Search
 * - AddToCart
 * - AddToWishlist
 * - Contact
 * - CustomizeProduct
 * - Donate
 * - FindLocation
 * - Schedule
 * - StartTrial
 * - SubmitApplication
 * - Subscribe
 */
export function useMetaPixel() {
  /**
   * Track un événement standard Meta
   */
  const trackEvent = useCallback((
    eventName: string,
    params?: Record<string, unknown>
  ) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, params);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Meta Pixel] track: ${eventName}`, params);
      }
    }
  }, []);

  /**
   * Track un événement personnalisé
   */
  const trackCustomEvent = useCallback((
    eventName: string,
    params?: Record<string, unknown>
  ) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, params);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Meta Pixel] trackCustom: ${eventName}`, params);
      }
    }
  }, []);

  // ===== ÉVÉNEMENTS STANDARDS POUR TENNISMATCHFINDER =====

  /**
   * Quand un utilisateur voit du contenu (landing page, page pricing)
   */
  const trackViewContent = useCallback((contentName: string, contentCategory?: string) => {
    trackEvent('ViewContent', {
      content_name: contentName,
      content_category: contentCategory || 'page',
    });
  }, [trackEvent]);

  /**
   * Quand un utilisateur commence l'inscription (clic sur CTA)
   */
  const trackLead = useCallback((source: string) => {
    trackEvent('Lead', {
      content_name: 'signup_started',
      content_category: source,
    });
  }, [trackEvent]);

  /**
   * Quand un utilisateur termine l'inscription
   */
  const trackCompleteRegistration = useCallback((clubSlug: string, method: string = 'magic_link') => {
    trackEvent('CompleteRegistration', {
      content_name: clubSlug,
      status: 'completed',
      registration_method: method,
      currency: 'EUR',
      value: 10, // Valeur estimée d'un lead
    });
  }, [trackEvent]);

  /**
   * Quand un utilisateur visite la page pricing
   */
  const trackInitiateCheckout = useCallback((tier?: string) => {
    trackEvent('InitiateCheckout', {
      content_name: 'pricing_page',
      content_category: tier || 'all_tiers',
    });
  }, [trackEvent]);

  /**
   * Quand un utilisateur s'abonne (paiement réussi)
   */
  const trackPurchase = useCallback((tier: string, value: number) => {
    trackEvent('Purchase', {
      content_name: `subscription_${tier}`,
      content_category: 'subscription',
      currency: 'EUR',
      value: value,
    });
  }, [trackEvent]);

  /**
   * Quand un utilisateur lance un essai gratuit
   */
  const trackStartTrial = useCallback((tier: string) => {
    trackEvent('StartTrial', {
      content_name: `trial_${tier}`,
      content_category: 'subscription',
      currency: 'EUR',
      value: 0,
    });
  }, [trackEvent]);

  /**
   * Quand un utilisateur recherche un adversaire
   */
  const trackSearch = useCallback((searchType: 'match_now' | 'suggestions' | 'classement') => {
    trackEvent('Search', {
      content_category: searchType,
      search_string: searchType,
    });
  }, [trackEvent]);

  // ===== ÉVÉNEMENTS PERSONNALISÉS POUR TENNISMATCHFINDER =====

  /**
   * Premier match créé (activation)
   */
  const trackFirstMatch = useCallback((eloGained: number) => {
    trackCustomEvent('FirstMatchCreated', {
      elo_gained: eloGained,
      currency: 'EUR',
      value: 5,
    });
  }, [trackCustomEvent]);

  /**
   * Badge débloqué
   */
  const trackBadgeEarned = useCallback((badgeId: string, badgeName: string) => {
    trackCustomEvent('BadgeEarned', {
      badge_id: badgeId,
      badge_name: badgeName,
    });
  }, [trackCustomEvent]);

  /**
   * Inscription à un tournoi
   */
  const trackTournamentRegistration = useCallback((tournamentId: string, tournamentName: string) => {
    trackCustomEvent('TournamentRegistration', {
      tournament_id: tournamentId,
      tournament_name: tournamentName,
    });
  }, [trackCustomEvent]);

  /**
   * Match Now activé
   */
  const trackMatchNowActivated = useCallback(() => {
    trackCustomEvent('MatchNowActivated', {
      availability: 'active',
    });
  }, [trackCustomEvent]);

  return {
    // Fonctions génériques
    trackEvent,
    trackCustomEvent,
    // Événements standards
    trackViewContent,
    trackLead,
    trackCompleteRegistration,
    trackInitiateCheckout,
    trackPurchase,
    trackStartTrial,
    trackSearch,
    // Événements personnalisés TMF
    trackFirstMatch,
    trackBadgeEarned,
    trackTournamentRegistration,
    trackMatchNowActivated,
  };
}
