import { cn } from '@/lib/utils';

interface TSAInlineLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  campaign?: string;
}

/**
 * Lien inline contextuel vers Tennis String Advisor
 * Usage: dans les paragraphes de texte, articles, descriptions
 * 
 * @example
 * <p>
 *   Pour maximiser vos chances, pensez à{' '}
 *   <TSAInlineLink href="/blog/guide-tension-cordage">
 *     optimiser votre tension de cordage
 *   </TSAInlineLink>
 *   {' '}selon votre style de jeu.
 * </p>
 */
export function TSAInlineLink({ 
  href, 
  children, 
  className,
  campaign = 'inline'
}: TSAInlineLinkProps) {
  const fullUrl = href.startsWith('http') 
    ? href 
    : `https://tennisstringadvisor.org${href}`;
  
  const trackedUrl = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}utm_source=tennismatchfinder&utm_medium=${campaign}&utm_campaign=crosspromo`;

  return (
    <a
      href={trackedUrl}
      className={cn(
        'text-emerald-600 dark:text-emerald-400',
        'font-medium',
        'underline decoration-emerald-500/30 underline-offset-2',
        'hover:decoration-current',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:rounded',
        className
      )}
      rel="dofollow"
      title="Tennis String Advisor - Guides cordages tennis"
    >
      {children}
    </a>
  );
}
