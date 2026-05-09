<template>
  <div v-if="hasActiveReservation" class="mx-2 mb-3 rounded-lg border border-white/10 bg-white/5 p-3">
    <!-- Collapsed: just show temp icon -->
    <template v-if="isCollapsed">
      <div class="flex flex-col items-center gap-1">
        <span class="text-xs font-bold text-inverse">
          {{ temperature ? `${temperature.temperature_c.toFixed(0)}°` : '—' }}
        </span>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          :disabled="actionLoading"
          :title="$t('reservations.actuator.start')"
          @click="handleAction('on')"
        >▶</button>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          :disabled="actionLoading"
          :title="$t('reservations.actuator.stop')"
          @click="handleAction('off')"
        >■</button>
      </div>
    </template>

    <!-- Expanded: full widget -->
    <template v-else>
      <p class="mb-2 text-xs font-semibold uppercase text-white/50">{{ $t('reservations.temperature.title') }}</p>

      <!-- Temperature -->
      <div class="mb-3 flex items-end gap-1">
        <span v-if="temperature" class="text-3xl font-bold text-inverse">
          {{ temperature.temperature_c.toFixed(1) }}
        </span>
        <span v-if="temperature" class="mb-0.5 text-base text-white/60">°C</span>
        <span v-else class="text-sm text-white/40">{{ $t('reservations.temperature.noData') }}</span>
        <span v-if="temperatureLoading" class="ml-1 h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
      </div>

      <!-- Actuator buttons -->
      <p class="mb-1.5 text-xs font-semibold uppercase text-white/50">{{ $t('reservations.actuator.title') }}</p>
      <div class="flex gap-2">
        <button
          class="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-green-600 py-2 text-xs font-semibold text-white hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="actionLoading"
          @click="handleAction('on')"
        >
          <span v-if="actionLoading && pendingAction === 'on'" class="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
          <span v-else>▶</span>
          {{ $t('reservations.actuator.start') }}
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="actionLoading"
          @click="handleAction('off')"
        >
          <span v-if="actionLoading && pendingAction === 'off'" class="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
          <span v-else>■</span>
          {{ $t('reservations.actuator.stop') }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useVehicleControl } from '@/shared/composables/useVehicleControl';
import { useToast } from '@/shared/composables/useToast';

defineProps<{ isCollapsed: boolean }>();

const { t } = useI18n();
const toast = useToast();
const { hasActiveReservation, temperature, temperatureLoading, actionLoading, sendAction } = useVehicleControl();

const pendingAction = ref<'on' | 'off' | null>(null);

async function handleAction(action: 'on' | 'off') {
  pendingAction.value = action;
  try {
    const msg = await sendAction(action);
    toast.success(msg || t(`reservations.actuator.success.${action}`));
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? err?.message ?? t('reservations.actuator.error');
    toast.error(msg);
  } finally {
    pendingAction.value = null;
  }
}
</script>
