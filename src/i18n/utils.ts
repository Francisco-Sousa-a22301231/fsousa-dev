import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';

const translations: Record<string, Record<string, unknown>> = { pt, en, es, fr, de, it };

export const supportedLocales = ['pt', 'en', 'es', 'fr', 'de', 'it'] as const;
export type Locale = (typeof supportedLocales)[number];

export const localeConfig: Record<string, { name: string; flag: string; ogLocale: string }> = {
  pt: { name: 'Português', flag: '🇵🇹', ogLocale: 'pt_PT' },
  en: { name: 'English', flag: '🇬🇧', ogLocale: 'en_GB' },
  es: { name: 'Español', flag: '🇪🇸', ogLocale: 'es_ES' },
  fr: { name: 'Français', flag: '🇫🇷', ogLocale: 'fr_FR' },
  de: { name: 'Deutsch', flag: '🇩🇪', ogLocale: 'de_DE' },
  it: { name: 'Italiano', flag: '🇮🇹', ogLocale: 'it_IT' },
};

export function getLocaleFromUrl(url: URL): Locale {
  const [, segment] = url.pathname.split('/');
  if (segment && supportedLocales.includes(segment as Locale)) {
    return segment as Locale;
  }
  return 'pt';
}

export function t(locale: string, key: string): string {
  const result = getNestedValue(translations[locale], key);
  if (result !== undefined) return String(result);
  // Fallback to Portuguese
  if (locale !== 'pt') {
    const fallback = getNestedValue(translations.pt, key);
    if (fallback !== undefined) return String(fallback);
  }
  return key;
}

export function tArray(locale: string, key: string): Record<string, string>[] {
  const result = getNestedValue(translations[locale], key);
  if (Array.isArray(result)) return result as Record<string, string>[];
  if (locale !== 'pt') {
    const fallback = getNestedValue(translations.pt, key);
    if (Array.isArray(fallback)) return fallback as Record<string, string>[];
  }
  return [];
}

export function tStringArray(locale: string, key: string): string[] {
  const result = getNestedValue(translations[locale], key);
  if (Array.isArray(result)) return result as string[];
  if (locale !== 'pt') {
    const fallback = getNestedValue(translations.pt, key);
    if (Array.isArray(fallback)) return fallback as string[];
  }
  return [];
}

function getNestedValue(obj: Record<string, unknown> | undefined, key: string): unknown {
  if (!obj) return undefined;
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function getLocalizedPath(path: string, locale: string): string {
  // Remove any existing locale prefix
  let cleanPath = path;
  for (const loc of supportedLocales) {
    if (cleanPath.startsWith(`/${loc}/`)) {
      cleanPath = cleanPath.slice(loc.length + 1);
      break;
    }
    if (cleanPath === `/${loc}`) {
      cleanPath = '/';
      break;
    }
  }
  if (locale === 'pt') return cleanPath || '/';
  return `/${locale}${cleanPath === '/' ? '' : cleanPath}` || `/${locale}`;
}

export function getWhatsAppLink(locale: string, messageKey: string): string {
  const message = t(locale, messageKey);
  return `https://wa.me/351939021876?text=${encodeURIComponent(message)}`;
}
