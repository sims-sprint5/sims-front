<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import { authService } from '@/modules/auth/services/auth.service';

const router = useRouter();
const { t } = useI18n();

const isAuthenticated = computed(() => authService.isAuthenticated());

const goDashboard = () => router.push({ name: 'Dashboard' });
const goLogin = () => router.push({ name: 'Login' });
</script>

<template>
  <AppLayout v-if="isAuthenticated" :title="t('unauthorized.title')">
    <div class="max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BaseCard>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('unauthorized.title') }}</h1>
        <p class="mt-2 text-gray-600">{{ t('unauthorized.message') }}</p>

        <div class="mt-6 flex gap-3">
          <BaseButton variant="primary" @click="goDashboard">
            {{ t('unauthorized.backDashboard') }}
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </AppLayout>

  <div v-else class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50/30 flex items-center justify-center p-6">
    <div class="max-w-md w-full">
      <BaseCard>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('unauthorized.title') }}</h1>
        <p class="mt-2 text-gray-600">{{ t('unauthorized.message') }}</p>

        <div class="mt-6 flex gap-3">
          <BaseButton variant="primary" @click="goLogin">
            {{ t('unauthorized.goLogin') }}
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
