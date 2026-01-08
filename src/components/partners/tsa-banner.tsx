'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TSABannerProps {
  className?: string;
  variant?: 'default' | 'compact';
  dismissible?: boolean;
  storageKey?: string;
}

/**
 * Banner CTA horizontal pour Tennis String Advisor
 * Placement recommandé: après hero ou entre sections
 */
export function TSABanner({ 
  className, 
  variant = 'default',
  dismissible = true,
  storageKey = 'tsa-banner-dismissed'
}: TSABannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check localStorage after mount (client-side only)
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(storageKey, Date.now().toString());
  };

  if (isDismissed) return null;

  return (
    <aside
      className={cn(
        'relative bg-emerald-50 dark:bg-emerald-950/30',
        'border border-emerald-200/50 dark:border-emerald-800/50',
        'border-l-4 border-l-emerald-500',
        'rounded-xl p-4 md:p-5',
        'transition-all duration-200',
        'hover:shadow-lg hover:shadow-emerald-500/10',
        className
      )}
      role="complementary"
      aria-label="Recommandation partenaire Tennis String Advisor"
    >
      <div className="flex items-center gap-3 md:gap-5 flex-wrap md:flex-nowrap">
        {/* Icon */}
        <div 
          className="flex-shrink-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm"
          aria-hidden="true"
        >
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 40 40" 
            fill="none"
            className="text-emerald-500"
          >
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2"/>
            <path 
              d="M14 20C14 16.6863 16.6863 14 20 14M26 20C26 23.3137 23.3137 26 20 26" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <circle cx="20" cy="20" r="4" fill="currentColor"/>
          </svg>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-[200px]">
          <p className="text-base md:text-lg font-medium text-slate-900 dark:text-slate-100">
            <strong className="text-emerald-600 dark:text-emerald-400">Match trouvé ?</strong>
            {' '}Optimisez votre cordage pour performer.
          </p>
          {variant === 'default' && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Guides experts, comparatifs techniques et recommandations personnalisées.
            </p>
          )}
        </div>

        {/* CTA Button */}
        <a
          href="https://tennisstringadvisor.org?utm_source=tennismatchfinder&utm_medium=banner&utm_campaign=crosspromo"
          className={cn(
            'inline-flex items-center gap-2',
            'px-5 py-2.5 md:px-6 md:py-3',
            'bg-emerald-500 hover:bg-emerald-600',
            'text-white font-semibold text-sm md:text-base',
            'rounded-full whitespace-nowrap',
            'transition-all duration-150',
            'hover:translate-x-0.5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-500',
            'active:scale-[0.98]'
          )}
          rel="dofollow"
          title="Découvrir Tennis String Advisor - Guides cordages tennis"
        >
          <span>Découvrir</span>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            aria-hidden="true"
            className="transition-transform duration-150 group-hover:translate-x-1"
          >
            <path 
              d="M6 12L10 8L6 4" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      {/* Close button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={cn(
            'absolute top-2 right-2 md:top-3 md:right-3',
            'flex items-center justify-center',
            'w-8 h-8 rounded-lg',
            'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            'hover:bg-slate-900/5 dark:hover:bg-white/10',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
          )}
          aria-label="Fermer la bannière"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </aside>
  );
}
