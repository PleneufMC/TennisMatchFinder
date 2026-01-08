import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TSASidebarCardProps {
  className?: string;
}

/**
 * Card sidebar pour Tennis String Advisor
 * Placement recommandé: sidebar droite des pages de recherche/profil
 */
export function TSASidebarCard({ className }: TSASidebarCardProps) {
  const features = [
    '104 raquettes analysées',
    '165 cordages comparés',
    'Guides experts gratuits',
  ];

  return (
    <aside
      className={cn(
        'bg-white dark:bg-slate-800',
        'border border-slate-200 dark:border-slate-700',
        'rounded-xl p-5',
        'shadow-sm hover:shadow-lg hover:shadow-emerald-500/10',
        'transition-all duration-200',
        'hover:-translate-y-0.5',
        className
      )}
      aria-labelledby="tsa-sidebar-title"
    >
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wide rounded-full mb-4">
        <span>🎾</span>
        <span>Partenaire</span>
      </div>

      {/* Title */}
      <h3 
        id="tsa-sidebar-title" 
        className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2"
      >
        Tennis String Advisor
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
        Trouvez le cordage parfait pour votre style de jeu.
      </p>

      {/* Features list */}
      <ul className="space-y-2.5 mb-5">
        {features.map((feature, index) => (
          <li 
            key={index}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
          >
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <a
        href="https://tennisstringadvisor.org/configurator?utm_source=tennismatchfinder&utm_medium=sidebar&utm_campaign=crosspromo"
        className={cn(
          'block w-full',
          'px-5 py-3',
          'bg-emerald-500 hover:bg-emerald-600',
          'text-white font-semibold text-center',
          'rounded-lg',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          'active:scale-[0.98]'
        )}
        rel="dofollow"
        title="Configurer mon setup tennis - Tennis String Advisor"
      >
        Configurer mon setup →
      </a>
    </aside>
  );
}
