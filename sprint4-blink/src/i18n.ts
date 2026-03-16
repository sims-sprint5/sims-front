import { createI18n } from 'vue-i18n';

import ca from '@/locales/ca.json';
import es from '@/locales/es.json';
import en from '@/locales/en.json';

export const LOCALE_STORAGE_KEY = 'blink.locale';

export const SUPPORTED_LOCALES = ['ca', 'es', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function normalizeLocale(raw: string | null | undefined): SupportedLocale {
  const base = (raw ?? '').toLowerCase().split('-')[0];
  if (SUPPORTED_LOCALES.includes(base as SupportedLocale)) return base as SupportedLocale;
  return 'ca';
}

export function getInitialLocale(): SupportedLocale {
  const rawStorage = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (rawStorage) return normalizeLocale(rawStorage);

  return normalizeLocale(navigator.language);
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: 'ca',
  messages: {
    ca,
    es,
    en,
  },
});

export function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

// Set initial HTML lang + ensure storage is consistent
setLocale(i18n.global.locale.value as SupportedLocale);
