<template>
  <div class="overflow-x-auto bg-white rounded-lg shadow">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            :class="column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-6 py-4 text-center text-sm text-gray-500">
            {{ resolvedLoadingText }}
          </td>
        </tr>
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length" class="px-6 py-4 text-center text-sm text-gray-500">
            {{ resolvedEmptyText }}
          </td>
        </tr>
        <tr v-else v-for="(item, index) in paginatedData" :key="getItemKey(item, index)" class="hover:bg-gray-50">
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-6 py-4 whitespace-nowrap text-sm"
            :class="column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'"
          >
            <slot :name="`cell-${column.key}`" :item="item" :value="getNestedValue(item, column.key)">
              {{ getNestedValue(item, column.key) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
    
    <!-- Paginación -->
    <div v-if="pagination && pagination.last_page > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div class="flex-1 flex justify-between sm:hidden">
        <BaseButton
          @click="handlePageChange(pagination.current_page - 1)"
          :disabled="pagination.current_page === 1"
          variant="secondary"
        >
          {{ t('table.previous') }}
        </BaseButton>
        <BaseButton
          @click="handlePageChange(pagination.current_page + 1)"
          :disabled="pagination.current_page === pagination.last_page"
          variant="secondary"
          class="ml-3"
        >
          {{ t('table.next') }}
        </BaseButton>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            {{ t('table.showing', { from: pagination.from, to: pagination.to, total: pagination.total }) }}
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" :aria-label="t('table.paginationLabel')">
            <BaseButton
              @click="handlePageChange(pagination.current_page - 1)"
              :disabled="pagination.current_page === 1"
              variant="secondary"
              size="sm"
              class="rounded-l-md rounded-r-none"
            >
              <span class="sr-only">{{ t('table.previous') }}</span>
              ‹
            </BaseButton>
            <BaseButton
              v-for="page in visiblePages"
              :key="page"
              @click="handlePageChange(page)"
              variant="secondary"
              size="sm"
              class="rounded-none"
            >
              {{ page }}
            </BaseButton>
            <BaseButton
              @click="handlePageChange(pagination.current_page + 1)"
              :disabled="pagination.current_page === pagination.last_page"
              variant="secondary"
              size="sm"
              class="rounded-r-md rounded-l-none"
            >
              <span class="sr-only">{{ t('table.next') }}</span>
              ›
            </BaseButton>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseButton from './BaseButton.vue';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface TablePagination {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

interface Props {
  columns: TableColumn[];
  data?: T[];
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  itemKey?: string;
  perPage?: number;
  enablePagination?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  itemKey: 'id',
  perPage: 5,
  enablePagination: true,
});

const { t } = useI18n();

const resolvedLoadingText = computed(() => props.loadingText ?? t('table.loading'));
const resolvedEmptyText = computed(() => props.emptyText ?? t('table.empty'));

const currentPage = ref(1);

// Calcular paginación automática
const pagination = computed((): TablePagination | undefined => {
  if (!props.enablePagination) return undefined;
  
  const total = props.data.length;
  if (total === 0) return undefined;

  const last_page = Math.max(1, Math.ceil(total / props.perPage));
  const current = Math.min(Math.max(1, currentPage.value), last_page);
  const from = (current - 1) * props.perPage + 1;
  const to = Math.min(total, current * props.perPage);

  return {
    current_page: current,
    from,
    last_page,
    per_page: props.perPage,
    to,
    total,
  };
});

// Datos paginados
const paginatedData = computed(() => {
  if (!props.enablePagination || !pagination.value) {
    return props.data;
  }

  const start = (currentPage.value - 1) * props.perPage;
  const end = start + props.perPage;
  return props.data.slice(start, end);
});

// Manejar cambio de página
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// Resetear a página 1 cuando cambian los datos
watch(() => props.data, () => {
  currentPage.value = 1;
});

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

const getItemKey = (item: T, index: number): string | number => {
  return getNestedValue(item, props.itemKey) ?? index;
};

const visiblePages = computed(() => {
  if (!pagination.value) return [];
  
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;
  const pages: number[] = [];
  
  // Mostrar máximo 5 páginas
  let start = Math.max(1, current - 2);
  let end = Math.min(last, current + 2);
  
  // Ajustar si estamos al inicio o al final
  if (current <= 3) {
    end = Math.min(5, last);
  }
  if (current >= last - 2) {
    start = Math.max(1, last - 4);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});
</script>
