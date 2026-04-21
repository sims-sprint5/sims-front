<template>
  <div class="w-full h-full rounded-lg overflow-hidden shadow-lg">
    <div ref="mapContainer" class="w-full h-full"></div>

    <VehicleDetailsModal
      :open="isModalOpen"
      :car="selectedCar"
      @close="closeVehicleModal"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import type { Geofence } from '../types/geofence.types'
import type { Vehicle as Car } from '@/modules/vehicles/types/vehicle.types'
import VehicleDetailsModal from './VehicleDetailsModal.vue'

interface MapEmits {
  (e: 'geofence-created', data: { center_latitude: number; center_longitude: number; radius: number }): void
  (e: 'geofence-click', geofence: Geofence): void
  (e: 'geofence-edit', geofence: Geofence): void
}

const props = defineProps<{
  geofences: Geofence[]
  vehicles?: Car[]
  loading?: boolean
}>()

const emit = defineEmits<MapEmits>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
const geofenceLayersMap = new Map<number, L.Circle>()
const vehicleMarkersMap = new Map<number, L.Marker>()
let userLocationMarker: L.CircleMarker | null = null

const selectedCar = ref<Car | null>(null)
const isModalOpen = ref(false)

const closeVehicleModal = () => {
  isModalOpen.value = false
  selectedCar.value = null
}

const logMapWarning = (message: string, details?: unknown) => {
  if (import.meta.env.DEV) {
    console.warn(`[mapa] ${message}`, details)
  }
}

const vehicleIcon = L.divIcon({
  html: '<i class="fas fa-car" style="color: #000000; font-size: 24px;"></i>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  className: 'vehicle-marker'
})

const createPopupRow = (label: string, value: string) => {
  const row = document.createElement('div')
  row.textContent = `${label}: ${value}`
  return row
}

const initMap = () => {
  if (!mapContainer.value) return

  // Create map centered on Barcelona
  map = L.map(mapContainer.value, {
    center: [41.3851, 2.1734],
    zoom: 13,
    layers: [L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    })]
  })

  // Initialize Geoman for drawing
  if (map.pm) {
    map.pm.addControls({
      position: 'topleft',
      drawText: false,
      dragMarker: true,
      pinningOption: false,
      snappingOption: true,
      drawPolyline: false,
      drawPolygon: false,
      drawRectangle: false,
      drawCircle: true,
      drawMarker: false,
      editMode: false,
      dragMode: false,
      cutPolygon: false,
      rotateMode: false
    })

    // Listen for circle creation
    map.on('pm:create', (e: any) => {
      if (e.shape === 'Circle') {
        const circle = e.layer as L.Circle
        const center = circle.getLatLng()
        const radius = Math.round(circle.getRadius())
        emit('geofence-created', {
          center_latitude: center.lat,
          center_longitude: center.lng,
          radius
        })
        // Remove the drawn circle from map
        circle.remove()
      }
    })
  }

  renderGeofences()
  renderVehicles()
  getUserLocation()
}

const getUserLocation = () => {
  // Note: Geolocation API works on localhost without HTTPS, but requires HTTPS on production
  // Once HTTPS is configured (with lvh.me), this will work on all domains
  
  if (!navigator.geolocation) {
    logMapWarning('Geolocation is not supported by this browser')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      
      if (map) {
        // Remove existing user location marker
        if (userLocationMarker) {
          userLocationMarker.remove()
        }

        // Create a new circle marker for user location
        userLocationMarker = L.circleMarker([latitude, longitude], {
          radius: 8,
          color: '#dc2626',
          fillColor: '#ef4444',
          fillOpacity: 0.9,
          weight: 2
        })

        const popupContainer = document.createElement('div')
        popupContainer.className = 'p-2'
        const title = document.createElement('b')
        title.textContent = 'Tu ubicación'
        popupContainer.appendChild(title)
        popupContainer.appendChild(document.createElement('br'))
        popupContainer.appendChild(createPopupRow('Lat', latitude.toFixed(4)))
        popupContainer.appendChild(createPopupRow('Lon', longitude.toFixed(4)))

        userLocationMarker.bindPopup(popupContainer)
        userLocationMarker.addTo(map)

        // Center map on user location (optional, uncomment if desired)
        // map.setView([latitude, longitude], 15)
      }
    },
    (error) => {
      logMapWarning('Error getting user location', error.message)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

const getColorByType = (type: string): string => {
  const colors: Record<string, string> = {
    allowed: '#22c55e',      // green
    restricted: '#ef4444',   // red
    parking: '#3b82f6',      // blue
    service_area: '#f97316'  // orange
  }
  return colors[type] || '#6366f1'
}

const renderGeofences = () => {
  if (!map) return

  // Clear existing geofence circles
  geofenceLayersMap.forEach(circle => circle.remove())
  geofenceLayersMap.clear()

  props.geofences.forEach(geofence => {
    const circle = L.circle(
      [Number(geofence.center_latitude), Number(geofence.center_longitude)],
      {
        radius: geofence.radius,
        color: getColorByType(geofence.type),
        fillColor: getColorByType(geofence.type),
        fillOpacity: 0.3,
        weight: 2,
        dashArray: geofence.status === 'inactive' ? '5, 5' : undefined
      }
    )

    // Click event to select geofence
    circle.on('click', () => {
      emit('geofence-click', geofence)
    })

    // Double click to edit
    circle.on('dblclick', () => {
      emit('geofence-edit', geofence)
    })

    circle.addTo(map!)
    geofenceLayersMap.set(geofence.geofence_id, circle)
  })
}

const renderVehicles = () => {
  if (!map || !props.vehicles) return

  // Clear existing vehicle markers
  vehicleMarkersMap.forEach(marker => marker.remove())
  vehicleMarkersMap.clear()

  props.vehicles.forEach(vehicle => {
    if (vehicle.current_latitude != null && vehicle.current_longitude != null) {
      const vehicleId = Number(vehicle.vehicle_id ?? vehicle.id)
      if (!Number.isFinite(vehicleId)) return

      const marker = L.marker(
        [Number(vehicle.current_latitude), Number(vehicle.current_longitude)],
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
      vehicleMarkersMap.set(vehicleId, marker)
    }
  })
}

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onBeforeUnmount(() => {
  geofenceLayersMap.forEach(circle => circle.remove())
  geofenceLayersMap.clear()
  vehicleMarkersMap.forEach(marker => marker.remove())
  vehicleMarkersMap.clear()
  userLocationMarker?.remove()
  userLocationMarker = null
  map?.remove()
  map = null
})

// Watch for changes in geofences and vehicles
watch(() => props.geofences.map((g) => [
  g.geofence_id,
  g.center_latitude,
  g.center_longitude,
  g.radius,
  g.status,
  g.type,
]), () => {
  renderGeofences()
})

watch(() => (props.vehicles ?? []).map((v) => [
  v.vehicle_id,
  v.current_latitude,
  v.current_longitude,
  v.last_location_update,
]), () => {
  renderVehicles()
})

const fitBounds = () => {
  if (!map || geofenceLayersMap.size === 0) return
  const group = new L.FeatureGroup(Array.from(geofenceLayersMap.values()))
  map.fitBounds(group.getBounds(), { padding: L.point(50, 50) })
}

defineExpose({
  fitBounds
})
</script>

<style scoped>
:deep(.leaflet-container) {
  font-family: inherit;
}
</style>
