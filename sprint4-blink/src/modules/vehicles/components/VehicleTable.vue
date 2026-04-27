<template>
  <BaseTable
    :columns="columns"
    :data="vehicles"
    :loading="loading"
    :loadingText="$t('vehicles.loading')"
    :emptyText="$t('vehicles.empty')"
  >
    <template #cell-license_plate="{ value }">
      <div class="text-sm font-medium text-main">{{ value }}</div>
    </template>

    <template #cell-status="{ value }">
      <span
        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
        :class="statusClass(value)"
      >
        {{ statusLabel(value) }}
      </span>
    </template>

    <template #cell-actions="{ item }">
      <div class="flex gap-2 justify-end">
        <button
          @click="$emit('view', item)"
          class="p-2 bg-primary text-inverse hover:brightness-110 rounded-lg transition-colors"
          :title="$t('common.view')"
        >
          <EyeIcon class="w-5 h-5" />
        </button>
        <button
          @click="$emit('edit', item)"
          class="p-2 bg-success text-inverse hover:brightness-110 rounded-lg transition-colors"
          :title="$t('common.edit')"
        >
          <PencilIcon class="w-5 h-5" />
        </button>
        <button
          @click="$emit('delete', item)"
          class="p-2 bg-danger text-inverse hover:brightness-110 rounded-lg transition-colors"
          :title="$t('common.delete')"
        >
          <TrashIcon class="w-5 h-5" />
        </button>
      </div>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { BaseTable } from '@/components/base';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import type { Vehicle } from '@/modules/vehicles/types/vehicle.types';
import type { TableColumn } from '@/components/base/BaseTable.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getVehicleStatusClass, getVehicleStatusLabel } from '@/modules/vehicles/utils/vehicleStatus';

interface Props {
  vehicles?: Vehicle[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  vehicles: () => [],
  loading: false,
});

const { t } = useI18n();

const statusLabel = (status: unknown) => {
  return getVehicleStatusLabel(t, status);
};

const statusClass = (status: unknown) => {
  return getVehicleStatusClass(status);
};

defineEmits<{
  view: [vehicle: Vehicle];
  edit: [vehicle: Vehicle];
  delete: [vehicle: Vehicle];
}>();

const columns = computed<TableColumn[]>(() => [
  { key: 'license_plate', label: t('vehicles.table.licensePlate'), align: 'left' },
  { key: 'brand', label: t('vehicles.table.brand'), align: 'left' },
  { key: 'model', label: t('vehicles.table.model'), align: 'left' },
  { key: 'color', label: t('vehicles.table.color'), align: 'left' },
  { key: 'year', label: t('vehicles.table.year'), align: 'left' },
  { key: 'status', label: t('vehicles.table.status'), align: 'left' },
  { key: 'actions', label: t('vehicles.table.actions'), align: 'right' },
]);
</script>
