<template>
  <!-- Desktop: Tabla normal -->
  <div class="hidden md:block">
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
          <div class="font-medium text-main">{{ item.vehicle_name }}</div>
          <div class="text-xs text-muted">{{ item.license_plate }}</div>
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
            'bg-amber-100 text-warning-dark': getReservationDisplayStatus(item) === 'pending',
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
        <div v-if="item.is_expired" class="text-xs font-semibold text-danger">
          {{ $t('reservations.table.expired') }}
        </div>
        <div v-else-if="value !== undefined && value >= 0" class="text-xs font-semibold">
          <span class="text-primary">{{ formatTimeRemaining(value) }}</span>
        </div>
        <div v-else class="text-xs text-muted">—</div>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex gap-2 justify-end">
          <BaseTooltip :text="$t('common.view')">
            <button
              @click="$emit('view-vehicle', item)"
              class="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <EyeIcon class="w-5 h-5" />
            </button>
          </BaseTooltip>
          <button
            v-if="!item.is_expired && getReservationDisplayStatus(item) !== 'completed'"
            @click="$emit('edit', item)"
            class="px-3 py-2 bg-success text-inverse text-sm font-medium hover:brightness-110 rounded-lg transition-colors"
            :title="$t('reservations.buttons.expandButton')"
          >
            {{ $t('reservations.buttons.expandButton') }}
          </button>
          <BaseTooltip :text="$t('reservations.myReservations.cancel')" v-if="canCancelReservation(item)">
            <button
              @click="$emit('delete', item)"
              class="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              <TrashIcon class="w-5 h-5" />
            </button>
          </BaseTooltip>
        </div>
      </template>
    </BaseTable>
  </div>

  <!-- Mobile: Cards -->
  <div class="md:hidden space-y-4">
    <div v-if="loading" class="text-center py-8 text-muted">
      {{ $t('reservations.loading') }}
    </div>
    <div v-else-if="reservations.length === 0" class="text-center py-8 text-muted">
      {{ $t('reservations.empty') }}
    </div>
    <div v-else v-for="item in reservations" :key="item.id" class="bg-surface rounded-lg border border-default p-4 shadow-sm">
      <!-- Vehicle Info -->
      <div class="mb-3 pb-3 border-b border-default">
        <div class="font-semibold text-main">{{ item.vehicle_name }}</div>
        <div class="text-xs text-muted">{{ item.license_plate }}</div>
      </div>

      <!-- Reservation Dates -->
      <div class="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-default">
        <div>
          <div class="text-xs font-medium text-muted">{{ $t('reservations.table.startAt') }}</div>
          <div class="text-sm font-medium text-main">{{ formatDateCustom(item.start_at) }}</div>
        </div>
        <div>
          <div class="text-xs font-medium text-muted">{{ $t('reservations.table.endAt') }}</div>
          <div class="text-sm font-medium text-main">{{ formatDateCustom(item.end_at) }}</div>
        </div>
      </div>

      <!-- Status & Time -->
      <div class="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-default">
        <div>
          <div class="text-xs font-medium text-muted">{{ $t('reservations.table.status') }}</div>
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold mt-1"
            :class="{
              'bg-amber-100 text-warning-dark': getReservationDisplayStatus(item) === 'pending',
              'bg-cyan-100 text-cyan-800': getReservationDisplayStatus(item) === 'in_progress',
              'bg-emerald-100 text-emerald-800': item.status === 'active',
              'bg-blue-100 text-blue-800': item.status === 'completed',
              'bg-red-100 text-red-800': item.status === 'cancelled',
            }"
          >
            {{ $t(`reservations.status.${getReservationDisplayStatus(item)}`) }}
          </span>
        </div>
        <div>
          <div class="text-xs font-medium text-muted">{{ $t('reservations.table.timeRemaining') }}</div>
          <div v-if="item.is_expired" class="text-sm font-semibold text-danger mt-1">
            {{ $t('reservations.table.expired') }}
          </div>
          <div v-else-if="item.minutes_remaining !== undefined && item.minutes_remaining >= 0" class="text-sm font-semibold text-primary mt-1">
            {{ formatTimeRemaining(item.minutes_remaining) }}
          </div>
          <div v-else class="text-sm text-muted mt-1">—</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <BaseTooltip :text="$t('common.view')" :full-width="true">
          <button
            @click="$emit('view-vehicle', item)"
            class="flex-1 p-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <EyeIcon class="w-4 h-4" />
            {{ $t('common.view') }}
          </button>
        </BaseTooltip>
        <button
          v-if="!item.is_expired && getReservationDisplayStatus(item) !== 'completed'"
          @click="$emit('edit', item)"
          class="flex-1 p-2 bg-success text-inverse text-sm font-medium hover:brightness-110 rounded-lg transition-colors"
        >
          {{ $t('reservations.buttons.expandButton') }}
        </button>
        <BaseTooltip :text="$t('reservations.myReservations.cancel')" :full-width="true" v-if="canCancelReservation(item)">
          <button
            @click="$emit('delete', item)"
            class="flex-1 p-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <TrashIcon class="w-4 h-4" />
            {{ $t('common.delete') }}
          </button>
        </BaseTooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EyeIcon, TrashIcon } from '@heroicons/vue/24/outline';

import { BaseTable, BaseTooltip } from '@/components/base';
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
