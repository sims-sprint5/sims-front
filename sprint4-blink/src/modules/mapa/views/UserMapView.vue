<template>
  <AppLayout :title="pageTitle">
    <div class="h-[calc(100dvh-64px)] md:h-[calc(100vh-64px)] flex flex-col p-3 sm:p-4 overflow-hidden">
      <div class="flex-1 min-h-0 flex gap-3 relative">
        <div class="absolute top-3 right-3 z-[1000]">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            @click="openReservationPanel"
            :aria-label="t('mapa.openReservationPanel')"
          >
            {{ t('mapa.openReservationPanel') }}
          </button>
        </div>

        <div class="flex-1 min-w-0 rounded-lg overflow-hidden shadow-lg">
          <div ref="mapEl" class="w-full h-full"></div>
        </div>

        <aside
          v-if="isReservationPanelOpen"
          class="absolute inset-y-0 right-0 z-[1200] w-full sm:w-[72%] md:static md:w-[48%] rounded-lg bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          role="complementary"
          :aria-label="t('mapa.reservationPanelTitle')"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 class="text-sm sm:text-base font-semibold text-gray-800">
              {{ t('mapa.reservationPanelTitle') }}
            </h2>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              @click="closeReservationPanel"
              :aria-label="t('mapa.closeReservationPanel')"
            >
              X
            </button>
          </div>

          <div class="h-full w-full overflow-auto">
            <ReservationPage :prefill="reservationPrefill" :hideAccessibility="true" />
          </div>
        </aside>
      </div>
    </div>

    <VehicleDetailsModal
      :open="isModalOpen"
      :car="selectedCar"
      @close="closeVehicleModal"
      @openReservation="openReservationFromVehicle"
      />
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import AppLayout from '@/layouts/AppLayout.vue'
import { geofenceService } from '../services/geofence.service'
import { vehicleService } from '@/modules/vehicles/services/vehicle.service'
import type { Geofence } from '../types/geofence.types'
import type { Vehicle } from '@/modules/vehicles/types/vehicle.types'
import VehicleDetailsModal from '../components/VehicleDetailsModal.vue'
import ReservationPage from '@/modules/reservations/views/ReservationPage.vue'

const route = useRoute()
const { t } = useI18n()

const pageTitle = computed(() => {
  const titleKey = route.meta.titleKey as string | undefined
  return titleKey ? t(titleKey) : ''
})

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let userMarker: L.Marker | null = null
const isReservationPanelOpen = ref(false)

const selectedCar = ref<Vehicle | null>(null)
const isModalOpen = ref(false)

const reservationPrefill = ref<Record<string, string> | null>(null)

const openReservationPanel = () => {
  isReservationPanelOpen.value = true
}

const openReservationFromVehicle = (payload: Record<string, string>) => {
  reservationPrefill.value = payload
  isReservationPanelOpen.value = true
}

const closeReservationPanel = () => {
  isReservationPanelOpen.value = false
}

const closeVehicleModal = () => {
  isModalOpen.value = false
  selectedCar.value = null
}

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const createGeofencePopup = (geofence: Geofence) => {
  const popupContent = document.createElement('div')
  popupContent.className = 'p-2'

  const title = document.createElement('b')
  title.textContent = geofence.name
  popupContent.appendChild(title)
  popupContent.appendChild(document.createElement('br'))

  if (geofence.description) {
    const description = document.createElement('div')
    description.textContent = geofence.description
    popupContent.appendChild(description)
  }

  return popupContent
}

const createPopupRow = (label: string, value: string) => {
  const row = document.createElement('div')
  row.textContent = `${label}: ${value}`
  return row
}

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

    circle.bindPopup(createGeofencePopup(geofence))

    circle.addTo(map!)
  })
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
          icon: defaultMarkerIcon
      }
    )

    const popupContent = document.createElement('div')
    popupContent.className = 'p-2'
    const title = document.createElement('b')
    title.textContent = vehicle.license_plate ?? ''
    popupContent.appendChild(title)
    popupContent.appendChild(document.createElement('br'))
    popupContent.appendChild(createPopupRow('Última actualización', String(vehicle.last_location_update || 'N/A')))
    marker.bindPopup(popupContent)

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
  await nextTick()
  initMap()

  try {
    const [geofences, vehicles] = await Promise.all([
      geofenceService.getGeofences(),
      vehicleService.getVehiclesList()
    ])

    renderGeofences(geofences)
    renderVehicles(vehicles)
  } catch (err) {
    console.warn('Failed to load map data:', err)
  }

  showUserLocation()
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
