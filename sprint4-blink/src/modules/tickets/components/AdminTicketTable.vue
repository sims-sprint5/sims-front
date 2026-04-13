<template>
  <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
    <div class="w-full sm:w-56">
      <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('tickets.table.priority') }}</label>
      <select
        v-model="selectedPriority"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="all">{{ t('adminTickets.filters.all') }}</option>
        <option value="high">{{ t('tickets.form.priorityHigh') }}</option>
        <option value="medium">{{ t('tickets.form.priorityMedium') }}</option>
        <option value="low">{{ t('tickets.form.priorityLow') }}</option>
      </select>
    </div>

    <div class="w-full sm:w-56">
      <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('tickets.table.estado') }}</label>
      <select
        v-model="selectedStatus"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="all">{{ t('adminTickets.filters.all') }}</option>
        <option value="open">{{ t('tickets.estados.open') }}</option>
        <option value="in_progress">{{ t('tickets.estados.in_progress') }}</option>
        <option value="finalitzat">{{ t('tickets.estados.finalitzat') }}</option>
      </select>
    </div>
  </div>

  <BaseTable :columns="columns" :data="filteredAndSortedTickets" :loading="loading" :loadingText="$t('tickets.loading')"
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
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';
import { getEstadoClass, getPriorityClass } from '@/modules/tickets/utils/ticketHelpers';

interface Props {
  tickets?: AdminTicket[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  tickets: () => [],
  loading: false,
});

const { t } = useI18n();
const selectedPriority = ref('all');
const selectedStatus = ref('all');

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

const filteredAndSortedTickets = computed<AdminTicket[]>(() => {
  const priorityFilter = selectedPriority.value;
  const statusFilter = selectedStatus.value;

  return [...props.tickets]
    .filter((ticket) => {
      const ticketPriority = normalizePriority(ticket.priority);
      const ticketStatus = normalizeStatus(ticket.estado);
      const matchesPriority = priorityFilter === 'all' || ticketPriority === priorityFilter;
      const matchesStatus = statusFilter === 'all' || ticketStatus === statusFilter;
      return matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      const priorityDiff = getPriorityOrder(normalizePriority(a.priority)) - getPriorityOrder(normalizePriority(b.priority));
      if (priorityDiff !== 0) return priorityDiff;

      const statusDiff = getStatusOrder(normalizeStatus(a.estado)) - getStatusOrder(normalizeStatus(b.estado));
      if (statusDiff !== 0) return statusDiff;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
});

function normalizePriority(value: string | undefined): string {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'high' || normalized === 'alta') return 'high';
  if (normalized === 'medium' || normalized === 'media' || normalized === 'mitjana') return 'medium';
  if (normalized === 'low' || normalized === 'baja' || normalized === 'baixa') return 'low';
  return 'medium';
}

function normalizeStatus(value: string | undefined): string {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'open' || normalized === 'obert' || normalized === 'pending' || normalized === 'pendiente') return 'open';
  if (normalized === 'in_progress' || normalized === 'en_progres') return 'in_progress';
  if (normalized === 'finalitzat' || normalized === 'closed' || normalized === 'resolved') return 'finalitzat';
  return 'open';
}

function getPriorityOrder(priority: string): number {
  const order: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  return order[priority] ?? 3;
}

function getStatusOrder(status: string): number {
  const order: Record<string, number> = {
    open: 0,
    in_progress: 1,
    finalitzat: 2,
  };
  return order[status] ?? 3;
}

function displayPriority(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === 'low' || normalized === 'baja' || normalized === 'baixa') return t('tickets.form.priorityLow');
  if (normalized === 'medium' || normalized === 'media' || normalized === 'mitjana') return t('tickets.form.priorityMedium');
  if (normalized === 'high' || normalized === 'alta') return t('tickets.form.priorityHigh');
  return value;
}

const { formatDate } = useDateFormatter();
</script>
