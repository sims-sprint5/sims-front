<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import { authService } from '@/modules/auth/services/auth.service';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const isAuthenticated = computed(() => authService.isAuthenticated());

// Error code passed via query param (?code=503) or defaults to 500
const errorCode = computed(() => {
  const code = Number(route.query.code);
  return Number.isFinite(code) && code >= 400 ? code : 500;
});

const titleKey = computed(() => {
  if (errorCode.value === 503) return 'serverError.titleUnavailable';
  if (errorCode.value === 504) return 'serverError.titleTimeout';
  return 'serverError.title';
});

const messageKey = computed(() => {
  if (errorCode.value === 503) return 'serverError.messageUnavailable';
  if (errorCode.value === 504) return 'serverError.messageTimeout';
  return 'serverError.message';
});

const reload = () => window.location.reload();
const goHome = () => router.push({ name: 'UserMapView' });
const goLogin = () => router.push({ name: 'Login' });
</script>

<template>
  <AppLayout v-if="isAuthenticated" :title="t(titleKey)">
    <div class="flex flex-1 items-center justify-center px-4 py-16">
      <div class="max-w-md w-full text-center">
        <p class="text-8xl font-extrabold text-danger opacity-20 select-none leading-none">{{ errorCode }}</p>
        <div class="mt-4">
          <svg class="mx-auto h-16 w-16 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 class="mt-4 text-2xl font-bold text-main">{{ t(titleKey) }}</h1>
        <p class="mt-2 text-sm text-muted">{{ t(messageKey) }}</p>
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <BaseButton variant="primary" @click="reload">
            {{ t('serverError.reload') }}
          </BaseButton>
          <BaseButton variant="secondary" @click="goHome">
            {{ t('notFound.backHome') }}
          </BaseButton>
        </div>
      </div>
    </div>
  </AppLayout>

  <div v-else class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-red-50/30 flex items-center justify-center p-6">
    <div class="max-w-md w-full text-center">
      <p class="text-8xl font-extrabold text-red-400 opacity-20 select-none leading-none">{{ errorCode }}</p>
      <div class="mt-4">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">{{ t(titleKey) }}</h1>
      <p class="mt-2 text-sm text-gray-500">{{ t(messageKey) }}</p>
      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <BaseButton variant="primary" @click="reload">
          {{ t('serverError.reload') }}
        </BaseButton>
        <BaseButton variant="secondary" @click="goLogin">
          {{ t('notFound.goLogin') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
