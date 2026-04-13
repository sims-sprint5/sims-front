<template>
  <BaseTable :columns="columns" :data="tickets" :loading="loading" :loadingText="$t('tickets.loading')"
    :emptyText="$t('tickets.empty')">
    <template #cell-asunto="{ value }">
      <div class="text-sm font-medium text-gray-900">{{ value }}</div>
    </template>

    <template #cell-usuario="{ item }">
      <div class="text-sm text-gray-900">
        <div class="font-medium">{{ item.usuario_nombre }}</div>
        <div class="text-gray-500">{{ item.usuario_email }}</div>
      </div>
    </template>

    <template #cell-estado="{ value }">
      <span class="inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full" :class="getEstadoClass(value)">
        {{ value ? t(`tickets.estados.${value}`) : t('tickets.estados.pendiente') }}
      </span>
    </template>

    <template #cell-priority="{ value }">
      <span class="inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full" :class="getPriorityClass(value)">
        {{ value ? displayPriority(value) : '-' }}
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
          @click="$emit('chat', item)"
          class="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
          :title="$t('adminTickets.actions.reply')"
        >
          <ChatBubbleLeftRightIcon class="w-5 h-5" />
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
import { EyeIcon, ChatBubbleLeftRightIcon, TrashIcon } from '@heroicons/vue/24/outline';
import type { AdminTicket } from '@/modules/tickets/types/adminTicket.types';
import type { TableColumn } from '@/components/base/BaseTable.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';
import { getEstadoClass, getPriorityClass } from '@/modules/tickets/utils/ticketHelpers';

interface Props {
  tickets?: AdminTicket[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  tickets: () => [],
  loading: false,
});

const { t } = useI18n();

defineEmits<{
  view: [ticket: AdminTicket];
  chat: [ticket: AdminTicket];
  delete: [ticket: AdminTicket];
}>();

const columns = computed<TableColumn[]>(() => [
  { key: 'asunto', label: t('tickets.table.asunto'), align: 'left' },
  { key: 'usuario', label: t('tickets.table.usuario'), align: 'left' },
  { key: 'estado', label: t('tickets.table.estado'), align: 'left' },
  { key: 'priority', label: t('tickets.table.priority'), align: 'left' },
  { key: 'created_at', label: t('tickets.table.createdAt'), align: 'left' },
  { key: 'actions', label: t('tickets.table.actions'), align: 'right' },
]);

function displayPriority(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === 'low' || normalized === 'baja' || normalized === 'baixa') return t('tickets.form.priorityLow');
  if (normalized === 'medium' || normalized === 'media' || normalized === 'mitjana') return t('tickets.form.priorityMedium');
  if (normalized === 'high' || normalized === 'alta') return t('tickets.form.priorityHigh');
  return value;
}

const { formatDate } = useDateFormatter();
</script>
