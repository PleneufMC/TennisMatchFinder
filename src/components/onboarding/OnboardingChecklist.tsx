'use client';

import Link from 'next/link';
import { CheckCircle, Circle, ArrowRight, Rocket, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { trackOnboardingStep as trackOnboardingStepEvent } from '@/lib/analytics';

// Onboarding step definition
interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  checkField: string; // Field to check on player object
  checkValue?: unknown; // Expected value (if not just truthy)
}

// Player data structure for checking step completion
interface PlayerForOnboarding {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  selfAssessedLevel: string | null;
  availability: Record<string, unknown> | null;
  matchesPlayed: number;
  createdAt: Date;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: Date | null;
  // For suggestion view tracking
  hasViewedSuggestions?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile_complete',
    label: 'Complète ton profil',
    description: 'Ajoute ton nom et ta photo',
    href: '/profil/modifier',
    icon: '👤',
    checkField: 'avatarUrl',
  },
  {
    id: 'level_set',
    label: 'Indique ton niveau',
    description: 'Pour des suggestions adaptées',
    href: '/profil/modifier#niveau',
    icon: '🎯',
    checkField: 'selfAssessedLevel',
  },
  {
    id: 'availability_set',
    label: 'Définis tes disponibilités',
    description: 'Quand peux-tu jouer ?',
    href: '/profil/modifier#disponibilites',
    icon: '📅',
    checkField: 'availability',
  },
  {
    id: 'first_match',
    label: 'Enregistre ton premier match',
    description: 'Lance ton classement ELO !',
    href: '/matchs/nouveau',
    icon: '🎾',
    checkField: 'matchesPlayed',
    checkValue: 1, // At least 1 match
  },
  {
    id: 'view_suggestions',
    label: 'Découvre tes adversaires',
    description: 'Trouve des partenaires de jeu',
    href: '/suggestions',
    icon: '🔍',
    checkField: 'hasViewedSuggestions',
  },
];

interface OnboardingChecklistProps {
  player: PlayerForOnboarding;
  className?: string;
  /** Allow user to dismiss the checklist */
  dismissible?: boolean;
}

/**
 * OnboardingChecklist - Guided checklist for new users
 * 
 * Displays on dashboard for new users to guide them through activation
 * Sprint Février 2026 - Activation Priority
 */
export function OnboardingChecklist({ player, className, dismissible = true }: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if onboarding was completed and hide after 7 days
  useEffect(() => {
    // Check localStorage for dismissal
    const dismissed = localStorage.getItem(`onboarding_dismissed_${player.id}`);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, [player.id]);

  // Check step completion
  const isStepCompleted = (step: OnboardingStep): boolean => {
    const value = (player as unknown as Record<string, unknown>)[step.checkField];
    
    if (step.checkValue !== undefined) {
      // Check against specific value (e.g., matchesPlayed >= 1)
      if (typeof step.checkValue === 'number') {
        return (value as number) >= step.checkValue;
      }
      return value === step.checkValue;
    }
    
    // Check for truthy value
    if (step.checkField === 'availability') {
      // Special check for availability object
      const avail = value as Record<string, unknown> | null;
      return avail !== null && Object.keys(avail).length > 0 && 
        (Array.isArray(avail.days) ? avail.days.length > 0 : false);
    }
    
    return !!value;
  };

  const completedSteps = ONBOARDING_STEPS.filter(isStepCompleted);
  const completedCount = completedSteps.length;
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = Math.round((completedCount / totalSteps) * 100);
  const isComplete = completedCount === totalSteps;

  // Check if we should hide the checklist
  const daysSinceSignup = Math.floor(
    (Date.now() - new Date(player.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Hide if:
  // 1. Dismissed by user
  // 2. Onboarding completed more than 7 days ago
  // 3. User signed up more than 30 days ago (even if incomplete)
  if (isDismissed) return null;
  if (isComplete && player.onboardingCompletedAt) {
    const daysSinceComplete = Math.floor(
      (Date.now() - new Date(player.onboardingCompletedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceComplete > 7) return null;
  }
  if (daysSinceSignup > 30 && !isComplete) return null;

  const handleDismiss = () => {
    localStorage.setItem(`onboarding_dismissed_${player.id}`, 'true');
    setIsDismissed(true);
  };

  const handleStepClick = (step: OnboardingStep, index: number) => {
    const isCompleted = isStepCompleted(step);
    trackOnboardingStepEvent(step.id, index + 1, isCompleted ? 'complete' : 'view');
  };

  // Find the first incomplete step for highlighting
  const nextStep = ONBOARDING_STEPS.find(step => !isStepCompleted(step));

  return (
    <Card className={cn('border-primary/20 bg-gradient-to-br from-primary/5 to-transparent', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span>Bien démarrer</span>
            <Badge variant="secondary" className="ml-2">
              {completedCount}/{totalSteps}
            </Badge>
          </CardTitle>
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
              aria-label="Masquer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ONBOARDING_STEPS.map((step, index) => {
            const isCompleted = isStepCompleted(step);
            const isNext = step.id === nextStep?.id;

            return (
              <Link
                key={step.id}
                href={step.href}
                onClick={() => handleStepClick(step, index)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  isCompleted
                    ? 'opacity-60 hover:opacity-80'
                    : isNext
                    ? 'bg-primary/10 hover:bg-primary/15 ring-1 ring-primary/20'
                    : 'hover:bg-muted/50'
                )}
              >
                {/* Step indicator */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* Icon */}
                <span className="text-lg flex-shrink-0">{step.icon}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium text-sm',
                    isCompleted && 'line-through text-muted-foreground'
                  )}>
                    {step.label}
                  </p>
                  {!isCompleted && (
                    <p className="text-xs text-muted-foreground truncate">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Arrow for incomplete steps */}
                {!isCompleted && (
                  <ArrowRight className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isNext ? 'text-primary' : 'text-muted-foreground'
                  )} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Completion message */}
        {isComplete && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300 text-center">
              🎉 Bravo ! Tu es prêt à jouer. Bonne chance sur les courts !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for sidebar or smaller spaces
 */
export function OnboardingChecklistCompact({ player }: { player: PlayerForOnboarding }) {
  const completedCount = ONBOARDING_STEPS.filter(step => {
    const value = (player as unknown as Record<string, unknown>)[step.checkField];
    if (step.checkValue !== undefined) {
      return typeof step.checkValue === 'number'
        ? (value as number) >= step.checkValue
        : value === step.checkValue;
    }
    return !!value;
  }).length;

  const totalSteps = ONBOARDING_STEPS.length;
  const progress = Math.round((completedCount / totalSteps) * 100);

  if (completedCount === totalSteps) return null;

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
    >
      <Rocket className="h-5 w-5 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Onboarding</p>
        <Progress value={progress} className="h-1.5 mt-1" />
      </div>
      <Badge variant="outline" className="text-xs">
        {completedCount}/{totalSteps}
      </Badge>
    </Link>
  );
}
