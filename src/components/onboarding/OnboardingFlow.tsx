'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { WelcomeStep } from './steps/WelcomeStep';
import { ProfileStep } from './steps/ProfileStep';
import { LevelStep } from './steps/LevelStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { FirstMatchStep } from './steps/FirstMatchStep';
import { useGoogleAnalytics } from '@/components/google-analytics';

export interface OnboardingData {
  fullName: string;
  avatarUrl?: string;
  dominantHand?: 'right' | 'left' | 'ambidextrous';
  selfAssessedLevel: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  city: string;
  availability: {
    days: string[];
    timeSlots: string[];
  };
  preferences: {
    gameTypes: string[];
    surfaces: string[];
  };
}

interface OnboardingFlowProps {
  userId: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
  onComplete: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Bienvenue', progress: 0 },
  { id: 'profile', title: 'Profil', progress: 25 },
  { id: 'level', title: 'Niveau', progress: 50 },
  { id: 'availability', title: 'Disponibilités', progress: 75 },
  { id: 'first-match', title: 'Premier match', progress: 100 },
];

// Mapping des step IDs vers les noms pour le tracking
const STEP_NAMES: Record<string, 'welcome' | 'profile' | 'level' | 'availability' | 'first_match'> = {
  'welcome': 'welcome',
  'profile': 'profile',
  'level': 'level',
  'availability': 'availability',
  'first-match': 'first_match',
};

export function OnboardingFlow({
  userId,
  userName,
  userEmail,
  userImage,
  onComplete,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== TRACKING ANALYTICS =====
  const { trackOnboardingStep, trackOnboardingCompleted } = useGoogleAnalytics();
  const onboardingStartTime = useRef<number>(Date.now());
  const skippedSteps = useRef<string[]>([]);
  const trackedSteps = useRef<Set<string>>(new Set());

  // Track le step courant quand il change
  useEffect(() => {
    const stepData = STEPS[currentStep];
    if (stepData && !trackedSteps.current.has(stepData.id)) {
      const stepName = STEP_NAMES[stepData.id];
      if (stepName) {
        trackOnboardingStep(stepName, currentStep + 1, 'view');
        trackedSteps.current.add(stepData.id);
      }
    }
  }, [currentStep, trackOnboardingStep]);

  const [data, setData] = useState<OnboardingData>({
    fullName: userName || '',
    avatarUrl: userImage,
    selfAssessedLevel: 'intermédiaire',
    city: '',
    availability: {
      days: [],
      timeSlots: [],
    },
    preferences: {
      gameTypes: ['simple'],
      surfaces: [],
    },
  });

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      // Track completion du step courant
      const stepData = STEPS[currentStep];
      if (stepData) {
        const stepName = STEP_NAMES[stepData.id];
        if (stepName) {
          trackOnboardingStep(stepName, currentStep + 1, 'complete');
        }
      }
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, trackOnboardingStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création du profil');
      }

      // ===== TRACK ONBOARDING COMPLETED =====
      const totalTime = Math.round((Date.now() - onboardingStartTime.current) / 1000);
      trackOnboardingCompleted(totalTime, skippedSteps.current);
      console.log(`[Analytics] onboarding_completed - Time: ${totalTime}s, Skipped: ${skippedSteps.current.join(', ') || 'none'}`);
      
      toast.success('Profil créé avec succès ! 🎾', {
        description: 'Bienvenue sur TennisMatchFinder',
      });
      
      onComplete();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, data, onComplete]);

  const skipToEnd = useCallback(() => {
    // Track les steps sautés
    const skipped: string[] = [];
    for (let i = currentStep; i < STEPS.length - 1; i++) {
      const stepData = STEPS[i];
      if (stepData) {
        const stepName = STEP_NAMES[stepData.id];
        if (stepName) {
          trackOnboardingStep(stepName, i + 1, 'skip');
          skipped.push(stepName);
        }
      }
    }
    skippedSteps.current = skipped;
    setCurrentStep(STEPS.length - 1);
  }, [currentStep, trackOnboardingStep]);

  const currentStepData = STEPS[currentStep];
  if (!currentStepData) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Étape {currentStep + 1} / {STEPS.length}</span>
          <span>{currentStepData.title}</span>
        </div>
        <Progress value={currentStepData.progress} className="h-2" />
        
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                    ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Step content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && (
            <WelcomeStep
              userName={userName}
              onNext={nextStep}
              onSkip={skipToEnd}
            />
          )}
          {currentStep === 1 && (
            <ProfileStep
              data={data}
              updateData={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 2 && (
            <LevelStep
              data={data}
              updateData={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <AvailabilityStep
              data={data}
              updateData={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <FirstMatchStep
              data={data}
              isSubmitting={isSubmitting}
              onComplete={handleComplete}
              onBack={prevStep}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
