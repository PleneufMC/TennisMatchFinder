/**
 * Hook pour sauvegarder les tentatives d'inscription progressivement
 * Capture l'email et les données dès qu'ils sont saisis pour permettre
 * la relance des utilisateurs qui abandonnent le formulaire.
 */

'use client';

import { useRef, useCallback, useEffect } from 'react';

type SignupStepName = 'fullname' | 'email' | 'city' | 'level' | 'club_option' | 'submit';

interface SignupAttemptData {
  email?: string;
  fullName?: string;
  city?: string;
  selfAssessedLevel?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  wantsToJoinClub?: boolean;
  clubSlug?: string;
}

interface UseSignupAttemptOptions {
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// Générer un ID de session unique pour regrouper les tentatives
function generateSessionId(): string {
  return `signup_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Récupérer ou créer le session ID depuis sessionStorage
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  
  const storageKey = 'tmf_signup_session';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

export function useSignupAttempt(options: UseSignupAttemptOptions = {}) {
  const sessionIdRef = useRef<string>('');
  const startTimeRef = useRef<number>(Date.now());
  const lastSentStepRef = useRef<number>(0);
  const pendingRequestRef = useRef<AbortController | null>(null);

  // Initialiser le session ID côté client
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    startTimeRef.current = Date.now();
  }, []);

  /**
   * Envoyer les données au serveur de manière non bloquante
   */
  const sendAttempt = useCallback(async (
    step: number,
    stepName: SignupStepName,
    data: SignupAttemptData
  ) => {
    // Ne pas envoyer si on a déjà envoyé cette étape ou une étape supérieure
    if (step <= lastSentStepRef.current) return;
    
    // Annuler la requête précédente si elle existe
    if (pendingRequestRef.current) {
      pendingRequestRef.current.abort();
    }

    const controller = new AbortController();
    pendingRequestRef.current = controller;

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      await fetch('/api/signup-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          step,
          stepName,
          ...data,
          source: options.source,
          utmSource: options.utmSource,
          utmMedium: options.utmMedium,
          utmCampaign: options.utmCampaign,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timeSpentSeconds: timeSpent,
        }),
        signal: controller.signal,
      });
      
      lastSentStepRef.current = step;
      console.log(`[SignupAttempt] Step ${step} (${stepName}) saved`);
    } catch (error) {
      // Ignorer les erreurs d'abort
      if (error instanceof Error && error.name === 'AbortError') return;
      // Log les autres erreurs mais ne pas bloquer le flow
      console.warn('[SignupAttempt] Failed to save attempt:', error);
    }
  }, [options.source, options.utmSource, options.utmMedium, options.utmCampaign]);

  /**
   * Tracker l'étape 1 : Nom rempli
   */
  const trackFullName = useCallback((fullName: string) => {
    if (fullName && fullName.length >= 2) {
      sendAttempt(1, 'fullname', { fullName });
    }
  }, [sendAttempt]);

  /**
   * Tracker l'étape 2 : Email rempli (CRITIQUE pour la relance)
   */
  const trackEmail = useCallback((email: string, fullName?: string) => {
    if (email && email.includes('@') && email.includes('.')) {
      sendAttempt(2, 'email', { email, fullName });
    }
  }, [sendAttempt]);

  /**
   * Tracker l'étape 3 : Ville remplie
   */
  const trackCity = useCallback((city: string, email?: string, fullName?: string) => {
    if (city && city.length >= 2) {
      sendAttempt(3, 'city', { city, email, fullName });
    }
  }, [sendAttempt]);

  /**
   * Tracker l'étape 4 : Niveau sélectionné
   */
  const trackLevel = useCallback((
    level: 'débutant' | 'intermédiaire' | 'avancé' | 'expert',
    data: SignupAttemptData
  ) => {
    sendAttempt(4, 'level', { ...data, selfAssessedLevel: level });
  }, [sendAttempt]);

  /**
   * Tracker l'étape 5 : Option club cochée/décochée
   */
  const trackClubOption = useCallback((wantsToJoinClub: boolean, clubSlug?: string, data?: SignupAttemptData) => {
    sendAttempt(5, 'club_option', { ...data, wantsToJoinClub, clubSlug });
  }, [sendAttempt]);

  /**
   * Tracker l'étape 6 : Tentative de soumission
   */
  const trackSubmitAttempt = useCallback((data: SignupAttemptData) => {
    sendAttempt(6, 'submit', data);
  }, [sendAttempt]);

  /**
   * Marquer comme converti après une inscription réussie
   */
  const markAsConverted = useCallback(async (userId: string) => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    try {
      await fetch('/api/signup-attempts/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userId,
          timeSpentSeconds: timeSpent,
        }),
      });
      
      // Nettoyer le session ID
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('tmf_signup_session');
      }
      
      console.log('[SignupAttempt] Marked as converted');
    } catch (error) {
      console.warn('[SignupAttempt] Failed to mark as converted:', error);
    }
  }, []);

  /**
   * Retourne le session ID pour usage externe
   */
  const getSessionId = useCallback(() => sessionIdRef.current, []);

  return {
    trackFullName,
    trackEmail,
    trackCity,
    trackLevel,
    trackClubOption,
    trackSubmitAttempt,
    markAsConverted,
    getSessionId,
  };
}
