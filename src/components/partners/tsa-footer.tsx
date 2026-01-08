import { cn } from '@/lib/utils';

interface TSAFooterProps {
  className?: string;
}

/**
 * Section footer partenaire Tennis String Advisor
 * Placement: footer de toutes les pages
 */
export function TSAFooter({ className }: TSAFooterProps) {
  const links = [
    { href: 'https://tennisstringadvisor.org', label: 'Accueil' },
    { href: 'https://tennisstringadvisor.org/configurator', label: 'Configurateur' },
    { href: 'https://tennisstringadvisor.org/blog', label: 'Guides' },
  ];

  return (
    <div 
      className={cn(
        'border-t border-slate-200 dark:border-slate-700',
        'pt-6 mt-8',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🎾</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            Tennis String Advisor
          </span>
        </div>

        {/* Links */}
        <nav 
          className="flex flex-wrap gap-x-6 gap-y-2"
          aria-label="Liens Tennis String Advisor"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={`${link.href}?utm_source=tennismatchfinder&utm_medium=footer&utm_campaign=crosspromo`}
              className={cn(
                'text-sm text-slate-500 dark:text-slate-400',
                'hover:text-emerald-600 dark:hover:text-emerald-400',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:rounded'
              )}
              rel="dofollow"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
