import { useI18n } from 'vue-i18n';

/**
 * Composable que retorna una funció per traduir missatges d'error de l'API.
 * Si el missatge és una clau i18n existent, la tradueix; altrament, la retorna tal qual.
 */
export function useTranslateError() {
  const { t, te } = useI18n();

  const translateErrorMessage = (message: unknown, fallback: string): string => {
    const msg = typeof message === 'string' ? message : '';
    if (msg && te(msg)) return t(msg);
    return msg || fallback;
  };

  return { translateErrorMessage };
}
