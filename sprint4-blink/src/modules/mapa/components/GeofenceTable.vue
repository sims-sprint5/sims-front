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
        <div class="flex gap-2">
          <button
            @click="$emit('view-logs', item)"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            :title="$t('mapa.viewLogs')"
          >
            📋
          </button>
          <button
            @click="$emit('edit', item)"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            :title="$t('common.edit')"
          >
            ✏️
          </button>
          <button
            @click="$emit('delete', item)"
            class="text-red-600 hover:text-red-800 text-sm font-medium"
            :title="$t('common.delete')"
          >
            🗑️
          </button>
        </div>
      </template>
    </BaseTable>
  </div>
</template>

<script setup lang="ts">
import type { Geofence } from '../types/geofence.types'
import { BaseTable, BaseButton } from '@/components/base'

interface GeofenceTableProps {
  geofences: Geofence[]
  loading?: boolean
}

defineProps<GeofenceTableProps>()

defineEmits<{
  create: []
  edit: [geofence: Geofence]
  delete: [geofence: Geofence]
  'view-logs': [geofence: Geofence]
}>()

const columns = [
  { key: 'name', label: 'mapa.form.name' },
  { key: 'type', label: 'mapa.form.type' },
  { key: 'radius', label: 'mapa.form.radius' },
  { key: 'status', label: 'mapa.form.status' },
  { key: 'actions', label: 'common.actions' }
]

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
