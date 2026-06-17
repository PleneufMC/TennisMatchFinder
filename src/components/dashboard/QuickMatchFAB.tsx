'use client';

import Link from 'next/link';
import { PlusCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleAnalytics } from '@/components/google-analytics';

interface QuickMatchFABProps {
  className?: string;
  /** Whether to show the pulse animation (default: true for new users) */
  showPulse?: boolean;
  /**
   * UX-003 : pour un joueur qui n'a encore joué aucun match (matchesPlayed === 0),
   * le FAB invite d'abord à TROUVER un adversaire (/suggestions) plutôt qu'à
   * enregistrer un match contre quelqu'un qu'il n'a pas encore. Cela colle au
   * parcours d'activation réel : on ne peut pas enregistrer un match sans adversaire.
   */
  isFirstMatch?: boolean;
}

/**
 * Détermine la destination, le libellé et l'icône du FAB selon l'état
 * d'activation du joueur (premier match ou non). Source unique de vérité
 * partagée par les 3 variantes du FAB.
 */
function getFabTarget(isFirstMatch: boolean) {
  if (isFirstMatch) {
    return {
      href: '/suggestions',
      label: 'Trouver un adversaire',
      ariaLabel: 'Trouver un adversaire',
      Icon: Users,
      ctaId: 'quick_match_fab_find_opponent',
    } as const;
  }
  return {
    href: '/matchs/nouveau',
    label: 'Enregistrer un match',
    ariaLabel: 'Enregistrer un match',
    Icon: PlusCircle,
    ctaId: 'quick_match_fab',
  } as const;
}

/**
 * QuickMatchFAB - Floating Action Button for quick match registration
 * 
 * Primary CTA to increase "Enregistrer match" usage
 * Sprint Février 2026 - Activation Priority
 * 
 * Position: Fixed bottom-right on all dashboard pages
 * Animation: Subtle pulse on first render for new users
 */
export function QuickMatchFAB({ className, showPulse = true, isFirstMatch = false }: QuickMatchFABProps) {
  const { trackCtaClicked } = useGoogleAnalytics();
  const target = getFabTarget(isFirstMatch);

  const handleClick = () => {
    trackCtaClicked(target.ctaId, 'dashboard_fab');
  };

  return (
    <Link
      href={target.href}
      onClick={handleClick}
      className={cn(
        // Base positioning
        'fixed bottom-6 right-6 z-50',
        // Flex layout
        'flex items-center gap-2',
        // Colors & styling
        'bg-primary text-primary-foreground',
        'px-4 py-3 rounded-full',
        // Shadow & transitions
        'shadow-lg hover:shadow-xl',
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        // Animation
        showPulse && 'animate-pulse hover:animate-none',
        // Focus styles
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      aria-label={target.ariaLabel}
    >
      <target.Icon className="h-5 w-5" />
      <span className="font-medium">{target.label}</span>
    </Link>
  );
}

/**
 * Mini version of the FAB - Icon only
 * For use on smaller screens or when space is limited
 */
export function QuickMatchFABMini({ className, showPulse = true, isFirstMatch = false }: QuickMatchFABProps) {
  const { trackCtaClicked } = useGoogleAnalytics();
  const target = getFabTarget(isFirstMatch);

  const handleClick = () => {
    trackCtaClicked(`${target.ctaId}_mini`, 'dashboard_fab');
  };

  return (
    <Link
      href={target.href}
      onClick={handleClick}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex items-center justify-center',
        'bg-primary text-primary-foreground',
        'w-14 h-14 rounded-full',
        'shadow-lg hover:shadow-xl',
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        showPulse && 'animate-pulse hover:animate-none',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      aria-label={target.ariaLabel}
    >
      <target.Icon className="h-6 w-6" />
    </Link>
  );
}

/**
 * Responsive FAB that switches between full and mini versions
 */
export function QuickMatchFABResponsive({ className, showPulse = true, isFirstMatch = false }: QuickMatchFABProps) {
  return (
    <>
      {/* Full version on larger screens */}
      <div className="hidden sm:block">
        <QuickMatchFAB className={className} showPulse={showPulse} isFirstMatch={isFirstMatch} />
      </div>
      {/* Mini version on small screens */}
      <div className="block sm:hidden">
        <QuickMatchFABMini className={className} showPulse={showPulse} isFirstMatch={isFirstMatch} />
      </div>
    </>
  );
}
