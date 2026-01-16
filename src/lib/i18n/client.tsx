'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { type Locale, defaultLocale, getLocaleFromCookie, setLocaleCookie } from './config';

// Import messages
import frMessages from '../../../messages/fr.json';
import enMessages from '../../../messages/en.json';

const messages: Record<Locale, typeof frMessages> = {
  fr: frMessages,
  en: enMessages,
};

type Messages = typeof frMessages;
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKey = NestedKeyOf<Messages>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof current === 'string' ? current : path;
}

/**
 * Replace placeholders in translation string
 */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate locale from cookie on mount
  useEffect(() => {
    const savedLocale = getLocaleFromCookie();
    setLocaleState(savedLocale);
    setIsHydrated(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
    // Optionally reload the page to update server-rendered content
    // window.location.reload();
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const currentMessages = messages[locale];
    const text = getNestedValue(currentMessages as Record<string, unknown>, key);
    return interpolate(text, params);
  }, [locale]);

  // Prevent hydration mismatch by using default locale until hydrated
  const currentLocale = isHydrated ? locale : defaultLocale;
  const currentT = useCallback((key: string, params?: Record<string, string | number>): string => {
    const currentMessages = messages[currentLocale];
    const text = getNestedValue(currentMessages as Record<string, unknown>, key);
    return interpolate(text, params);
  }, [currentLocale]);

  return (
    <I18nContext.Provider value={{ locale: currentLocale, setLocale, t: currentT }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use translations
 */
export function useTranslations(namespace?: string) {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useTranslations must be used within an I18nProvider');
  }

  const { locale, setLocale, t } = context;

  // If namespace provided, prefix all keys
  const tWithNamespace = useCallback((key: string, params?: Record<string, string | number>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey, params);
  }, [namespace, t]);

  return {
    locale,
    setLocale,
    t: namespace ? tWithNamespace : t,
  };
}

/**
 * Hook to get/set locale
 */
export function useLocale() {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useLocale must be used within an I18nProvider');
  }

  return {
    locale: context.locale,
    setLocale: context.setLocale,
  };
}
