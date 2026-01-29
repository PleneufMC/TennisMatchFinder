/**
 * NPS Survey Trigger
 * 
 * Composant invisible qui vérifie l'éligibilité au survey NPS
 * et affiche le modal si l'utilisateur est éligible.
 * 
 * À placer dans le layout principal (dashboard).
 */

'use client';

import { useState, useEffect } from 'react';
import { NpsSurveyModal } from './nps-survey-modal';

interface NpsEligibility {
  eligible: boolean;
  reason: 'matches_milestone' | 'days_since_signup' | null;
  triggerValue: number | null;
}

export function NpsSurveyTrigger() {
  const [eligibility, setEligibility] = useState<NpsEligibility | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Vérifier l'éligibilité après un court délai (UX)
    const timer = setTimeout(() => {
      checkEligibility();
    }, 3000); // 3 secondes après le chargement de la page

    return () => clearTimeout(timer);
  }, []);

  const checkEligibility = async () => {
    try {
      const response = await fetch('/api/nps');
      if (response.ok) {
        const data = await response.json();
        setEligibility(data);
        
        if (data.eligible) {
          // Afficher le modal avec un petit délai supplémentaire
          setTimeout(() => setShowModal(true), 1000);
        }
      }
    } catch (error) {
      console.error('NPS eligibility check failed:', error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEligibility(null);
  };

  if (!eligibility?.eligible || !eligibility.reason) {
    return null;
  }

  return (
    <NpsSurveyModal
      isOpen={showModal}
      onClose={handleClose}
      triggerReason={eligibility.reason}
      triggerValue={eligibility.triggerValue ?? undefined}
    />
  );
}
