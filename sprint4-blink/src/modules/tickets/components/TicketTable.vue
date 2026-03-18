<template>
  <BaseTable :columns="columns" :data="tickets" :loading="loading" :loadingText="$t('tickets.loading')"
    :emptyText="$t('tickets.empty')">
    <template #cell-asunto="{ value }">
      <div class="text-sm font-medium text-gray-900">{{ value }}</div>
    </template>

    <template #cell-estado="{ value }">
      <span class="inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full" :class="getEstadoClass(value)">
        {{ value ? t(`tickets.estados.${value}`) : t('tickets.estados.pendiente') }}
      </span>
    </template>

    <template #cell-created_at="{ value }">
      {{ formatDate(value) }}
    </template>

    <template #cell-actions="{ item }">
      <div class="flex gap-2 justify-end">
        <button
          @click="$emit('view', item)"
          class="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
          :title="$t('common.view')"
        >
          <ChatBubbleLeftRightIcon class="w-5 h-5" />
        </button>
      </div>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { BaseTable } from '@/components/base';
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline';
import type { Ticket } from '@/modules/tickets/types/ticket.types';
import type { TableColumn } from '@/components/base/BaseTable.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';
import { getEstadoClass } from '@/modules/tickets/utils/ticketHelpers';

interface Props {
  tickets?: Ticket[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  tickets: () => [],
  loading: false,
});

const { t } = useI18n();

defineEmits<{
  view: [ticket: Ticket];
}>();

const columns = computed<TableColumn[]>(() => [
  { key: 'asunto', label: t('tickets.table.asunto'), align: 'left' },
  { key: 'estado', label: t('tickets.table.estado'), align: 'left' },
  { key: 'created_at', label: t('tickets.table.createdAt'), align: 'left' },
  { key: 'actions', label: t('tickets.table.actions'), align: 'right' },
]);

const { formatDate } = useDateFormatter();
</script>
