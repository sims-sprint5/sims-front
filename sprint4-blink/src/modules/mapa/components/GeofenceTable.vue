<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">{{ $t('mapa.geofences') }}</h3>
      <BaseButton variant="primary" size="sm" @click="$emit('create')">
        {{ $t('mapa.createZone') }}
      </BaseButton>
    </div>

    <BaseTable
      :columns="columns"
      :data="geofences"
      :loading="loading"
      :empty-message="$t('mapa.noGeofences')"
    >
      <template #cell-type="{ item }">
        <span
          class="px-2 py-1 rounded text-sm font-medium"
          :class="getTypeColorClass(item.type)"
        >
          {{ $t(`mapa.types.${item.type}`) }}
        </span>
      </template>

      <template #cell-status="{ item }">
        <span
          class="px-2 py-1 rounded text-sm font-medium"
          :class="item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
        >
          {{ $t(`mapa.status.${item.status}`) }}
        </span>
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
            @click="$emit('view-logs', item)"
            class="p-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors"
            :title="$t('mapa.viewLogs')"
          >
            <DocumentTextIcon class="w-5 h-5" />
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EyeIcon, PencilIcon, TrashIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import type { Geofence } from '../types/geofence.types'
import { BaseTable, BaseButton } from '@/components/base'

const { t } = useI18n()

interface GeofenceTableProps {
  geofences: Geofence[]
  loading?: boolean
}

defineProps<GeofenceTableProps>()

defineEmits<{
  create: []
  view: [geofence: Geofence]
  edit: [geofence: Geofence]
  delete: [geofence: Geofence]
  'view-logs': [geofence: Geofence]
}>()

const columns = computed(() => [
  { key: 'name', label: t('mapa.table.name') },
  { key: 'type', label: t('mapa.table.type') },
  { key: 'radius', label: t('mapa.table.radius') },
  { key: 'status', label: t('mapa.table.status') },
  { key: 'actions', label: t('mapa.table.actions'), align: 'right' }
])

const getTypeColorClass = (type: string): string => {
  const classes: Record<string, string> = {
    allowed: 'bg-green-100 text-green-800',
    restricted: 'bg-red-100 text-red-800',
    parking: 'bg-blue-100 text-blue-800',
    service_area: 'bg-orange-100 text-orange-800'
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}
</script>
