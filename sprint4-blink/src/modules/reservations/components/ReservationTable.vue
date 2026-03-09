<template>
  <BaseTable
    :columns="columns"
    :data="reservations"
    :loading="loading"
    :loadingText="$t('reservations.loading')"
    :emptyText="$t('reservations.empty')"
  >
    <template #cell-status="{ value }">
      <span
        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
        :class="String(value).trim() ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'"
      >
        {{ value || '-' }}
      </span>
    </template>

    <template #cell-created_at="{ value }">
      {{ formatDate(value) }}
    </template>

    <template #cell-actions="{ item }">
      <div class="flex gap-2 justify-end">
        <button
          @click="$emit('view', item)"
          class="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          :title="$t('common.view')"
        >
          <EyeIcon class="w-5 h-5" />
        </button>
        <button
          @click="$emit('edit', item)"
          class="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
          :title="$t('common.edit')"
        >
          <PencilIcon class="w-5 h-5" />
        </button>
        <button
          @click="$emit('delete', item)"
          class="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
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
import type { Reservation } from '@/modules/reservations/types/reservation.types';
import type { TableColumn } from '@/components/base/BaseTable.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

interface Props {
  reservations?: Reservation[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  reservations: () => [],
  loading: false,
});

const { t } = useI18n();

defineEmits<{
  view: [reservation: Reservation];
  edit: [reservation: Reservation];
  delete: [reservation: Reservation];
}>();

const columns = computed<TableColumn[]>(() => [
  { key: 'user_id', label: t('reservations.table.userId'), align: 'left' },
  { key: 'vehicle_id', label: t('reservations.table.vehicleId'), align: 'left' },
  { key: 'status', label: t('reservations.table.status'), align: 'left' },
  { key: 'start_at', label: t('reservations.table.startAt'), align: 'left' },
  { key: 'end_at', label: t('reservations.table.endAt'), align: 'left' },
  { key: 'created_at', label: t('reservations.table.createdAt'), align: 'left' },
  { key: 'actions', label: t('reservations.table.actions'), align: 'right' },
]);

const { formatDate } = useDateFormatter({ year: 'numeric', month: 'short', day: 'numeric' });
</script>
