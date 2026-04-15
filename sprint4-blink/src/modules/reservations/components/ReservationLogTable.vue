<template>
  <BaseTable
    :columns="columns"
    :data="logs"
    :loading="loading"
    :loadingText="$t('reservations.loading')"
    :emptyText="$t('reservations.empty')"
    :perPage="8"
  >
    <template #cell-log_type="{ value }">
      <span class="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
        {{ $t(`reservations.log.${value}`) }}
      </span>
    </template>

    <template #cell-user_id="{ item }">
      <div class="min-w-0">
        <div class="font-medium text-main">{{ item.user_name }}</div>
        <div class="text-xs text-muted">#{{ item.user_id ?? 'N/A' }}</div>
      </div>
    </template>

    <template #cell-vehicle_id="{ item }">
      <button
        type="button"
        class="min-w-0 text-left hover:underline focus:outline-none"
        @click="$emit('select-row', item)"
      >
        <div class="font-medium text-blue-600">{{ item.vehicle_name }}</div>
        <div class="text-xs text-muted">{{ item.license_plate }} · #{{ item.vehicle_id }}</div>
      </button>
    </template>

    <template #cell-status="{ value }">
      <span
        class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="{
          'bg-amber-100 text-amber-800': value === 'pending',
          'bg-emerald-100 text-emerald-800': value === 'active',
          'bg-blue-100 text-blue-800': value === 'completed',
          'bg-red-100 text-red-800': value === 'cancelled',
        }"
      >
        {{ $t(`reservations.status.${value}`) }}
      </span>
    </template>

    <template #cell-start_at="{ value }">
      {{ formatDate(value) }}
    </template>

    <template #cell-end_at="{ value }">
      {{ formatDate(value) }}
    </template>

    <template #cell-created_at="{ value }">
      {{ formatDate(value) }}
    </template>

    <template #cell-minutes_remaining="{ value, item }">
      <div v-if="item.is_expired" class="text-xs font-semibold text-red-600">
        {{ $t('reservations.table.expired') }}
      </div>
      <div v-else-if="value !== undefined && value >= 0" class="text-xs font-semibold text-blue-600">
        {{ formatTimeRemaining(value) }}
      </div>
      <div v-else class="text-xs text-muted">—</div>
    </template>

    <template #cell-renewal="{ item }">
      <div v-if="item.renewal_notice" class="flex items-center gap-2">
        <svg class="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="text-xs font-medium text-yellow-700">{{ item.renewal_notice }}</span>
      </div>
      <div v-else class="text-xs text-muted">—</div>
    </template>

    <template #cell-actions="{ item }">
      <div class="flex gap-2">
        <router-link
          v-if="item.status === 'completed' && item.can_renew"
          :to="{ name: 'ReservationCompleted', params: { id: item.id } }"
          class="inline-flex items-center gap-1 rounded-md bg-base px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 1119.414 9.414 1 1 0 11-1.414-1.414 5 5 0 10-9.172-5.814H9a1 1 0 110-2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          {{ $t('reservations.table.renew') }}
        </router-link>
        <button
          v-else-if="item.can_renew"
          class="inline-flex items-center gap-1 rounded-md bg-base px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          @click="$emit('renew', item)"
        >
          <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 1119.414 9.414 1 1 0 11-1.414-1.414 5 5 0 10-9.172-5.814H9a1 1 0 110-2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          {{ $t('reservations.table.renew') }}
        </button>
      </div>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { BaseTable } from '@/components/base';
import type { TableColumn } from '@/components/base/BaseTable.vue';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

interface Props {
  logs?: ReservationLog[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  logs: () => [],
  loading: false,
});

defineEmits<{
  renew: [item: ReservationLog];
  'select-row': [item: ReservationLog];
}>();

const { t } = useI18n();
const { formatDate } = useDateFormatter();

// Format time remaining as "Xh Ym" (horas y minutos, sin decimales ni segundos)
const formatTimeRemaining = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const columns = computed<TableColumn[]>(() => [
  { key: 'log_type', label: t('reservations.table.logType'), align: 'left' },
  { key: 'user_id', label: t('reservations.table.userId'), align: 'left' },
  { key: 'vehicle_id', label: t('reservations.table.vehicleId'), align: 'left' },
  { key: 'status', label: t('reservations.table.status'), align: 'left' },
  { key: 'start_at', label: t('reservations.table.startAt'), align: 'left' },
  { key: 'end_at', label: t('reservations.table.endAt'), align: 'left' },
  { key: 'minutes_remaining', label: t('reservations.table.timeRemaining'), align: 'center' },
  { key: 'renewal', label: t('reservations.table.renewal'), align: 'left' },
  { key: 'actions', label: t('reservations.table.actions'), align: 'center', sortable: false },
]);
</script>