'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { WelcomeStep } from './steps/WelcomeStep';
import { ProfileStep } from './steps/ProfileStep';
import { LevelStep } from './steps/LevelStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { FirstMatchStep } from './steps/FirstMatchStep';

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
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

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
    setCurrentStep(STEPS.length - 1);
  }, []);

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
