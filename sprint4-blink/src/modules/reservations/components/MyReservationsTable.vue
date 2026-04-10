<template>
  <BaseTable
    :columns="columns"
    :data="reservations"
    :loading="loading"
    :loadingText="$t('reservations.loading')"
    :emptyText="$t('reservations.empty')"
    :perPage="8"
  >
    <template #cell-vehicle_id="{ item }">
      <div class="space-y-1">
        <div class="font-medium text-gray-900">{{ item.vehicle_name }}</div>
        <div class="text-xs text-gray-500">{{ item.license_plate }}</div>
        <button
          type="button"
          class="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          @click="$emit('view-vehicle', item)"
        >
          {{ $t('reservations.myReservations.viewVehicleDetails') }}
        </button>
      </div>
    </template>

    <template #cell-start_at="{ value }">
      {{ formatDateTime(value) }}
    </template>

    <template #cell-end_at="{ value }">
      {{ formatDateTime(value) }}
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

    <template #cell-minutes_remaining="{ value, item }">
      <div v-if="item.is_expired" class="text-xs font-semibold text-red-600">
        {{ $t('reservations.table.expired') }}
      </div>
      <div v-else-if="value !== undefined && value >= 0" class="text-xs font-semibold">
        <span class="text-blue-600">{{ formatTimeRemaining(value) }}</span>
      </div>
      <div v-else class="text-xs text-gray-500">—</div>
    </template>

    <template #cell-actions="{ item }">
      <div class="flex gap-2 justify-end">
        <button
          @click="$emit('view-vehicle', item)"
          class="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          :title="$t('common.view')"
        >
          <EyeIcon class="w-5 h-5" />
        </button>
        <button
          v-if="!item.is_expired"
          @click="$emit('edit', item)"
          class="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
          :title="$t('common.edit')"
        >
          <PencilIcon class="w-5 h-5" />
        </button>
        <button
          v-if="!item.is_expired"
          @click="$emit('delete', item)"
          class="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
          :title="$t('reservations.myReservations.cancel')"
        >
          <TrashIcon class="w-5 h-5" />
        </button>
        <button
          v-if="item.can_renew"
          @click="$emit('renew', item)"
          class="p-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
          :title="$t('reservations.table.renew')"
        >
          <ArrowPathIcon class="w-5 h-5" />
        </button>
      </div>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EyeIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';

import { BaseTable } from '@/components/base';
import type { TableColumn } from '@/components/base/BaseTable.vue';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

interface Props {
  reservations?: ReservationLog[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  reservations: () => [],
  loading: false,
});

defineEmits<{
  'view-vehicle': [item: ReservationLog];
  edit: [item: ReservationLog];
  delete: [item: ReservationLog];
  renew: [item: ReservationLog];
}>();

const { t } = useI18n();
const { formatDateTime } = useDateFormatter();

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
  { key: 'vehicle_id', label: t('reservations.myReservations.vehicleColumn'), align: 'left' },
  { key: 'start_at', label: t('reservations.table.startAt'), align: 'left' },
  { key: 'end_at', label: t('reservations.table.endAt'), align: 'left' },
  { key: 'status', label: t('reservations.table.status'), align: 'left' },
  { key: 'minutes_remaining', label: t('reservations.table.timeRemaining'), align: 'center' },
  { key: 'actions', label: t('reservations.table.actions'), align: 'right', sortable: false },
]);
</script>
