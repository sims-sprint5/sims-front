<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { setLocale, type SupportedLocale, SUPPORTED_LOCALES } from '@/i18n';

const open = ref(false);

const { t, locale } = useI18n({ useScope: 'global' });
const route = useRoute();

const currentLocale = computed(() => locale.value as SupportedLocale);

type LocaleOption = {
  value: SupportedLocale;
  labelKey: string;
};

const options = computed<LocaleOption[]>(() => [
  { value: 'ca', labelKey: 'language.ca' },
  { value: 'es', labelKey: 'language.es' },
  { value: 'en', labelKey: 'language.en' },
]);

const flagSvgs: Record<string, string> = {
  ca: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="24" height="24" fill="#FFDD00" />
      <rect y="2" width="24" height="3" fill="#D90016" />
      <rect y="7" width="24" height="3" fill="#D90016" />
      <rect y="12" width="24" height="3" fill="#D90016" />
      <rect y="17" width="24" height="3" fill="#D90016" />
    </svg>
  `,
  es: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="24" height="24" fill="#C60B1E" />
      <rect y="6" width="24" height="12" fill="#FFC400" />
    </svg>
  `,
  en: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="60" height="30" fill="#012169" />
      <!-- white diagonals -->
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" stroke-width="6" />
      <!-- red diagonals -->
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" stroke-width="4" />
      <!-- white cross -->
      <rect x="24" width="12" height="30" fill="#fff" />
      <rect y="9" width="60" height="12" fill="#fff" />
      <!-- red cross -->
      <rect x="26" width="8" height="30" fill="#C8102E" />
      <rect y="11" width="60" height="8" fill="#C8102E" />
    </svg>
  `,
};

const flagFor = (loc: SupportedLocale) => flagSvgs[String(loc)] || '';

const toggle = () => {
  open.value = !open.value;
};

const close = () => {
  open.value = false;
};

const select = (value: SupportedLocale) => {
  if (!SUPPORTED_LOCALES.includes(value)) return;

  setLocale(value);

  // Refresh current tab title (router guard only runs on navigation)
  const titleKey = route.meta.titleKey as string | undefined;
  const appName = t('app.name');
  const pageTitle = titleKey ? t(titleKey) : appName;
  document.title = `${pageTitle} | ${appName}`;

  close();
};
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      :aria-label="t('language.label')"
      @click="toggle"
      @blur="close"
    >
      <span class="inline-flex items-center gap-2">
        <span class="h-6 w-6 rounded-full overflow-hidden bg-white flag-svg" aria-hidden="true" v-html="flagFor(currentLocale)"></span>
      </span>
      <span class="hidden sm:inline">{{ t(`language.${currentLocale}`) }}</span>
      <svg class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-44 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
      role="menu"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
        :class="opt.value === currentLocale ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700'"
        role="menuitem"
        @mousedown.prevent
        @click="select(opt.value)"
      >
        <span class="inline-flex items-center gap-2">
          <span class="h-6 w-6 rounded-full overflow-hidden bg-white flag-svg" aria-hidden="true" v-html="flagFor(opt.value)"></span>
        </span>
        <span class="ml-2">{{ t(opt.labelKey) }}</span>
      </button>
    </div>
  </div>
</template>
