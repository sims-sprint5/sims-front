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
          class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          :class="`bg-status-${getReservationDisplayStatus(reservation)}-bg text-status-${getReservationDisplayStatus(reservation)}-text`"
        >
          {{ $t(`reservations.status.${getReservationDisplayStatus(reservation)}`) }}
        </span>
      </div>

      <!-- Renewal Notice -->
      <div v-if="reservation.renewal_notice" class="rounded-lg bg-yellow-50 p-3">
        <p class="text-xs text-yellow-800">
          <strong>⚠️ {{ $t('reservations.myReservations.notice') }}:</strong> {{ reservation.renewal_notice }}
        </p>
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
import { BaseButton } from '@/components/base';
import CustomModal from '@/modules/mapa/components/CustomModal.vue';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

interface Props {
  show: boolean;
  reservation: ReservationLog;
}

defineProps<Props>();
defineEmits<{
  close: [];
  cancel: [reservation: ReservationLog];
}>();

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

const canCancelReservation = (reservation: ReservationLog): boolean => {
  // Cannot be cancelled if it has already expired
  if (reservation.is_expired) return false;
  
  // Cannot be cancelled if it has already started
  const now = new Date();
  const startDate = new Date(reservation.start_at);
  if (Number.isNaN(startDate.getTime())) return false;
  
  // Can only be cancelled if it hasn't started yet
  return startDate > now;
};

const getReservationDisplayStatus = (reservation: ReservationLog): string => {
  const now = new Date();
  const startDate = new Date(reservation.start_at);
  const endDate = new Date(reservation.end_at);
  
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return reservation.status;
  }
  
  // If it has already started and hasn't finished, it is in progress
  if (startDate <= now && now < endDate) {
    return 'in_progress';
  }
  
  return reservation.status;
};
</script>
