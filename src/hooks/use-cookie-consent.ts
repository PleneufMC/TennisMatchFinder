'use client';

import { useState, useEffect, useCallback } from 'react';

export type CookieConsentStatus = 'pending' | 'accepted' | 'rejected' | 'customized';

export interface CookiePreferences {
  essential: boolean; // Toujours true, non modifiable
  functional: boolean;
  analytics: boolean;
}

const CONSENT_COOKIE_NAME = 'tmf_cookie_consent';
const CONSENT_EXPIRY_DAYS = 365;

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
};

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i] ?? '';
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export function useCookieConsent() {
  const [status, setStatus] = useState<CookieConsentStatus>('pending');
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le consentement au montage
  useEffect(() => {
    const stored = getCookie(CONSENT_COOKIE_NAME);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStatus(parsed.status || 'pending');
        setPreferences({
          essential: true, // Toujours true
          functional: parsed.preferences?.functional ?? false,
          analytics: parsed.preferences?.analytics ?? false,
        });
      } catch {
        // Cookie corrompu, réinitialiser
        deleteCookie(CONSENT_COOKIE_NAME);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder les préférences
  const saveConsent = useCallback((newStatus: CookieConsentStatus, newPreferences: CookiePreferences) => {
    const value = JSON.stringify({
      status: newStatus,
      preferences: newPreferences,
      timestamp: new Date().toISOString(),
    });
    setCookie(CONSENT_COOKIE_NAME, value, CONSENT_EXPIRY_DAYS);
    setStatus(newStatus);
    setPreferences(newPreferences);
  }, []);

  // Accepter tous les cookies
  const acceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
    };
    saveConsent('accepted', allAccepted);
  }, [saveConsent]);

  // Refuser les cookies non-essentiels
  const rejectNonEssential = useCallback(() => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
    };
    saveConsent('rejected', essentialOnly);
  }, [saveConsent]);

  // Sauvegarder les préférences personnalisées
  const saveCustomPreferences = useCallback((customPrefs: Partial<CookiePreferences>) => {
    const newPreferences: CookiePreferences = {
      essential: true, // Toujours true
      functional: customPrefs.functional ?? preferences.functional,
      analytics: customPrefs.analytics ?? preferences.analytics,
    };
    saveConsent('customized', newPreferences);
  }, [preferences, saveConsent]);

  // Réinitialiser le consentement (pour les paramètres)
  const resetConsent = useCallback(() => {
    deleteCookie(CONSENT_COOKIE_NAME);
    setStatus('pending');
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  // Vérifier si une catégorie est autorisée
  const hasConsent = useCallback((category: keyof CookiePreferences): boolean => {
    if (category === 'essential') return true;
    return preferences[category];
  }, [preferences]);

  return {
    status,
    preferences,
    isLoaded,
    showBanner: isLoaded && status === 'pending',
    acceptAll,
    rejectNonEssential,
    saveCustomPreferences,
    resetConsent,
    hasConsent,
  };
}
