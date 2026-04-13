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
      </div>
    </template>

    <template #cell-start_at="{ value }">
      {{ formatDateCustom(value) }}
    </template>

    <template #cell-end_at="{ value }">
      {{ formatDateCustom(value) }}
    </template>

    <template #cell-status="{ item }">
      <span
        class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
        :class="{
          'bg-amber-100 text-amber-800': getReservationDisplayStatus(item) === 'pending',
          'bg-cyan-100 text-cyan-800': getReservationDisplayStatus(item) === 'in_progress',
          'bg-emerald-100 text-emerald-800': item.status === 'active',
          'bg-blue-100 text-blue-800': item.status === 'completed',
          'bg-red-100 text-red-800': item.status === 'cancelled',
        }"
      >
        {{ $t(`reservations.status.${getReservationDisplayStatus(item)}`) }}
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
          v-if="canCancelReservation(item)"
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
const { formatDateTime: _ } = useDateFormatter();

const formatDateCustom = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Format time remaining as "Xh Ym" (horas y minutos, sin decimales ni segundos)
const formatTimeRemaining = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const canCancelReservation = (item: ReservationLog): boolean => {
  // No se puede cancelar si ya está expirada
  if (item.is_expired) return false;
  
  // No se puede cancelar si ya ha comenzado
  const now = new Date();
  const startDate = new Date(item.start_at);
  if (Number.isNaN(startDate.getTime())) return false;
  
  // Solo se puede cancelar si aún no ha comenzado
  return startDate > now;
};

const getReservationDisplayStatus = (item: ReservationLog): string => {
  const now = new Date();
  const startDate = new Date(item.start_at);
  const endDate = new Date(item.end_at);
  
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return item.status;
  }
  
  // Si ya ha comenzado y aún no ha terminado, está en curso
  if (startDate <= now && now < endDate) {
    return 'in_progress';
  }
  
  return item.status;
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
