<template>
  <CustomModal :show="show" :title="$t('reservations.actuator.title')" @close="$emit('close')">
    <div class="space-y-5">

      <!-- Reservation info -->
      <div class="rounded-lg bg-surface-muted px-4 py-2 text-sm text-muted">
        <span class="font-semibold text-main">{{ reservation.vehicle_name }}</span>
        &nbsp;·&nbsp;{{ formatDate(reservation.start_at) }} – {{ formatDate(reservation.end_at) }}
      </div>

      <!-- Not-started notice -->
      <div v-if="!withinPeriod" class="rounded-lg bg-yellow-500/10 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
        {{ $t('reservations.actuator.notStarted') }}
      </div>

      <!-- Temperature -->
      <div>
        <p class="mb-2 text-xs font-semibold uppercase text-muted">{{ $t('reservations.temperature.title') }}</p>
        <div class="flex items-end gap-2">
          <template v-if="temperature">
            <span class="text-4xl font-bold text-main">{{ temperature.temperature_c.toFixed(1) }}</span>
            <span class="mb-1 text-lg text-muted">°C</span>
            <span class="mb-1 text-xs text-muted">· {{ temperature.voltage.toFixed(2) }} V</span>
          </template>
          <span v-else class="text-sm text-muted">{{ $t('reservations.temperature.noData') }}</span>
          <span v-if="loading" class="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
        </div>
      </div>

      <!-- Actuator buttons -->
      <div>
        <p class="mb-2 text-xs font-semibold uppercase text-muted">{{ $t('reservations.actuator.control') }}</p>
        <div class="flex gap-3">
          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            :disabled="actionLoading || !withinPeriod"
            @click="doAction('on')"
          >
            <span v-if="actionLoading && pendingAction === 'on'" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span v-else>▶</span>
            {{ $t('reservations.actuator.start') }}
          </button>
          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            :disabled="actionLoading || !withinPeriod"
            @click="doAction('off')"
          >
            <span v-if="actionLoading && pendingAction === 'off'" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span v-else>■</span>
            {{ $t('reservations.actuator.stop') }}
          </button>
        </div>
      </div>

    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CustomModal from '@/modules/mapa/components/CustomModal.vue';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import { useToast } from '@/shared/composables/useToast';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';

interface Props {
  show: boolean;
  reservation: ReservationLog;
}

const props = defineProps<Props>();
defineEmits<{ close: [] }>();

const { t } = useI18n();
const toast = useToast();

const temperature = ref<{ temperature_c: number; voltage: number } | null>(null);
const loading = ref(false);
const actionLoading = ref(false);
const pendingAction = ref<'on' | 'off' | null>(null);
let pollInterval: ReturnType<typeof setInterval> | null = null;

const withinPeriod = computed(() => {
  const now = new Date();
  const start = new Date(props.reservation.start_at);
  const end = new Date(props.reservation.end_at);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && now >= start && now <= end;
});

async function fetchTemperature() {
  loading.value = true;
  try {
    temperature.value = await reservationLogService.getLatestTemperature(props.reservation.id);
  } finally {
    loading.value = false;
  }
}

async function doAction(action: 'on' | 'off') {
  pendingAction.value = action;
  actionLoading.value = true;
  try {
    const res = await reservationLogService.sendVehicleAction(props.reservation.id, action);
    toast.success(res.message || t(`reservations.actuator.success.${action}`));
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? err?.message ?? t('reservations.actuator.error'));
  } finally {
    actionLoading.value = false;
    pendingAction.value = null;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

watch(() => props.show, (open) => {
  if (open) {
    fetchTemperature();
    pollInterval = setInterval(fetchTemperature, 5_000);
  } else {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    temperature.value = null;
  }
});

onUnmounted(() => {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
});
</script>
