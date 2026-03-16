<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUser } from '@/modules/auth/composables/useUser';
import { useToast } from '@/shared/composables/useToast';
import AppLayout from '@/layouts/AppLayout.vue';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const toast = useToast();
const { t } = useI18n();
const { user, loadUser } = useUser();
const isLoading = ref(true);

onMounted(async () => {
  try {
    await loadUser();
  } catch {
    toast.error(t('auth.sessionExpired'));
    router.push('/login');
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <AppLayout :title="$t('dashboard.title')">
    <main class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="isLoading" class="bg-white rounded-lg shadow-lg p-8">
        <div class="flex justify-center items-center h-40">
          <div class="text-gray-500">{{ $t('common.loading') }}</div>
        </div>
      </div>
      <div v-else class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          {{ $t('dashboard.welcome') }}
        </h2>

        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              {{ $t('dashboard.userInfo') }}
            </h3>
            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><span class="font-medium">{{ $t('dashboard.user.name') }}:</span> {{ user?.name || '-' }}</p>
              <p><span class="font-medium">{{ $t('dashboard.user.email') }}:</span> {{ user?.email || '-' }}</p>
              <p><span class="font-medium">{{ $t('dashboard.user.phone') }}:</span> {{ user?.phone || '-' }}</p>
              <p><span class="font-medium">{{ $t('dashboard.user.role') }}:</span> {{ user?.role ? $t(`roles.${user.role}`) : '-' }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </AppLayout>
</template>
