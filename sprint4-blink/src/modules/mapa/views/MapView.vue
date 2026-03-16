<template>
  <AppLayout>
    <div class="h-[calc(100vh-64px)] flex flex-col gap-4 p-4 overflow-hidden">
      <!-- Map Section (80%) -->
      <div class="flex-1 min-h-0">
        <MapContainer
          ref="mapContainer"
          :geofences="geofences"
          :vehicles="vehicles"
          :loading="loading"
          @geofence-created="handleGeofenceCreatedOnMap"
          @geofence-click="handleGeofenceClick"
          @geofence-edit="handleEditGeofence"
        />
      </div>

      <!-- Table Section (20%) -->
      <div class="h-1/5 overflow-y-auto">
        <GeofenceTable
          :geofences="geofences"
          :loading="loading"
          @create="handleOpenCreateModal"
          @view="handleGeofenceClick"
          @edit="handleEditGeofence"
          @delete="handleDeleteGeofence"
          @view-logs="handleViewLogs"
        />
      </div>
    </div>

    <!-- Create Form Modal -->
    <GeofenceFormModal
      :open="showCreateModal"
      :loading="submitting"
      :initial-map-data="mapClickData"
      @close="handleCloseCreateModal"
      @submit="handleCreateGeofence"
    />

    <!-- Edit Form Modal -->
    <GeofenceFormModal
      :open="showEditModal"
      :editing-geofence="editingGeofence"
      :loading="submitting"
      @close="handleCloseEditModal"
      @submit="handleUpdateGeofence"
    />

    <!-- View Details Modal -->
    <CustomModal
      :show="showDetailsModal"
      :title="selectedGeofence?.name || 'Details'"
      @close="handleCloseDetailsModal"
    >
      <div class="space-y-4" v-if="selectedGeofence">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">{{ $t('mapa.form.type') }}</p>
            <p class="font-semibold">{{ $t(`mapa.types.${selectedGeofence.type}`) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">{{ $t('mapa.form.status') }}</p>
            <p class="font-semibold">{{ $t(`mapa.status.${selectedGeofence.status}`) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">{{ $t('mapa.form.latitude') }}</p>
            <p class="font-semibold">{{ selectedGeofence.center_latitude }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">{{ $t('mapa.form.longitude') }}</p>
            <p class="font-semibold">{{ selectedGeofence.center_longitude }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">{{ $t('mapa.form.radius') }}</p>
            <p class="font-semibold">{{ selectedGeofence.radius }}m</p>
          </div>
        </div>
        <div v-if="selectedGeofence.description">
          <p class="text-sm text-gray-600">{{ $t('mapa.form.description') }}</p>
          <p>{{ selectedGeofence.description }}</p>
        </div>
        <div class="flex gap-3 justify-end pt-4">
          <BaseButton variant="secondary" @click="handleCloseDetailsModal">
            {{ $t('common.close') }}
          </BaseButton>
          <BaseButton variant="primary" @click="handleEditGeofence(selectedGeofence)">
            {{ $t('common.edit') }}
          </BaseButton>
        </div>
      </div>
    </CustomModal>

    <!-- View Logs Modal -->
    <GeofenceLogsModal
      :open="showLogsModal"
      :geofence="logsGeofence"
      :logs="geofenceLogs"
      :loading="loadingLogs"
      @close="handleCloseLogsModal"
    />

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :show="showDeleteModal"
      :title="$t('mapa.deleteZone')"
      :message="$t('mapa.deleteConfirm', { name: selectedGeofence?.name || '' })"
      type="danger"
      @close="handleCancelDelete"
      @confirm="handleConfirmDelete"
    >
    </BaseModal>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { BaseModal, BaseButton } from '@/components/base'
import MapContainer from '../components/MapContainer.vue'
import GeofenceTable from '../components/GeofenceTable.vue'
import GeofenceFormModal from '../components/GeofenceFormModal.vue'
import GeofenceLogsModal from '../components/GeofenceLogsModal.vue'
import CustomModal from '../components/CustomModal.vue'
import { geofenceService } from '../services/geofence.service'
import { vehicleService } from '../services/vehicle.service'
import type { Geofence, VehicleGeofenceLog, Vehicle } from '../types/geofence.types'
import { useTranslateError } from '@/shared/composables/useTranslateError'

const { success, error } = useToast()
const { t } = useI18n()
const { translateErrorMessage } = useTranslateError()

// State
const geofences = ref<Geofence[]>([])
const vehicles = ref<Vehicle[]>([])
const loading = ref(false)
const submitting = ref(false)
const loadingLogs = ref(false)

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const showLogsModal = ref(false)
const showDeleteModal = ref(false)

// Form states
const editingGeofence = ref<Geofence | undefined>()
const selectedGeofence = ref<Geofence | undefined>()
const logsGeofence = ref<Geofence | undefined>()
const geofenceLogs = ref<VehicleGeofenceLog[]>([])
const deletingGeofence = ref<Geofence | undefined>()
const mapClickData = ref<{ center_latitude: number; center_longitude: number; radius: number } | undefined>()

// Refs
// const mapContainer = ref<InstanceType<typeof MapContainer> | null>(null)

// Load geofences and vehicles
const loadGeofences = async () => {
  loading.value = true
  try {
    geofences.value = await geofenceService.getGeofences()
  } catch (errorMsg: any) {
    const translatedMessage = translateErrorMessage(errorMsg?.message)
    error(translatedMessage || t('mapa.loadError'))
  } finally {
    loading.value = false
  }
}

const loadVehicles = async () => {
  try {
    vehicles.value = await vehicleService.getVehicles()
  } catch (errors: any) {
    console.warn('Failed to load vehicles:', errors)
  }
}

// Map handlers
const handleGeofenceCreatedOnMap = async (data: { center_latitude: number; center_longitude: number; radius: number }): Promise<void> => {
  // Save the map click data and open modal with pre-filled coordinates
  mapClickData.value = data
  showCreateModal.value = true
}

const handleGeofenceClick = (geofence: Geofence) => {
  selectedGeofence.value = geofence
  showDetailsModal.value = true
}

const handleEditGeofence = (geofence: Geofence) => {
  editingGeofence.value = geofence
  selectedGeofence.value = undefined
  showDetailsModal.value = false
  showEditModal.value = true
}

const handleDeleteGeofence = (geofence: Geofence) => {
  deletingGeofence.value = geofence
  showDeleteModal.value = true
}

const handleViewLogs = async (geofence: Geofence) => {
  logsGeofence.value = geofence
  loadingLogs.value = true
  try {
    geofenceLogs.value = await geofenceService.getGeofenceLogs(geofence.geofence_id)
    showLogsModal.value = true
  } catch (errors: any) {
    error(errors.message || t('mapa.logsError'))
  } finally {
    loadingLogs.value = false
  }
}

// Modal handlers
const handleOpenCreateModal = () => {
  editingGeofence.value = undefined
  showCreateModal.value = true
}

const handleCloseCreateModal = () => {
  showCreateModal.value = false
  mapClickData.value = undefined
}

const handleCloseEditModal = () => {
  showEditModal.value = false
  editingGeofence.value = undefined
}

const handleCloseDetailsModal = () => {
  showDetailsModal.value = false
  selectedGeofence.value = undefined
}

const handleCloseLogsModal = () => {
  showLogsModal.value = false
  logsGeofence.value = undefined
  geofenceLogs.value = []
}

const handleCancelDelete = () => {
  showDeleteModal.value = false
  deletingGeofence.value = undefined
}

// Form submission handlers
const handleCreateGeofence = async (payload: any) => {
  submitting.value = true
  try {
    await geofenceService.createGeofence(payload)
    success(t('mapa.createSuccess'))
    handleCloseCreateModal()
    await loadGeofences()
  } catch (errors: any) {
    error(errors.message || t('mapa.createError'))
  } finally {
    submitting.value = false
  }
}

const handleUpdateGeofence = async (payload: any) => {
  if (!editingGeofence.value) return

  submitting.value = true
  try {
    await geofenceService.updateGeofence(editingGeofence.value.geofence_id, payload)
    success(t('mapa.updateSuccess'))
    handleCloseEditModal()
    await loadGeofences()
  } catch (errors: any) {
    error(errors.message || t('mapa.updateError'))
  } finally {
    submitting.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingGeofence.value) return

  submitting.value = true
  try {
    await geofenceService.deleteGeofence(deletingGeofence.value.geofence_id)
    success(t('mapa.deleteSuccess'))
    handleCancelDelete()
    await loadGeofences()
  } catch (errors: any) {
    error(errors.message || t('mapa.deleteError'))
  } finally {
    submitting.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadGeofences(), loadVehicles()])
})
</script>

<style scoped>
:deep(.leaflet-container) {
  z-index: 1;
}
</style>
