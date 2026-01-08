import { cn } from '@/lib/utils';

interface TSAFooterProps {
  className?: string;
}

/**
 * Section footer partenaire Tennis String Advisor - Version discrète
 * Un simple lien contextuel, non intrusif
 */
export function TSAFooter({ className }: TSAFooterProps) {
  return (
    <div 
      className={cn(
        'text-center text-xs text-muted-foreground/60 py-4',
        className
      )}
    >
      <span>Optimisez votre jeu • </span>
      <a
        href="https://tennisstringadvisor.org?utm_source=tennismatchfinder&utm_medium=footer&utm_campaign=crosspromo"
        className={cn(
          'text-muted-foreground/80 hover:text-emerald-600 dark:hover:text-emerald-400',
          'transition-colors duration-150 underline underline-offset-2',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:rounded'
        )}
        rel="dofollow"
        target="_blank"
      >
        Tennis String Advisor
      </a>
    </div>
  );
}
