import { useI18n } from 'vue-i18n';

/**
 * Composable que retorna una funció per formatar errors de validació.
 * Si l'error és una clau i18n, la tradueix; altrament, la retorna tal qual.
 */
export function useFormatError() {
  const { t } = useI18n();

  const formatError = (error: string | undefined): string => {
    if (!error) return '';
    if (error.startsWith('validation.') || error.startsWith('errors.')) return t(error);
    return error;
  };

  return { formatError };
}
