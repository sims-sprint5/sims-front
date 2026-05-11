<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import { authService } from '@/modules/auth/services/auth.service';

const router = useRouter();
const { t } = useI18n();

const isAuthenticated = computed(() => authService.isAuthenticated());

const goHome = () => router.push({ name: 'UserMapView' });
const goLogin = () => router.push({ name: 'Login' });
const goBack = () => router.go(-1);
</script>

<template>
  <AppLayout v-if="isAuthenticated" :title="t('notFound.title')">
    <div class="flex flex-1 items-center justify-center px-4 py-16">
      <div class="max-w-md w-full text-center">
        <p class="text-8xl font-extrabold text-primary opacity-20 select-none leading-none">404</p>
        <div class="mt-4">
          <svg class="mx-auto h-16 w-16 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="mt-4 text-2xl font-bold text-main">{{ t('notFound.title') }}</h1>
        <p class="mt-2 text-sm text-muted">{{ t('notFound.message') }}</p>
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <BaseButton variant="primary" @click="goHome">
            {{ t('notFound.backHome') }}
          </BaseButton>
          <BaseButton variant="secondary" @click="goBack">
            {{ t('notFound.goBack') }}
          </BaseButton>
        </div>
      </div>
    </div>
  </AppLayout>

  <div v-else class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50/30 flex items-center justify-center p-6">
    <div class="max-w-md w-full text-center">
      <p class="text-8xl font-extrabold text-primary opacity-20 select-none leading-none">404</p>
      <div class="mt-4">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">{{ t('notFound.title') }}</h1>
      <p class="mt-2 text-sm text-gray-500">{{ t('notFound.message') }}</p>
      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <BaseButton variant="primary" @click="goLogin">
          {{ t('notFound.goLogin') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
