<template>
  <CustomModal :show="show" :title="$t('reservations.myReservations.vehicleDetails')" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Vehicle Info -->
      <div class="space-y-3 border-b pb-4">
        <div>
          <p class="text-xs font-medium uppercase text-gray-500">{{ $t('reservations.myReservations.vehicle') }}</p>
          <h3 class="text-lg font-semibold text-gray-900">{{ reservation.vehicle_name }}</h3>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500">{{ $t('reservations.myReservations.licensePlate') }}</p>
          <p class="font-mono text-gray-900">{{ reservation.license_plate }}</p>
        </div>
      </div>

      <!-- Dates -->
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-xs font-medium uppercase text-gray-500">{{ $t('reservations.myReservations.startDate') }}</p>
            <p class="text-sm text-gray-900">{{ formatDateTime(reservation.start_at) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-gray-500">{{ $t('reservations.myReservations.endDate') }}</p>
            <p class="text-sm text-gray-900">{{ formatDateTime(reservation.end_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Locations -->
      <div v-if="reservation.pickup_location || reservation.dropoff_location" class="space-y-2 border-t border-b py-3">
        <div v-if="reservation.pickup_location">
          <p class="text-xs font-medium uppercase text-gray-500">{{ $t('reservations.myReservations.pickupLocation') }}</p>
          <p class="text-sm text-gray-900">📍 {{ reservation.pickup_location }}</p>
        </div>
        <div v-if="reservation.dropoff_location">
          <p class="text-xs font-medium uppercase text-gray-500">{{ $t('reservations.myReservations.dropoffLocation') }}</p>
          <p class="text-sm text-gray-900">📍 {{ reservation.dropoff_location }}</p>
        </div>
      </div>

      <!-- Status -->
      <div class="space-y-2">
        <p class="text-xs font-medium uppercase text-gray-500">{{ $t('reservations.myReservations.status') }}</p>
        <span
          class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          :class="{
            'bg-amber-100 text-amber-800': reservation.status === 'pending',
            'bg-emerald-100 text-emerald-800': reservation.status === 'active',
            'bg-blue-100 text-blue-800': reservation.status === 'completed',
            'bg-red-100 text-red-800': reservation.status === 'cancelled',
          }"
        >
          {{ $t(`reservations.status.${reservation.status}`) }}
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
          v-if="!reservation.is_expired"
          variant="secondary"
          size="sm"
          block
          @click="$emit('edit', reservation)"
        >
          ✏️ {{ $t('reservations.myReservations.edit') }}
        </BaseButton>
        <BaseButton
          v-if="reservation.can_renew"
          variant="secondary"
          size="sm"
          block
          @click="$emit('renew')"
        >
          ⏱️ {{ $t('reservations.myReservations.extend') }}
        </BaseButton>
        <BaseButton
          v-if="!reservation.is_expired"
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
  edit: [reservation: ReservationLog];
  cancel: [reservation: ReservationLog];
  renew: [];
}>();

const { formatDateTime } = useDateFormatter();
</script>
