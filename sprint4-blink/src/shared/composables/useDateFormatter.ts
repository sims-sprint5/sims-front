import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const localeMap: Record<string, string> = {
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
};

interface DateTimeOptions extends Intl.DateTimeFormatOptions {
  includeTime?: boolean;
}

/** Returns a reactive `formatDate` function that respects the current i18n locale. */
export function useDateFormatter(options?: DateTimeOptions) {
  const { locale } = useI18n();
  const { includeTime = true } = options ?? {};

  const resolvedOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
    }),
    ...Object.fromEntries(
      Object.entries(options ?? {}).filter(([key]) => key !== 'includeTime')
    ),
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

  const formatDateTime = (date: string): string => {
    if (!date) return '';
    return formatter.value.format(new Date(date));
  };

  return { formatDate, formatDateTime };
}
