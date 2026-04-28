 <template>
  <CustomModal :show="show" :title="$t('reservations.myReservations.expandReservation')" @close="handleClose">
    <form @submit.prevent="handleSave" class="space-y-4">
      <!-- Start Date (Read-only) -->
      <div>
        <label class="block text-sm font-medium text-main">
          {{ $t('reservations.myReservations.startDate') }}
        </label>
        <input
          :value="formData.start_at"
          type="datetime-local"
          disabled
          class="mt-1 block w-full rounded-md border border-default bg-base px-3 py-2 text-sm text-muted"
        />
        <p class="mt-1 text-xs text-muted">{{ $t('reservations.myReservations.startDateLocked') }}</p>
      </div>

      <!-- End Date (Editable) -->
      <div>
        <label class="block text-sm font-medium text-main">
          {{ $t('reservations.myReservations.endDate') }}
        </label>
        <input
          v-model="formData.end_at"
          type="datetime-local"
          required
          class="mt-1 block w-full rounded-md border border-default px-3 py-2 text-sm focus:border-primary focus:ring-primary"
          :disabled="isLoading"
        />
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="rounded-lg bg-danger/10 p-3">
        <p class="text-sm text-red-800">
          <strong>❌ {{ $t('errors.error') }}:</strong> {{ errorMessage }}
        </p>
      </div>

      <!-- Info Message -->
      <div v-if="infoMessage" class="rounded-lg bg-base p-3">
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
const { error } = useToast();

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

// Convert datetime-local back to ISO format para enviar al backend
// Backend espera: 2026-04-26T18:00:00 (sin milisegundos ni Z)
const formatToISO = (localDate: string): string => {
  if (!localDate) return '';
  const date = new Date(localDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
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
          formatToISO(formData.start_at),
          formatToISO(formData.end_at),
          props.reservation.id
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
    const isoEndDate = formatToISO(formData.end_at);

    // Call update API
    try {
      await reservationLogService.updateReservation(props.reservation.id, isoEndDate);
      emit('save', {
        start_at: props.reservation.start_at,
        end_at: isoEndDate,
        pickup_location: props.reservation.pickup_location,
        dropoff_location: props.reservation.dropoff_location,
      });
      handleClose();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || t('reservations.errors.updateFailed');
      errorMessage.value = errorMsg;
      error(errorMsg);
      isLoading.value = false;
      return;
    }
  } catch (err) {
    console.error('Error saving reservation:', err);
    errorMessage.value = t('reservations.errors.updateFailed');
    error(t('reservations.errors.updateFailed'));
  } finally {
    isLoading.value = false;
  }
};
</script>
