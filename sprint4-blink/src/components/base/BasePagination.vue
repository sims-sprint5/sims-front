<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseButton from './BaseButton.vue';

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

interface Props {
  pagination: PaginationMeta;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  change: [page: number];
}>();

const { t } = useI18n();

const visiblePages = computed(() => {
  const current = props.pagination.current_page;
  const last = props.pagination.last_page;
  const pages: number[] = [];

  let start = Math.max(1, current - 2);
  let end = Math.min(last, current + 2);

  if (current <= 3) end = Math.min(5, last);
  if (current >= last - 2) start = Math.max(1, last - 4);

  for (let i = start; i <= end; i++) pages.push(i);

  return pages;
});

function go(page: number) {
  if (page < 1 || page > props.pagination.last_page) return;
  emit('change', page);
}
</script>

<template>
  <div
    v-if="pagination.last_page > 1"
    class="bg-white px-4 py-3 flex items-center border-t border-gray-200 sm:px-6"
  >
    <!-- Móvil -->
    <div class="flex-1 flex justify-end gap-3 sm:hidden">
      <BaseButton
        variant="secondary"
        :disabled="pagination.current_page === 1"
        @click="go(pagination.current_page - 1)"
      >
        {{ t('table.previous') }}
      </BaseButton>
      <BaseButton
        variant="secondary"
        :disabled="pagination.current_page === pagination.last_page"
        @click="go(pagination.current_page + 1)"
      >
        {{ t('table.next') }}
      </BaseButton>
    </div>

    <!-- Desktop -->
    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-end sm:gap-4">
      <div class="mr-auto">
        <p class="text-sm text-gray-700">
          {{ t('table.showing', { from: pagination.from, to: pagination.to, total: pagination.total }) }}
        </p>
      </div>
      <nav
        class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
        :aria-label="t('table.paginationLabel')"
      >
        <BaseButton
          variant="secondary"
          size="sm"
          class="rounded-l-md rounded-r-none"
          :disabled="pagination.current_page === 1"
          @click="go(pagination.current_page - 1)"
        >
          <span class="sr-only">{{ t('table.previous') }}</span>
          ‹
        </BaseButton>
        <BaseButton
          v-for="page in visiblePages"
          :key="page"
          variant="secondary"
          size="sm"
          class="rounded-none"
          @click="go(page)"
        >
          {{ page }}
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="sm"
          class="rounded-r-md rounded-l-none"
          :disabled="pagination.current_page === pagination.last_page"
          @click="go(pagination.current_page + 1)"
        >
          <span class="sr-only">{{ t('table.next') }}</span>
          ›
        </BaseButton>
      </nav>
    </div>
  </div>
</template>
