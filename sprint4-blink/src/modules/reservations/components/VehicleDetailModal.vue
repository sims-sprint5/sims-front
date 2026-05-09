<template>
  <CustomModal :show="show" :title="$t('reservations.myReservations.vehicleDetails')" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Vehicle Info -->
      <div class="space-y-3 border-b pb-4">
        <div>
          <p class="text-xs font-medium uppercase text-muted">{{ $t('reservations.myReservations.vehicle') }}</p>
          <h3 class="text-lg font-semibold text-main">{{ reservation.vehicle_name || `Vehicle #${reservation.vehicle_id}` }}</h3>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-muted">{{ $t('reservations.myReservations.licensePlate') }}</p>
          <p class="font-mono text-main">{{ reservation.license_plate || '—' }}</p>
        </div>
      </div>

      <!-- Dates -->
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-xs font-medium uppercase text-muted">{{ $t('reservations.myReservations.startDate') }}</p>
            <p class="text-sm text-main">{{ formatDateCustom(reservation.start_at) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-muted">{{ $t('reservations.myReservations.endDate') }}</p>
            <p class="text-sm text-main">{{ formatDateCustom(reservation.end_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Locations -->
      <div v-if="reservation.pickup_location || reservation.dropoff_location" class="space-y-2 border-t border-b py-3">
        <div v-if="reservation.pickup_location">
          <p class="text-xs font-medium uppercase text-muted">{{ $t('reservations.myReservations.pickupLocation') }}</p>
          <p class="text-sm text-main">📍 {{ reservation.pickup_location }}</p>
        </div>
        <div v-if="reservation.dropoff_location">
          <p class="text-xs font-medium uppercase text-muted">{{ $t('reservations.myReservations.dropoffLocation') }}</p>
          <p class="text-sm text-main">📍 {{ reservation.dropoff_location }}</p>
        </div>
      </div>

      <!-- Status -->
      <div class="space-y-2">
        <p class="text-xs font-medium uppercase text-muted">{{ $t('reservations.myReservations.status') }}</p>
        <span
          class="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800"
        >
          Completat
        </span>
      </div>

      <!-- Renewal Notice -->
      <div v-if="reservation.renewal_notice" class="rounded-lg bg-yellow-50 p-3">
        <p class="text-xs text-yellow-800">
          <strong>⚠️ {{ $t('reservations.myReservations.notice') }}:</strong> {{ reservation.renewal_notice }}
        </p>
      </div>

      <!-- Temperature sensor widget (only during active reservation) -->
      <div v-if="isReservationActive" class="rounded-lg border border-default bg-surface p-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-semibold uppercase text-muted">{{ $t('reservations.temperature.title') }}</p>
          <button
            class="text-xs text-primary hover:underline disabled:opacity-50"
            :disabled="temperatureLoading"
            @click="fetchTemperature"
          >{{ temperatureLoading ? '...' : $t('reservations.temperature.refresh') }}</button>
        </div>
        <div v-if="temperature" class="flex items-end gap-1">
          <span class="text-4xl font-bold text-main">{{ temperature.temperature_c.toFixed(1) }}</span>
          <span class="mb-1 text-lg text-muted">°C</span>
        </div>
        <div v-else-if="!temperatureLoading" class="text-sm text-muted">{{ $t('reservations.temperature.noData') }}</div>
        <div v-if="temperature" class="mt-1 text-xs text-muted">
          {{ $t('reservations.temperature.voltage') }}: {{ temperature.voltage.toFixed(2) }}V
        </div>
      </div>

      <!-- Actuator: Start / Stop (only during active reservation period) -->
      <div v-if="isReservationActive" class="rounded-lg border border-default bg-surface p-4">
        <p class="mb-3 text-xs font-semibold uppercase text-muted">{{ $t('reservations.actuator.title') }}</p>
        <div class="flex gap-3">
          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="actuatorLoading"
            @click="sendAction('on')"
          >
            <span v-if="actuatorLoading && pendingAction === 'on'" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span v-else>▶</span>
            {{ $t('reservations.actuator.start') }}
          </button>
          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="actuatorLoading"
            @click="sendAction('off')"
          >
            <span v-if="actuatorLoading && pendingAction === 'off'" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span v-else>■</span>
            {{ $t('reservations.actuator.stop') }}
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 border-t pt-4">
        <BaseButton
          v-if="canCancelReservation(reservation)"
          variant="warning"
          size="sm"
          block
          @click="$emit('cancel', reservation)"
        >
          ✕ {{ $t('reservations.myReservations.cancel') }}
        </BaseButton>
      </div>
    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseButton } from '@/components/base';
import CustomModal from '@/modules/mapa/components/CustomModal.vue';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import { useToast } from '@/shared/composables/useToast';

interface Props {
  show: boolean;
  reservation: ReservationLog;
}

const props = defineProps<Props>();
defineEmits<{
  close: [];
  cancel: [reservation: ReservationLog];
}>();

const { t } = useI18n();
const toast = useToast();
const { formatDateTime: _ } = useDateFormatter();

const currentTime = ref(new Date());
const actuatorLoading = ref(false);
const pendingAction = ref<'on' | 'off' | null>(null);
const temperature = ref<{ temperature_c: number; voltage: number; adc_value: number; timestamp: string } | null>(null);
const temperatureLoading = ref(false);
let clockInterval: ReturnType<typeof setInterval> | null = null;
let tempInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  clockInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 30_000);
  if (isReservationActive.value) {
    fetchTemperature();
    tempInterval = setInterval(fetchTemperature, 30_000);
  }
});

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval);
  if (tempInterval) clearInterval(tempInterval);
});

async function fetchTemperature() {
  temperatureLoading.value = true;
  try {
    temperature.value = await reservationLogService.getLatestTemperature(props.reservation.id);
  } finally {
    temperatureLoading.value = false;
  }
}

const isReservationActive = computed(() => {
  if (props.reservation.status === 'cancelled') return false;
  const start = new Date(props.reservation.start_at);
  const end = new Date(props.reservation.end_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return currentTime.value >= start && currentTime.value <= end;
});

async function sendAction(action: 'on' | 'off') {
  if (actuatorLoading.value) return;
  actuatorLoading.value = true;
  pendingAction.value = action;
  try {
    const res = await reservationLogService.sendVehicleAction(props.reservation.id, action);
    toast.success(res.message || t(`reservations.actuator.success.${action}`));
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? err?.message ?? t('reservations.actuator.error');
    toast.error(msg);
  } finally {
    actuatorLoading.value = false;
    pendingAction.value = null;
  }
}

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

const canCancelReservation = (reservation: ReservationLog): boolean => {
  if (reservation.is_expired) return false;
  const now = new Date();
  const startDate = new Date(reservation.start_at);
  if (Number.isNaN(startDate.getTime())) return false;
  return startDate > now;
};
</script>
