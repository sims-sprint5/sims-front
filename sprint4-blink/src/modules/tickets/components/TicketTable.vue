<template>
  <ResponsiveTable 
    :items="tickets" 
    :loading="loading"
    :loadingText="$t('tickets.loading')"
    :emptyText="$t('tickets.empty')"
    keyField="id"
  >
    <!-- Desktop: Tabla normal -->
    <template #desktop>
      <BaseTable 
        :columns="columns" 
        :data="tickets" 
        :loading="loading" 
        :loadingText="$t('tickets.loading')"
        :emptyText="$t('tickets.empty')"
      >
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
            <BaseTooltip :text="$t('common.view')">
              <button
                @click="$emit('view', item)"
                class="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                <ChatBubbleLeftRightIcon class="w-5 h-5" />
              </button>
            </BaseTooltip>
          </div>
        </template>
      </BaseTable>
    </template>

    <!-- Mobile: Cards -->
    <template #card="{ item }">
      <div class="space-y-3">
        <!-- Asunto -->
        <div>
          <div class="text-xs font-medium text-gray-600">{{ $t('tickets.table.asunto') }}</div>
          <div class="text-sm font-semibold text-gray-900 mt-1">{{ item.asunto }}</div>
        </div>

        <!-- Estado y Fecha -->
        <div class="grid grid-cols-2 gap-3 pb-3 border-b border-gray-200">
          <div>
            <div class="text-xs font-medium text-gray-600">{{ $t('tickets.table.estado') }}</div>
            <span class="inline-flex px-2.5 py-1 text-xs leading-5 font-semibold rounded-full mt-1" 
              :class="getEstadoClass(item.estado)">
              {{ item.estado ? t(`tickets.estados.${item.estado}`) : t('tickets.estados.pendiente') }}
            </span>
          </div>
          <div>
            <div class="text-xs font-medium text-gray-600">{{ $t('tickets.table.createdAt') }}</div>
            <div class="text-sm font-medium text-gray-900 mt-1">{{ formatDate(item.created_at) }}</div>
          </div>
        </div>

        <!-- Acciones -->
        <button
          @click="$emit('view', item)"
          class="w-full p-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <ChatBubbleLeftRightIcon class="w-4 h-4" />
          {{ $t('common.view') }}
        </button>
      </div>
    </template>
  </ResponsiveTable>
</template>

<script setup lang="ts">
import { BaseTable, BaseTooltip } from '@/components/base';
import ResponsiveTable from '@/components/base/ResponsiveTable.vue';
import type { Ticket } from '@/modules/tickets/types/ticket.types';
import type { TableColumn } from '@/components/base/BaseTable.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';
import { getEstadoClass } from '@/modules/tickets/utils/ticketHelpers';
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline';

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
