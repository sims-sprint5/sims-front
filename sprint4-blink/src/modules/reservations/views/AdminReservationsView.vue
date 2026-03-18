<template>
  <AppLayout :title="$t('reservations.title')">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <p class="mt-2 text-sm text-gray-600">
          {{ $t('reservations.description') }}
        </p>
      </div>

      <div class="mb-6 rounded-lg bg-white p-4 shadow">
        <div class="flex flex-col gap-4 sm:flex-row">
          <div class="flex-1">
            <BaseInput
              v-model="searchQuery"
              type="search"
              :placeholder="$t('reservations.searchPlaceholder')"
              @input="handleSearch"
            />
          </div>

          <BaseButton variant="secondary" class="w-full sm:w-auto" @click="handleRefresh">
            {{ $t('filters.clear') }}
          </BaseButton>
        </div>
      </div>

      <ReservationLogTable :logs="logs" :loading="loading" />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { BaseButton, BaseInput } from '@/components/base';
import AppLayout from '@/layouts/AppLayout.vue';
import ReservationLogTable from '@/modules/reservations/components/ReservationLogTable.vue';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';
import { useToast } from '@/shared/composables/useToast';
import { useDebouncedSearch } from '@/shared/composables/useDebouncedSearch';

const { t } = useI18n();
const toast = useToast();
const { run: runDebouncedSearch } = useDebouncedSearch(200);

const logs = ref<ReservationLog[]>([]);
const loading = ref(false);
const searchQuery = ref('');

async function loadLogs() {
  loading.value = true;

  try {
    logs.value = await reservationLogService.getLogs();
  } catch {
    toast.error(t('reservations.errors.load'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  runDebouncedSearch(async () => {
    loading.value = true;

    try {
      logs.value = await reservationLogService.searchLogs(searchQuery.value);
    } catch {
      toast.error(t('reservations.errors.search'));
    } finally {
      loading.value = false;
    }
  });
}

function handleRefresh() {
  searchQuery.value = '';
  loadLogs();
}

onMounted(() => {
  loadLogs();
});
</script>