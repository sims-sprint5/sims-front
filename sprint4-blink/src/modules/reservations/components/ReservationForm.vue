<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <BaseInput
          v-model="formData.user_id"
          :label="$t('reservations.form.userId')"
          type="number"
          :placeholder="$t('reservations.form.userIdPlaceholder')"
          :error="formatError((errors as any).user_id)"
          required
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.vehicle_id"
          :label="$t('reservations.form.vehicleId')"
          type="number"
          :placeholder="$t('reservations.form.vehicleIdPlaceholder')"
          :error="formatError((errors as any).vehicle_id)"
          required
        />
      </div>

      <div>
        <div class="w-full">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ $t('reservations.form.status') }}
            <span class="text-red-500">*</span>
          </label>

          <select
            v-model="formData.status"
            :class="[
              'w-full px-4 py-3 border rounded-lg transition-all',
              'focus:ring-2 focus:ring-purple-500 focus:border-transparent',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              (errors as any).status ? 'border-red-500' : 'border-gray-300',
            ].join(' ')"
            required
          >
            <option value="" disabled>
              {{ $t('reservations.form.statusPlaceholder') }}
            </option>
            <option value="pending">{{ $t('reservations.status.pending') }}</option>
            <option value="confirmed">{{ $t('reservations.status.confirmed') }}</option>
          </select>

          <p v-if="(errors as any).status" class="text-red-500 text-xs mt-1">
            {{ formatError((errors as any).status) }}
          </p>
        </div>
      </div>

      <div>
        <BaseInput
          v-model="formData.start_at"
          :label="$t('reservations.form.startAt')"
          type="text"
          :placeholder="$t('reservations.form.startAtPlaceholder')"
          :error="formatError((errors as any).start_at)"
          required
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.end_at"
          :label="$t('reservations.form.endAt')"
          type="text"
          :placeholder="$t('reservations.form.endAtPlaceholder')"
          :error="formatError((errors as any).end_at)"
          required
        />
      </div>
    </div>

    <div class="flex justify-end space-x-3 pt-2">
      <BaseButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="loading">
        {{ isEditing ? $t('reservations.actions.updateReservation') : $t('reservations.actions.createReservation') }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { BaseInput, BaseButton } from '@/components/base';
import type {
  Reservation,
  CreateReservationData,
  UpdateReservationData,
} from '@/modules/reservations/types/reservation.types';
import type { ValidationErrors } from '@/modules/reservations/utils/reservationValidation';
import { useFormatError } from '@/shared/composables/useFormatError';

interface Props {
  reservation?: Reservation | null;
  loading?: boolean;
  errors?: ValidationErrors | Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  reservation: null,
  loading: false,
  errors: () => ({}),
});

const emit = defineEmits<{
  submit: [data: CreateReservationData | UpdateReservationData];
  cancel: [];
}>();

const { formatError } = useFormatError();

const isEditing = ref(false);
const formData = ref<CreateReservationData>({
  user_id: '',
  vehicle_id: '',
  status: '',
  start_at: '',
  end_at: '',
});

watch(
  () => props.reservation,
  (newReservation) => {
    if (newReservation) {
      isEditing.value = true;
      formData.value = {
        user_id: newReservation.user_id ?? '',
        vehicle_id: newReservation.vehicle_id ?? '',
        status: newReservation.status ?? '',
        start_at: newReservation.start_at ?? '',
        end_at: newReservation.end_at ?? '',
      };
    } else {
      isEditing.value = false;
      formData.value = {
        user_id: '',
        vehicle_id: '',
        status: '',
        start_at: '',
        end_at: '',
      };
    }
  },
  { immediate: true },
);

const handleSubmit = () => {
  if (isEditing.value) {
    const updateData: UpdateReservationData = {
      user_id: formData.value.user_id,
      vehicle_id: formData.value.vehicle_id,
      status: formData.value.status,
      start_at: formData.value.start_at,
      end_at: formData.value.end_at,
    };
    emit('submit', updateData);
  } else {
    emit('submit', formData.value);
  }
};
</script>
