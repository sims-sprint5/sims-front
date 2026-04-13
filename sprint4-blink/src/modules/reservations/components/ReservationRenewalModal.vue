<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="true"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click.self="$emit('close')"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ $t('reservations.renewal.title') }}
            </h2>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-6">
            <p class="text-sm text-gray-600">
              {{ $t('reservations.renewal.description', { vehicleName: reservation.vehicle_name }) }}
            </p>

            <!-- Reservation Summary -->
            <div class="space-y-3 rounded-lg bg-blue-50 p-4">
              <div class="space-y-1">
                <p class="text-xs font-medium uppercase text-gray-600">{{ $t('reservations.renewal.vehicle') }}</p>
                <p class="font-semibold text-gray-900">{{ reservation.vehicle_name }}</p>
                <p class="text-xs text-gray-600">{{ reservation.license_plate }}</p>
              </div>

              <div class="pt-2">
                <p class="text-xs font-medium uppercase text-gray-600">{{ $t('reservations.renewal.currentEnd') }}</p>
                <p class="font-semibold text-gray-900">{{ formatDateTime(reservation.end_at) }}</p>
              </div>

              <div v-if="reservation.minutes_remaining && reservation.minutes_remaining > 0" class="pt-2">
                <p class="text-xs font-medium uppercase text-gray-600">{{ $t('reservations.renewal.timeRemaining') }}</p>
                <p class="font-semibold text-green-600">{{ formatTimeRemaining(reservation.minutes_remaining) }}</p>
              </div>
            </div>

            <!-- Renewal Notice -->
            <div v-if="renewalNotice" class="rounded-lg bg-yellow-50 p-4">
              <p class="text-sm text-yellow-800">
                <strong>{{ $t('reservations.renewal.notice') }}:</strong> {{ renewalNotice }}
              </p>
            </div>

            <!-- Payment Info -->
            <div class="space-y-2 border-t pt-4">
              <p class="text-sm font-medium text-gray-900">{{ $t('reservations.renewal.proceedInfo') }}</p>
              <p class="text-xs text-gray-600">{{ $t('reservations.renewal.paymentInfo') }}</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 border-t pt-4">
              <BaseButton variant="secondary" block @click="$emit('close')">
                {{ $t('common.cancel') }}
              </BaseButton>
              <BaseButton block @click="$emit('proceed')">
                {{ $t('reservations.renewal.proceed') }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { BaseButton } from '@/components/base';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

interface Props {
  reservation: ReservationLog;
  paymentUrl: string;
  renewalNotice: string | null;
}

defineProps<Props>();
defineEmits<{
  close: [];
  proceed: [];
}>();

const { t } = useI18n();
const { formatDateTime } = useDateFormatter();

const renewalNotice = computed(() => {
  // Puede venir en los props
  return null;
});

function formatTimeRemaining(minutes: number): string {
  if (minutes < 60) {
    return t('reservations.renewal.minutesRemaining', { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return t('reservations.renewal.hoursMinutesRemaining', { hours, minutes: mins });
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
