import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';

interface TemperatureData {
  temperature_c: number;
  voltage: number;
  adc_value: number;
  timestamp: string;
}

const activeReservation = ref<ReservationLog | null>(null);
const temperature = ref<TemperatureData | null>(null);
const temperatureLoading = ref(false);
const actionLoading = ref(false);

let tempInterval: ReturnType<typeof setInterval> | null = null;
let resInterval: ReturnType<typeof setInterval> | null = null;
let instanceCount = 0;

function isActive(r: ReservationLog): boolean {
  if (r.status === 'cancelled') return false;
  const now = new Date();
  const start = new Date(r.start_at);
  const end = new Date(r.end_at);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && now >= start && now <= end;
}

async function refreshActiveReservation() {
  try {
    const reservations = await reservationLogService.getMyReservations(1, 50);
    activeReservation.value = reservations.find(isActive) ?? null;
  } catch {
    activeReservation.value = null;
  }
}

async function refreshTemperature() {
  if (!activeReservation.value) return;
  temperatureLoading.value = true;
  try {
    temperature.value = await reservationLogService.getLatestTemperature(activeReservation.value.id);
  } finally {
    temperatureLoading.value = false;
  }
}

async function sendAction(action: 'on' | 'off'): Promise<string> {
  if (!activeReservation.value || actionLoading.value) return '';
  actionLoading.value = true;
  try {
    const res = await reservationLogService.sendVehicleAction(activeReservation.value.id, action);
    return res.message;
  } finally {
    actionLoading.value = false;
  }
}

export function useVehicleControl() {
  onMounted(async () => {
    instanceCount += 1;
    if (instanceCount === 1) {
      await refreshActiveReservation();
      await refreshTemperature();
      resInterval = setInterval(async () => {
        await refreshActiveReservation();
      }, 30_000);
      tempInterval = setInterval(async () => {
        await refreshTemperature();
      }, 5_000);
    }
  });

  onBeforeUnmount(() => {
    instanceCount -= 1;
    if (instanceCount === 0) {
      if (tempInterval) { clearInterval(tempInterval); tempInterval = null; }
      if (resInterval) { clearInterval(resInterval); resInterval = null; }
    }
  });

  return {
    activeReservation: computed(() => activeReservation.value),
    temperature: computed(() => temperature.value),
    temperatureLoading: computed(() => temperatureLoading.value),
    actionLoading: computed(() => actionLoading.value),
    hasActiveReservation: computed(() => activeReservation.value !== null),
    sendAction,
    refreshTemperature,
  };
}
