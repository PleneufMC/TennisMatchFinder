'use client';

import Link from 'next/link';
import { useGoogleAnalytics } from '@/components/google-analytics';
import { useMetaPixel } from '@/components/meta-pixel';
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
  const { trackLead, trackViewContent } = useMetaPixel();

  const handleClick = () => {
    if (trackingAction === 'signup_started') {
      trackSignupStarted(trackingSource);
      trackLead(trackingSource); // Meta Pixel Lead event
    } else {
      trackCtaClicked(children?.toString() || 'CTA', trackingSource);
      trackViewContent(children?.toString() || 'CTA', trackingSource);
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
  const { trackLead } = useMetaPixel();

  const handleClick = () => {
    console.log('[GA4] trackSignupStarted:', source);
    trackSignupStarted(source);
    trackLead(source); // Meta Pixel Lead event
  };

  return (
    <Button
      size="lg"
      className={className || "bg-amber-500 hover:bg-amber-600 text-white shadow-lg"}
      asChild
    >
      <Link href="/register" onClick={handleClick}>
        Rejoindre gratuitement
        <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </Button>
  );
}
