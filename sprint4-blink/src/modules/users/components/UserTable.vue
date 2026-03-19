<template>
  <BaseTable :columns="columns" :data="users" :loading="loading" :loadingText="$t('users.loading')"
    :emptyText="$t('users.empty')">
    <template #cell-name="{ value }">
      <div class="text-sm font-medium text-gray-900">{{ value }}</div>
    </template>

    <template #cell-role="{ value }">
      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
        :class="value === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'">
        {{ value ? $t(`roles.${value}`) : '' }}
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
import type { User } from '@/modules/users/types/user.types';
import type { TableColumn } from '@/components/base/BaseTable.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

interface Props {
  users?: User[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  users: () => [],
  loading: false,
});

const { t } = useI18n();

defineEmits<{
  view: [user: User];
  edit: [user: User];
  delete: [user: User];
}>();

const columns = computed<TableColumn[]>(() => [
  { key: 'name', label: t('users.table.name'), align: 'left' },
  { key: 'email', label: t('users.table.email'), align: 'left' },
  { key: 'phone', label: t('dashboard.user.phone'), align: 'left' },
  { key: 'role', label: t('dashboard.user.role'), align: 'left' },
  { key: 'created_at', label: t('users.table.createdAt'), align: 'left' },
  { key: 'actions', label: t('users.table.actions'), align: 'right' },
]);

const { formatDate } = useDateFormatter({ year: 'numeric', month: 'short', day: 'numeric' });
</script>
