/**
 * Internationalization Configuration
 */

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
};

/**
 * Get locale from cookie or default
 */
export function getLocaleFromCookie(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('locale='));
  
  const value = cookie?.split('=')[1] as Locale | undefined;
  
  if (value && locales.includes(value)) {
    return value;
  }
  
  return defaultLocale;
}

/**
 * Set locale in cookie
 */
export function setLocaleCookie(locale: Locale): void {
  if (typeof window === 'undefined') return;
  
  // Set cookie for 1 year
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  
  document.cookie = `locale=${locale}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}
