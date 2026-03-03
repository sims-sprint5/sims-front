<template>
  <CustomModal :show="open" :title="`${$t('mapa.viewLogs')} - ${geofence?.name}`" @close="$emit('close')">
    <div class="space-y-4">
      <div v-if="loading" class="text-center py-8">
        <p class="text-gray-500">{{ $t('common.loading') }}</p>
      </div>

      <div v-else-if="logs.length === 0" class="text-center py-8">
        <p class="text-gray-500">{{ $t('mapa.noLogs') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full border-collapse">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">{{ $t('mapa.logs.vehicle') }}</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">{{ $t('mapa.logs.eventType') }}</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">{{ $t('mapa.logs.timestamp') }}</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">{{ $t('mapa.logs.location') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.log_id" class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-sm">{{ log.vehicle?.license_plate || 'N/A' }}</td>
              <td class="px-4 py-2 text-sm">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getEventTypeColor(log.event_type)"
                >
                  {{ $t(`mapa.eventType.${log.event_type}`) }}
                </span>
              </td>
              <td class="px-4 py-2 text-sm">{{ formatDate(log.event_timestamp) }}</td>
              <td class="px-4 py-2 text-sm text-gray-600">
                {{ Number(log.latitude).toFixed(4) }}, {{ Number(log.longitude).toFixed(4) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end">
        <BaseButton variant="secondary" @click="$emit('close')">
          {{ $t('common.close') }}
        </BaseButton>
      </div>
    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import type { Geofence, VehicleGeofenceLog } from '../types/geofence.types'
import { BaseButton } from '@/components/base'
import CustomModal from './CustomModal.vue'
import { useDateFormatter } from '@/shared/composables/useDateFormatter'

interface GeofenceLogsModalProps {
  open: boolean
  geofence?: Geofence
  logs: VehicleGeofenceLog[]
  loading?: boolean
}

defineProps<GeofenceLogsModalProps>()
defineEmits<{
  close: []
}>()

const { formatDate } = useDateFormatter()

const getEventTypeColor = (eventType: string): string => {
  const colors: Record<string, string> = {
    entry: 'bg-green-100 text-green-800',
    exit: 'bg-blue-100 text-blue-800',
    violation: 'bg-red-100 text-red-800'
  }
  return colors[eventType] || 'bg-gray-100 text-gray-800'
}
</script>
