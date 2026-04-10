<template>
  <CustomModal :show="show" :title="$t('reservations.myReservations.editReservation')" @close="handleClose">
    <form @submit.prevent="handleSave" class="space-y-4">
      <!-- Start Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          {{ $t('reservations.myReservations.startDate') }}
        </label>
        <input
          v-model="formData.start_at"
          type="datetime-local"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          :disabled="isLoading"
        />
      </div>

      <!-- End Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          {{ $t('reservations.myReservations.endDate') }}
        </label>
        <input
          v-model="formData.end_at"
          type="datetime-local"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          :disabled="isLoading"
        />
      </div>

      <!-- Pickup Location -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          {{ $t('reservations.myReservations.pickupLocation') }}
        </label>
        <BaseInput
          v-model="formData.pickup_location"
          type="text"
          placeholder="Ej: Calle Principal 123"
          class="mt-1"
          :disabled="isLoading"
        />
      </div>

      <!-- Dropoff Location -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          {{ $t('reservations.myReservations.dropoffLocation') }}
        </label>
        <BaseInput
          v-model="formData.dropoff_location"
          type="text"
          placeholder="Ej: Aeropuerto"
          class="mt-1"
          :disabled="isLoading"
        />
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="rounded-lg bg-red-50 p-3">
        <p class="text-sm text-red-800">
          <strong>❌ {{ $t('errors.error') }}:</strong> {{ errorMessage }}
        </p>
      </div>

      <!-- Info Message -->
      <div v-if="infoMessage" class="rounded-lg bg-blue-50 p-3">
        <p class="text-sm text-blue-800">
          ℹ️ {{ infoMessage }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 border-t pt-4">
        <BaseButton
          type="button"
          variant="secondary"
          size="sm"
          block
          @click="handleClose"
          :disabled="isLoading"
        >
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          size="sm"
          block
          :loading="isLoading"
        >
          {{ $t('common.save') }}
        </BaseButton>
      </div>
    </form>
  </CustomModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { BaseInput } from '@/components/base';
import BaseButton from '@/components/base/BaseButton.vue';
import CustomModal from '@/modules/mapa/components/CustomModal.vue';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';
import { useToast } from '@/shared/composables/useToast';

interface Props {
  show: boolean;
  reservation: ReservationLog;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [data: Partial<ReservationLog>];
}>();

const { t } = useI18n();
const { error, success } = useToast();

const isLoading = ref(false);
const errorMessage = ref('');
const infoMessage = ref('');

// Convert ISO datetime to datetime-local format
const formatToLocal = (isoDate: string): string => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convert datetime-local back to ISO
const formatToISO = (localDate: string): string => {
  return new Date(localDate).toISOString();
};

const formData = reactive({
  start_at: '',
  end_at: '',
  pickup_location: '',
  dropoff_location: '',
});

// Watch for reservation changes and update form
watch(
  () => props.reservation,
  (newReservation) => {
    if (newReservation) {
      formData.start_at = formatToLocal(newReservation.start_at);
      formData.end_at = formatToLocal(newReservation.end_at);
      formData.pickup_location = newReservation.pickup_location || '';
      formData.dropoff_location = newReservation.dropoff_location || '';
      errorMessage.value = '';
      infoMessage.value = '';
    }
  },
  { immediate: true }
);

// Check if dates have changed
const datesChanged = computed(() => {
  return (
    formatToISO(formData.start_at) !== props.reservation.start_at ||
    formatToISO(formData.end_at) !== props.reservation.end_at
  );
});

const handleClose = () => {
  errorMessage.value = '';
  infoMessage.value = '';
  emit('close');
};

const handleSave = async () => {
  try {
    errorMessage.value = '';
    infoMessage.value = '';

    // Validate dates
    const startDate = new Date(formData.start_at);
    const endDate = new Date(formData.end_at);

    if (startDate >= endDate) {
      errorMessage.value = t('reservations.errors.invalidDateRange');
      return;
    }

    // Check availability if dates changed
    if (datesChanged.value) {
      infoMessage.value = t('reservations.myReservations.checkingAvailability');
      isLoading.value = true;

      try {
        const availabilityResult = await reservationLogService.checkAvailability(
          props.reservation.vehicle_id,
          formData.start_at,
          formData.end_at
        );

        if (!availabilityResult.available) {
          errorMessage.value = t('reservations.errors.notAvailable', {
            date: availabilityResult.available_at,
          });
          isLoading.value = false;
          return;
        }
      } catch {
        errorMessage.value = t('reservations.errors.checkAvailability');
        isLoading.value = false;
        return;
      }
    }

    // Prepare update data
    const updateData: Partial<ReservationLog> = {
      start_at: formatToISO(formData.start_at),
      end_at: formatToISO(formData.end_at),
      pickup_location: formData.pickup_location,
      dropoff_location: formData.dropoff_location,
    };

    // Call update service (would need to be implemented in service)
    // For now, emit save event and let parent handle it
    emit('save', updateData);

    success(t('reservations.myReservations.reservationUpdated'));
    handleClose();
  } catch (err) {
    console.error('Error saving reservation:', err);
    errorMessage.value = t('reservations.errors.updateFailed');
    error(t('reservations.errors.updateFailed'));
  } finally {
    isLoading.value = false;
  }
};
</script>
