'use client';

import { useLocale } from '@/lib/i18n';
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'ghost', 
  showLabel = false,
  className 
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    // Reload to apply translations to server-rendered content
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={showLabel ? 'default' : 'icon'} className={className}>
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          {showLabel && (
            <span className="ml-2">
              {localeFlags[locale]} {localeNames[locale]}
            </span>
          )}
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="flex items-center justify-between gap-2"
          >
            <span>
              {localeFlags[loc]} {localeNames[loc]}
            </span>
            {locale === loc && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact version for mobile nav
 */
export function LanguageSwitcherCompact({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  const toggleLocale = () => {
    const newLocale = locale === 'fr' ? 'en' : 'fr';
    setLocale(newLocale);
    window.location.reload();
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLocale}
      className={className}
    >
      {localeFlags[locale === 'fr' ? 'en' : 'fr']}
      <span className="ml-1 text-xs">
        {locale === 'fr' ? 'EN' : 'FR'}
      </span>
    </Button>
  );
}
