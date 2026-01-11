'use client';

import Link from 'next/link';
import { useGoogleAnalytics } from '@/components/google-analytics';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface TrackedCtaButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  trackingSource: 'landing_hero' | 'landing_cta' | 'pricing_page' | 'navbar' | 'footer';
  trackingAction?: 'signup_started' | 'cta_clicked';
  showArrow?: boolean;
}

export function TrackedCtaButton({
  href,
  children,
  variant = 'default',
  size = 'lg',
  className,
  trackingSource,
  trackingAction = 'signup_started',
  showArrow = true,
}: TrackedCtaButtonProps) {
  const { trackSignupStarted, trackCtaClicked } = useGoogleAnalytics();

  const handleClick = () => {
    if (trackingAction === 'signup_started') {
      trackSignupStarted(trackingSource);
    } else {
      trackCtaClicked(children?.toString() || 'CTA', trackingSource);
    }
  };

  return (
    <Button size={size} variant={variant} className={className} asChild onClick={handleClick}>
      <Link href={href} onClick={handleClick}>
        {children}
        {showArrow && <ArrowRight className="ml-2 h-5 w-5" />}
      </Link>
    </Button>
  );
}

// Bouton spécifique pour inscription
export function SignupCtaButton({
  className,
  source = 'landing_hero',
}: {
  className?: string;
  source?: 'landing_hero' | 'landing_cta' | 'pricing_page' | 'navbar' | 'footer';
}) {
  const { trackSignupStarted } = useGoogleAnalytics();

  return (
    <Button
      size="lg"
      className={className || "bg-amber-500 hover:bg-amber-600 text-white shadow-lg"}
      asChild
      onClick={() => trackSignupStarted(source)}
    >
      <Link href="/register" onClick={() => trackSignupStarted(source)}>
        Rejoindre gratuitement
        <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </Button>
  );
}
