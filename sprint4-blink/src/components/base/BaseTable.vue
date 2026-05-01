<template>
  <div class="overflow-x-auto bg-surface rounded-lg shadow">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="color-surface">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-6 py-3 text-xs font-medium text-main uppercase tracking-wider"
            :class="column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="bg-surface divide-y divide-gray-200">
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-6 py-4 text-center text-sm text-muted">
            {{ resolvedLoadingText }}
          </td>
        </tr>
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length" class="px-6 py-4 text-center text-sm text-muted">
            {{ resolvedEmptyText }}
          </td>
        </tr>
        <tr v-else v-for="(item, index) in paginatedData" :key="getItemKey(item, index)" class="hover:bg-base-dark">
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-4 py-4 text-sm break-words align-top sm:px-6"
            :class="column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'"
          >
            <slot :name="`cell-${column.key}`" :item="item" :value="getNestedValue(item, column.key)">
              {{ getNestedValue(item, column.key) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
    
    <BasePagination
      v-if="pagination"
      :pagination="pagination"
      @change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BasePagination from './BasePagination.vue';

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

// Paginated data
const paginatedData = computed(() => {
  if (!props.enablePagination || !pagination.value) {
    return props.data;
  }

  const start = (currentPage.value - 1) * props.perPage;
  const end = start + props.perPage;
  return props.data.slice(start, end);
});

// Handle page change
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// Reset to page 1 when data changes
watch(() => props.data, () => {
  currentPage.value = 1;
});

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

const getItemKey = (item: T, index: number): string | number => {
  return getNestedValue(item, props.itemKey) ?? index;
};


</script>
