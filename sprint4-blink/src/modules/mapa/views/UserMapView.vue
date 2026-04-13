<template>
  <AppLayout :title="pageTitle">
    <div class="h-[calc(100dvh-64px)] md:h-[calc(100vh-64px)] flex flex-col p-3 sm:p-4 overflow-hidden">
      <!-- Map takes full height -->
      <div class="flex-1 min-h-0 rounded-lg overflow-hidden shadow-lg">
        <div ref="mapEl" class="w-full h-full"></div>
      </div>
    </div>

    <VehicleDetailsModal
      :open="isModalOpen"
      :car="selectedCar"
      @close="closeVehicleModal"
      />
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AppLayout from '@/layouts/AppLayout.vue'
import { geofenceService } from '../services/geofence.service'
import { vehicleService } from '@/modules/vehicles/services/vehicle.service'
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service'
import { useUser } from '@/modules/auth/composables/useUser'
import type { Geofence } from '../types/geofence.types'
import type { Vehicle } from '@/modules/vehicles/types/vehicle.types'
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types'
import VehicleDetailsModal from '../components/VehicleDetailsModal.vue'

const route = useRoute()
const { t } = useI18n()
const { user } = useUser()

const pageTitle = computed(() => {
  const titleKey = route.meta.titleKey as string | undefined
  return titleKey ? t(titleKey) : ''
})

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let userMarker: L.Marker | null = null

const selectedCar = ref<Vehicle | null>(null)
const isModalOpen = ref(false)

const closeVehicleModal = () => {
  isModalOpen.value = false
  selectedCar.value = null
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

onMounted(async () => {
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
