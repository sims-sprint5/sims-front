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
        <div class="font-medium text-gray-900">{{ item.user_name }}</div>
        <div class="text-xs text-gray-500">#{{ item.user_id ?? 'N/A' }}</div>
      </div>
    </template>

    <template #cell-vehicle_id="{ item }">
      <div class="min-w-0">
        <div class="font-medium text-gray-900">{{ item.vehicle_name }}</div>
        <div class="text-xs text-gray-500">{{ item.license_plate }} · #{{ item.vehicle_id }}</div>
      </div>
    </template>

    <template #cell-status="{ value }">
      <span
        class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="value === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'"
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

const { t } = useI18n();
const { formatDate } = useDateFormatter();

const columns = computed<TableColumn[]>(() => [
  { key: 'log_type', label: t('reservations.table.logType'), align: 'left' },
  { key: 'user_id', label: t('reservations.table.userId'), align: 'left' },
  { key: 'vehicle_id', label: t('reservations.table.vehicleId'), align: 'left' },
  { key: 'status', label: t('reservations.table.status'), align: 'left' },
  { key: 'start_at', label: t('reservations.table.startAt'), align: 'left' },
  { key: 'end_at', label: t('reservations.table.endAt'), align: 'left' },
  { key: 'created_at', label: t('reservations.table.createdAt'), align: 'left' },
]);
</script>