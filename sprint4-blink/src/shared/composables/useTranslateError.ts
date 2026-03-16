import { useI18n } from 'vue-i18n';

/** Translates an API error message if it matches an i18n key, otherwise returns it as-is. */
export function useTranslateError() {
  const { t, te } = useI18n();

  const translateErrorMessage = (message: unknown, fallback: string): string => {
    const msg = typeof message === 'string' ? message : '';
    if (msg && te(msg)) return t(msg);
    return msg || fallback;
  };

  return { translateErrorMessage };
}
