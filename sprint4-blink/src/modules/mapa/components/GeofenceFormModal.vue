<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click.self="onClose"
      >
        <div class="bg-surface rounded-lg shadow-xl w-full mx-4 max-h-[90vh] overflow-y-auto"
             :class="isEditMode ? 'max-w-md' : 'max-w-2xl'">
          <!-- Header -->
          <div class="p-6 border-b border-default flex items-center justify-between sticky top-0 bg-surface z-10">
            <h2 class="text-lg font-semibold">
              {{ isEditMode ? $t('mapa.editZone') : $t('mapa.createZone') }}
            </h2>
            <BaseButton
              type="button"
              variant="muted"
              size="sm"
              class="!p-1 bg-transparent text-muted hover:text-main !shadow-none"
              @click="onClose"
            >
              ✕
            </BaseButton>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <!-- Mini map for coordinate selection (only on create) -->
            <div v-if="!isEditMode">
              <label class="block text-sm font-medium text-main mb-1">
                {{ $t('mapa.form.clickToSelect') }}
              </label>
              <div class="w-full h-72 rounded-lg overflow-hidden border border-default shadow">
                <div ref="miniMapEl" class="w-full h-full"></div>
              </div>
            </div>

            <!-- Name -->
            <BaseInput
              v-model="form.formData.name"
              type="text"
              :label="$t('mapa.form.name')"
              :placeholder="$t('mapa.form.namePlaceholder')"
              :error="form.errors.name ? $t(form.errors.name) : undefined"
              @blur="form.errors.name = form.validateName(form.formData.name)"
            />

            <!-- Description -->
            <BaseInput
              v-model="form.formData.description"
              type="text"
              :label="$t('mapa.form.description')"
              :placeholder="$t('mapa.form.descriptionPlaceholder')"
            />

            <!-- Type -->
            <div>
              <label class="block text-sm font-medium text-main mb-1">
                {{ $t('mapa.form.type') }}
              </label>
              <select
                v-model="form.formData.type"
                class="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                @blur="form.errors.type = form.validateType(form.formData.type)"
              >
                  <option
                    v-for="option in geofenceTypeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ $t(option.label) }}
                  </option>
              </select>
              <p v-if="form.errors.type" class="text-red-500 text-sm mt-1">
                {{ $t(form.errors.type) }}
              </p>
            </div>

            <!-- Center Latitude -->
            <BaseInput
              v-model.number="form.formData.center_latitude"
              type="number"
              :label="$t('mapa.form.latitude')"
              step="0.0001"
              :placeholder="$t('mapa.form.latitudePlaceholder')"
              :error="form.errors.center_latitude ? $t(form.errors.center_latitude) : undefined"
              @blur="form.errors.center_latitude = form.validateLatitude(form.formData.center_latitude)"
            />

            <!-- Center Longitude -->
            <BaseInput
              v-model.number="form.formData.center_longitude"
              type="number"
              :label="$t('mapa.form.longitude')"
              step="0.0001"
              :placeholder="$t('mapa.form.longitudePlaceholder')"
              :error="form.errors.center_longitude ? $t(form.errors.center_longitude) : undefined"
              @blur="form.errors.center_longitude = form.validateLongitude(form.formData.center_longitude)"
            />

            <!-- Radius -->
            <BaseInput
              v-model.number="form.formData.radius"
              type="number"
              :label="$t('mapa.form.radius')"
              :placeholder="$t('mapa.form.radiusPlaceholder')"
              :error="form.errors.radius ? $t(form.errors.radius) : undefined"
              @blur="form.errors.radius = form.validateRadius(form.formData.radius)"
            />

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-main mb-1">
                {{ $t('mapa.form.status') }}
              </label>
              <select
                v-model="form.formData.status"
                class="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">{{ $t('mapa.status.active') }}</option>
                <option value="inactive">{{ $t('mapa.status.inactive') }}</option>
              </select>
            </div>

            <!-- Submit and Cancel Buttons -->
            <div class="flex gap-3 justify-end mt-6">
              <BaseButton variant="secondary" @click="onClose">
                {{ $t('common.cancel') }}
              </BaseButton>
              <BaseButton
                variant="primary"
                :loading="props.loading"
                @click="handleSubmit"
              >
                {{ $t('common.save') }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, ref, nextTick, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BaseInput, BaseButton } from '@/components/base'
import { useGeofenceForm } from '../composables/useGeofenceForm'
import type { Geofence } from '../types/geofence.types'

const DEFAULT_MAP_CENTER: [number, number] = [41.3851, 2.1734]

const geofenceTypeOptions = [
  { value: 'allowed', label: 'mapa.types.allowed' },
  { value: 'restricted', label: 'mapa.types.restricted' },
  { value: 'parking', label: 'mapa.types.parking' },
  { value: 'service_area', label: 'mapa.types.service_area' }
] as const

interface GeofenceFormModalProps {
  open: boolean
  editingGeofence?: Geofence
  loading?: boolean
  initialMapData?: {
    center_latitude: number
    center_longitude: number
    radius: number
  }
}

const props = withDefaults(defineProps<GeofenceFormModalProps>(), {
  loading: false
})

const emit = defineEmits<{
  close: []
  submit: [payload: any]
}>()

const form = useGeofenceForm(props.editingGeofence)
const miniMapEl = ref<HTMLElement | null>(null)
const isEditMode = computed(() => !!props.editingGeofence)

let miniMap: L.Map | null = null
let marker: L.Marker | null = null
let previewCircle: L.Circle | null = null

// Initialize form with map data when provided
watch(() => props.initialMapData, (mapData) => {
  if (mapData) {
    form.formData.center_latitude = mapData.center_latitude
    form.formData.center_longitude = mapData.center_longitude
    form.formData.radius = mapData.radius
  }
}, { immediate: true })

const destroyMiniMap = () => {
  if (miniMap) {
    miniMap.remove()
    miniMap = null
  }
  marker = null
  previewCircle = null
}

const updatePreview = () => {
  if (!miniMap) return

  const lat = Number(form.formData.center_latitude)
  const lng = Number(form.formData.center_longitude)
  const radius = Number(form.formData.radius)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

  const latlng = L.latLng(lat, lng)

  // Update or create marker
  if (marker) {
    marker.setLatLng(latlng)
  } else {
    marker = L.marker(latlng).addTo(miniMap)
  }

  // Update or create preview circle
  if (radius > 0) {
    if (previewCircle) {
      previewCircle.setLatLng(latlng)
      previewCircle.setRadius(radius)
    } else {
      previewCircle = L.circle(latlng, {
        radius,
        color: 'rgb(38, 97, 156)',
        fillColor: 'rgb(38, 97, 156)',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(miniMap)
    }
  }
}

const initMiniMap = async () => {
  // Wait for DOM to be fully rendered after v-if
  await nextTick()
  await nextTick()

  if (!miniMapEl.value) return

  destroyMiniMap()

  miniMap = L.map(miniMapEl.value, {
    center: DEFAULT_MAP_CENTER,
    zoom: 13,
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      })
    ]
  })

  // On click → set lat/lng and place marker
  miniMap.on('click', (e: L.LeafletMouseEvent) => {
    const lat = parseFloat(e.latlng.lat.toFixed(6))
    const lng = parseFloat(e.latlng.lng.toFixed(6))

    form.formData.center_latitude = lat
    form.formData.center_longitude = lng

    updatePreview()
  })

  // Force resize in case container wasn't fully laid out
  setTimeout(() => miniMap?.invalidateSize(), 200)
}

const onClose = () => {
  form.resetForm()
  destroyMiniMap()
  emit('close')
}

const handleSubmit = () => {
  if (!form.validateAll()) return
  emit('submit', form.getPayload())
}

// Watch radius changes to update circle preview on mini map
watch(() => form.formData.radius, () => {
  updatePreview()
})

// Initialize mini map when modal opens (create mode only)
watch(() => props.open, async (isOpen) => {
  if (isOpen && !props.editingGeofence) {
    await initMiniMap()
  } else if (!isOpen) {
    destroyMiniMap()
  }
})

// Update form when editingGeofence changes
watch(() => props.editingGeofence, (g) => {
  if (g) form.updateFromGeofence(g)
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
