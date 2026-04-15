<template>
  <AppLayout :title="pageTitle">
    <div class="h-[calc(100dvh-64px)] md:h-[calc(100vh-64px)] flex flex-col p-3 sm:p-4 overflow-hidden">
      <div class="flex-1 min-h-0 flex gap-3 relative">
        <div class="absolute top-3 right-3 z-[1000]">
          <button type="button"
            class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            @click="openReservationPanel" :aria-label="t('mapa.openReservationPanel')">
            {{ t('mapa.openReservationPanel') }}
          </button>
        </div>

        <div class="flex-1 min-w-0 rounded-lg overflow-hidden shadow-lg">
          <div ref="mapEl" class="w-full h-full"></div>
        </div>

        <div v-if="isReservationPanelOpen" v-show="!isReservationCreateModalOpen"
          class="absolute inset-0 z-[1100] bg-black/20 backdrop-blur-[1px] md:hidden" @click="closeReservationPanel"
          aria-hidden="true" />

        <aside v-if="isReservationPanelOpen" v-show="!isReservationCreateModalOpen"
          class="absolute right-3 top-16 bottom-3 z-[1200] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] rounded-2xl bg-white/95 shadow-2xl border border-gray-200 overflow-hidden flex flex-col backdrop-blur-sm"
          :style="reservationPanelStyle" role="complementary" :aria-label="t('mapa.reservationPanelTitle')">
          <div
            class="hidden sm:block absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-transparent hover:bg-primary-100/50"
            @mousedown.prevent="startPanelResize" aria-hidden="true" />

          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 bg-gray-50/90">
            <h2 class="text-sm sm:text-base font-semibold text-gray-800">
              {{ t('mapa.reservationPanelTitle') }}
            </h2>
            <button type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              @click="closeReservationPanel" :aria-label="t('mapa.closeReservationPanel')">
              X
            </button>
          </div>

          <div class="h-full w-full overflow-auto">
            <ReservationPage :key="reservationPageKey" :prefill="reservationPrefill" :hideAccessibility="true"
              @reservationModalVisibility="onReservationModalVisibility" />
          </div>
        </aside>
      </div>
    </div>

    <VehicleDetailsModal :open="isModalOpen" :car="selectedCar" @close="closeVehicleModal"
      @openReservation="openReservationFromVehicle" />

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showQuickReservationModal" class="fixed inset-0 z-[1400] overflow-y-auto" role="dialog"
          aria-modal="true" aria-labelledby="quick-reservation-title">
          <div class="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              @click="closeQuickReservationModal" />
            <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div
              class="inline-block w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
              <div class="px-6 py-5">
                <h2 id="quick-reservation-title" class="text-xl font-semibold text-gray-900">
                  {{ t('reservations.createTitle') }}
                </h2>
                <p class="mt-1 text-sm text-gray-500">
                  {{ t('reservations.createDescription') }}
                </p>

                <p class="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  {{ quickReservationVehicleName }} · {{ t('reservations.selectDates') }}
                </p>

                <div class="mt-6 space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('reservations.table.startAt')
                      }}</label>
                    <input v-model="quickReservationForm.startAt" type="datetime-local"
                      class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('reservations.table.endAt')
                      }}</label>
                    <input v-model="quickReservationForm.endAt" type="datetime-local"
                      class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  </div>
                </div>
              </div>

              <div
                class="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                <BaseButton variant="secondary" :disabled="submittingQuickReservation"
                  @click="closeQuickReservationModal">
                  {{ t('common.cancel') }}
                </BaseButton>
                <BaseButton :loading="submittingQuickReservation" @click="submitQuickReservation">
                  {{ t('reservations.actions.createReservation') }}
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick, computed, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BaseButton } from '@/components/base'
import AppLayout from '@/layouts/AppLayout.vue'
import { geofenceService } from '../services/geofence.service'
import { vehicleService } from '@/modules/vehicles/services/vehicle.service'
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service'
import { useUser } from '@/modules/auth/composables/useUser'
import { useToast } from '@/shared/composables/useToast'
import type { Geofence } from '../types/geofence.types'
import type { Vehicle } from '@/modules/vehicles/types/vehicle.types'
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types'
import VehicleDetailsModal from '../components/VehicleDetailsModal.vue'
import ReservationPage from '@/modules/reservations/views/ReservationPage.vue'

const route = useRoute()
const { t } = useI18n()
const { user } = useUser()
const toast = useToast()

const pageTitle = computed(() => {
  const titleKey = route.meta.titleKey as string | undefined
  return titleKey ? t(titleKey) : ''
})

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let userMarker: L.Marker | null = null
const isReservationPanelOpen = ref(false)
const isReservationCreateModalOpen = ref(false)
const reservationPanelWidth = ref(0)
const isResizingPanel = ref(false)

const selectedCar = ref<Vehicle | null>(null)
const isModalOpen = ref(false)

const reservationPrefill = ref<Record<string, string> | null>(null)
const reservationPageKey = ref(0)
const quickReservationPayload = ref<Record<string, string> | null>(null)
const showQuickReservationModal = ref(false)
const submittingQuickReservation = ref(false)
const quickReservationForm = reactive({
  startAt: '',
  endAt: '',
})

const PANEL_SIDE_GAP_PX = 24
const PANEL_RIGHT_OFFSET_PX = 12

const clampPanelWidth = (width: number): number => {
  const maxWidth = Math.max(320, window.innerWidth - PANEL_SIDE_GAP_PX)
  const minWidth = window.innerWidth < 640 ? Math.min(300, maxWidth) : 360
  return Math.min(maxWidth, Math.max(minWidth, width))
}

const getDefaultPanelWidth = (): number => {
  const viewport = window.innerWidth
  if (viewport < 640) return viewport - PANEL_SIDE_GAP_PX
  if (viewport < 768) return 33 * 16
  if (viewport < 1024) return 42 * 16
  return 53 * 16
}

const reservationPanelStyle = computed(() => {
  if (!reservationPanelWidth.value) return undefined
  return {
    width: `${reservationPanelWidth.value}px`,
    maxWidth: 'calc(100% - 1.5rem)'
  }
})

const syncPanelWidthToViewport = () => {
  const target = reservationPanelWidth.value || getDefaultPanelWidth()
  reservationPanelWidth.value = clampPanelWidth(target)
}

const onPanelResizeMove = (event: MouseEvent) => {
  if (!isResizingPanel.value) return
  const newWidth = window.innerWidth - event.clientX - PANEL_RIGHT_OFFSET_PX
  reservationPanelWidth.value = clampPanelWidth(newWidth)
}

const stopPanelResize = () => {
  if (!isResizingPanel.value) return
  isResizingPanel.value = false
  document.body.classList.remove('select-none', 'cursor-ew-resize')
  window.removeEventListener('mousemove', onPanelResizeMove)
  window.removeEventListener('mouseup', stopPanelResize)
}

const startPanelResize = (event: MouseEvent) => {
  if (window.innerWidth < 640) return
  isResizingPanel.value = true
  document.body.classList.add('select-none', 'cursor-ew-resize')
  onPanelResizeMove(event)
  window.addEventListener('mousemove', onPanelResizeMove)
  window.addEventListener('mouseup', stopPanelResize)
}

const toDateTimeLocalInput = (value: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

const quickReservationVehicleName = computed(() => {
  const p = quickReservationPayload.value
  if (!p) return ''
  return [p.brand, p.model].filter(Boolean).join(' ').trim() || p.licensePlate || '—'
})

const openReservationPanel = () => {
  reservationPageKey.value += 1
  reservationPrefill.value = null
  syncPanelWidthToViewport()
  isReservationPanelOpen.value = true
}

const openReservationFromVehicle = (payload: Record<string, string>) => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  quickReservationPayload.value = payload
  quickReservationForm.startAt = payload.startAt || toDateTimeLocalInput(now)
  quickReservationForm.endAt = payload.endAt || toDateTimeLocalInput(tomorrow)
  isReservationPanelOpen.value = false
  showQuickReservationModal.value = true
}

const closeQuickReservationModal = () => {
  showQuickReservationModal.value = false
  quickReservationPayload.value = null
  quickReservationForm.startAt = ''
  quickReservationForm.endAt = ''
}

const closeReservationPanel = () => {
  isReservationPanelOpen.value = false
  isReservationCreateModalOpen.value = false
  reservationPrefill.value = null
}

const onReservationModalVisibility = (open: boolean) => {
  isReservationCreateModalOpen.value = open
}

const closeVehicleModal = () => {
  isModalOpen.value = false
  selectedCar.value = null
}

const normalizeDateTime = (value: string): string => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}

const submitQuickReservation = async () => {
  if (!quickReservationPayload.value || submittingQuickReservation.value) return

  const statusKey = String(quickReservationPayload.value.status ?? '').trim().toLowerCase()
  const availableRaw = String(quickReservationPayload.value.available ?? '').trim().toLowerCase()
  const blockedByStatus = ['reserved', 'maintenance', 'inactive', 'out_of_service', 'rented'].includes(statusKey)
  const explicitlyUnavailable = availableRaw === 'false'
  if (blockedByStatus || explicitlyUnavailable) {
    toast.error(t('vehicles.errors.notAvailable'))
    return
  }

  if (!quickReservationForm.startAt || !quickReservationForm.endAt) {
    toast.error(t('reservations.errors.missingDates'))
    return
  }

  const startDate = new Date(quickReservationForm.startAt)
  const endDate = new Date(quickReservationForm.endAt)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
    toast.error(t('reservations.errors.invalidDates'))
    return
  }

  submittingQuickReservation.value = true
  try {
    await reservationLogService.createLog({
      user_id: user.value?.id ?? null,
      user_name: user.value?.name ?? 'N/A',
      vehicle_id: Number(quickReservationPayload.value.vehicleId) || 0,
      vehicle_name: quickReservationVehicleName.value || quickReservationPayload.value.licensePlate || 'N/A',
      license_plate: quickReservationPayload.value.licensePlate || '',
      status: 'active',
      start_at: normalizeDateTime(quickReservationForm.startAt),
      end_at: normalizeDateTime(quickReservationForm.endAt),
    })

    toast.success(t('reservations.toast.created'))
    closeQuickReservationModal()
  } finally {
    submittingQuickReservation.value = false
  }
}

const vehicleIcon = L.divIcon({
  html: '<i class="fas fa-car" style="color: #000000; font-size: 24px;"></i>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  className: 'vehicle-marker'
})

const getColorByType = (type: string): string => {
  const colors: Record<string, string> = {
    allowed: '#22c55e',
    restricted: '#ef4444',
    parking: '#3b82f6',
    service_area: '#f97316'
  }
  return colors[type] || '#6366f1'
}

const parseCoordinate = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const renderGeofences = (geofences: Geofence[]) => {
  if (!map) return

  geofences.forEach(geofence => {
    const lat = parseCoordinate(geofence.center_latitude)
    const lng = parseCoordinate(geofence.center_longitude)
    if (lat == null || lng == null) return

    const circle = L.circle(
      [lat, lng],
      {
        radius: geofence.radius,
        color: getColorByType(geofence.type),
        fillColor: getColorByType(geofence.type),
        fillOpacity: 0.2,
        weight: 2,
        dashArray: geofence.status === 'inactive' ? '5, 5' : undefined
      }
    )

    circle.addTo(map!)
  })
}

const selectUserReservedVehicleId = (reservations: ReservationLog[]): number | null => {
  const now = new Date()
  const activeNow = reservations.find((r) => {
    if (r.status !== 'active') return false
    const start = new Date(r.start_at)
    const end = new Date(r.end_at)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
    return start <= now && now < end
  })

  if (activeNow) return Number(activeNow.vehicle_id)
  return null
}

const isVehicleAvailableNow = (vehicle: Vehicle): boolean => {
  const statusKey = String(vehicle.status ?? '').trim().toLowerCase()
  const now = new Date()

  if (statusKey === 'maintenance' || statusKey === 'inactive' || statusKey === 'out_of_service' || statusKey === 'rented') {
    return false
  }

  if (statusKey === 'reserved' && vehicle.next_reservation?.start_date) {
    const start = new Date(vehicle.next_reservation.start_date)
    if (!Number.isNaN(start.getTime()) && start > now) return true
  }

  if (vehicle.available === true) return true
  if (vehicle.available === false) return false
  return statusKey === 'available' || statusKey === 'active'
}

const filterVehiclesForUserMap = (vehicles: Vehicle[], reservations: ReservationLog[]): Vehicle[] => {
  const reservedVehicleId = selectUserReservedVehicleId(reservations)
  if (reservedVehicleId !== null && Number.isFinite(reservedVehicleId)) {
    return vehicles.filter((v) => Number(v.vehicle_id ?? v.id) === reservedVehicleId)
  }

  return vehicles.filter((v) => isVehicleAvailableNow(v))
}

const renderVehicles = (vehicles: Vehicle[]) => {
  if (!map) return

  vehicles.forEach(vehicle => {
    const lat = parseCoordinate(vehicle.current_latitude)
    const lng = parseCoordinate(vehicle.current_longitude)
    if (lat == null || lng == null) return

    const marker = L.marker(
      [lat, lng],
      {
        title: vehicle.license_plate,
        icon: vehicleIcon
      }
    )

    marker.on('click', () => {
      selectedCar.value = vehicle
      isModalOpen.value = true
    })

    marker.addTo(map!)
  })
}

const showUserLocation = () => {
  if (!map || !navigator.geolocation) return

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords
      const latlng = L.latLng(latitude, longitude)

      if (userMarker) {
        userMarker.setLatLng(latlng)
      } else {
        userMarker = L.marker(latlng, {
          icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
        }).addTo(map!)

        userMarker.bindPopup('<b>Tu ubicación</b>')
      }

      map!.setView(latlng, 15)
    },
    () => {
      // Geolocation denied or unavailable — stay on default center
    }
  )
}

const initMap = () => {
  if (!mapEl.value) return

  map = L.map(mapEl.value, {
    center: [41.3851, 2.1734],
    zoom: 13,
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      })
    ]
  })

  setTimeout(() => map?.invalidateSize(), 200)
}

watch(isReservationPanelOpen, async () => {
  await nextTick()
  map?.invalidateSize()
})

onMounted(async () => {
  syncPanelWidthToViewport()
  window.addEventListener('resize', syncPanelWidthToViewport)

  await nextTick()
  initMap()

  try {
    const isAdminRole = user.value?.role === 'admin' || user.value?.role === 'superadmin'

    const [geofences, vehiclesResponse, reservations] = await Promise.all([
      geofenceService.getGeofences(),
      vehicleService.getVehiclesCalendar(1, 500),
      isAdminRole ? Promise.resolve([]) : reservationLogService.getMyReservations(),
    ])

    const vehicles = Array.isArray(vehiclesResponse?.data) ? vehiclesResponse.data : []
    renderGeofences(geofences)
    renderVehicles(isAdminRole ? vehicles : filterVehiclesForUserMap(vehicles, reservations))
  } catch (err) {
    console.warn('Failed to load map data:', err)
  }

  showUserLocation()
})

onBeforeUnmount(() => {
  stopPanelResize()
  window.removeEventListener('resize', syncPanelWidthToViewport)
})
</script>

<style scoped>
:deep(.leaflet-container) {
  z-index: 1;
}

:deep(.user-location-marker) {
  background: transparent;
  border: none;
}
</style>
