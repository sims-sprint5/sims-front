import { useI18n } from 'vue-i18n';

/** Returns a formatted error string: translates i18n keys, otherwise returns as-is. */
export function useFormatError() {
  const { t } = useI18n();

  const formatError = (error: string | undefined): string => {
    if (!error) return '';
    if (error.startsWith('validation.') || error.startsWith('errors.')) return t(error);
    return error;
  };

  return { formatError };
}
