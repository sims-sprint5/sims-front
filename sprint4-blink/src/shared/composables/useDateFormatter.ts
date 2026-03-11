import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const localeMap: Record<string, string> = {
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
};

/** Returns a reactive `formatDate` function that respects the current i18n locale. */
export function useDateFormatter(options?: Intl.DateTimeFormatOptions) {
  const { locale } = useI18n();

  const resolvedOptions: Intl.DateTimeFormatOptions = options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const formatter = computed(
    () =>
      new Intl.DateTimeFormat(
        localeMap[String(locale.value)] ?? 'ca-ES',
        resolvedOptions,
      ),
  );

  const formatDate = (date: string): string => {
    if (!date) return '';
    return formatter.value.format(new Date(date));
  };

  return { formatDate };
}
