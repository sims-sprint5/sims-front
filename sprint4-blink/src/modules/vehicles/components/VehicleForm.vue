<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <BaseInput
          v-model="formData.license_plate"
          :label="$t('vehicles.form.licensePlate')"
          type="text"
          :placeholder="$t('vehicles.form.licensePlatePlaceholder')"
          :error="formatError((errors as any).license_plate)"
          required
        />
      </div>

      <div>
        <div class="w-full">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ $t('vehicles.form.status') }}
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
              {{ $t('vehicles.form.statusPlaceholder') }}
            </option>
            <option v-for="opt in props.statusOptions" :key="opt" :value="opt">
              {{ statusLabel(opt) }}
            </option>
          </select>

          <p v-if="(errors as any).status" class="text-red-500 text-xs mt-1">
            {{ formatError((errors as any).status) }}
          </p>
        </div>
      </div>

      <div>
        <BaseInput
          v-model="formData.brand"
          :label="$t('vehicles.form.brand')"
          type="text"
          :placeholder="$t('vehicles.form.brandPlaceholder')"
          :error="formatError((errors as any).brand)"
          required
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.model"
          :label="$t('vehicles.form.model')"
          type="text"
          :placeholder="$t('vehicles.form.modelPlaceholder')"
          :error="formatError((errors as any).model)"
          required
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.year"
          :label="$t('vehicles.form.year')"
          type="number"
          :placeholder="$t('vehicles.form.yearPlaceholder')"
          :error="formatError((errors as any).year)"
          required
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.color"
          :label="$t('vehicles.form.color')"
          type="text"
          :placeholder="$t('vehicles.form.colorPlaceholder')"
          :error="formatError((errors as any).color)"
          required
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.current_latitude"
          :label="$t('vehicles.form.currentLatitude')"
          type="number"
          :placeholder="$t('vehicles.form.currentLatitudePlaceholder')"
          :error="formatError((errors as any).current_latitude)"
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.current_longitude"
          :label="$t('vehicles.form.currentLongitude')"
          type="number"
          :placeholder="$t('vehicles.form.currentLongitudePlaceholder')"
          :error="formatError((errors as any).current_longitude)"
        />
      </div>
    </div>

    <div class="flex justify-end space-x-3 pt-2">
      <BaseButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="loading">
        {{ isEditing ? $t('vehicles.actions.updateVehicle') : $t('vehicles.actions.createVehicle') }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { BaseInput, BaseButton } from '@/components/base';
import type { Vehicle, CreateVehicleData, UpdateVehicleData } from '@/modules/vehicles/types/vehicle.types';
import type { ValidationErrors } from '@/modules/vehicles/utils/vehicleValidation';
import { useFormatError } from '@/shared/composables/useFormatError';
import { useI18n } from 'vue-i18n';
import { getVehicleStatusLabel } from '@/modules/vehicles/utils/vehicleStatus';

interface Props {
  vehicle?: Vehicle | null;
  loading?: boolean;
  errors?: ValidationErrors | Record<string, string>;
  statusOptions?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  vehicle: null,
  loading: false,
  errors: () => ({}),
  statusOptions: () => ['active', 'inactive', 'maintenance'],
});

const emit = defineEmits<{
  submit: [data: CreateVehicleData | UpdateVehicleData];
  cancel: [];
}>();

const { t } = useI18n();

const statusLabel = (status: unknown) => {
  return getVehicleStatusLabel(t, status);
};

const { formatError } = useFormatError();

const isEditing = ref(false);
const formData = ref<CreateVehicleData>({
  license_plate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  status: '',
  current_latitude: '',
  current_longitude: '',
});

watch(
  () => props.vehicle,
  (newVehicle) => {
    if (newVehicle) {
      isEditing.value = true;
      formData.value = {
        license_plate: newVehicle.license_plate,
        brand: newVehicle.brand,
        model: newVehicle.model,
        year: newVehicle.year ?? '',
        color: newVehicle.color,
        status: newVehicle.status,
        current_latitude: newVehicle.current_latitude ?? '',
        current_longitude: newVehicle.current_longitude ?? '',
      };
    } else {
      isEditing.value = false;
      formData.value = {
        license_plate: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        status: '',
        current_latitude: '',
        current_longitude: '',
      };
    }
  },
  { immediate: true },
);

const handleSubmit = () => {
  if (isEditing.value) {
    const updateData: UpdateVehicleData = {
      license_plate: formData.value.license_plate,
      brand: formData.value.brand,
      model: formData.value.model,
      year: formData.value.year,
      color: formData.value.color,
      status: formData.value.status,
      current_latitude: formData.value.current_latitude,
      current_longitude: formData.value.current_longitude,
    };
    emit('submit', updateData);
  } else {
    emit('submit', formData.value);
  }
};
</script>
