<template>
  <AppLayout>
    <div class="h-[calc(100vh-64px)] flex flex-col p-4 overflow-hidden">
      <!-- Map takes full height -->
      <div class="flex-1 min-h-0 rounded-lg overflow-hidden shadow-lg">
        <div ref="mapEl" class="w-full h-full"></div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue'
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

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let userMarker: L.Marker | null = null

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const createPopupRow = (label: string, value: string) => {
  const row = document.createElement('div')
  row.textContent = `${label}: ${value}`
  return row
}

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

const createVehiclePopup = (vehicle: MapVehicle) => {
  const popupContent = document.createElement('div')
  popupContent.className = 'p-2'

  const title = document.createElement('b')
  title.textContent = vehicle.license_plate ?? ''
  popupContent.appendChild(title)
  popupContent.appendChild(document.createElement('br'))
  popupContent.appendChild(createPopupRow('Última actualización', String(vehicle.last_location_update || 'N/A')))

  return popupContent
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

const renderVehicles = (vehicles: MapVehicle[]) => {
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

    marker.bindPopup(createVehiclePopup(vehicle))

    marker.addTo(map!)
  })
}

const toMapVehicle = (vehicle: ServiceVehicle): MapVehicle => ({
  vehicle_id: vehicle.vehicle_id ?? vehicle.id,
  license_plate: vehicle.license_plate,
  current_latitude: vehicle.current_latitude,
  current_longitude: vehicle.current_longitude,
  last_location_update: vehicle.last_location_update
})

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

  let vehicles: Vehicle[] = []
  try {
    vehicles = await vehicleService.getVehiclesList()
    renderVehicles(vehicles)
  } catch (err) {
    console.warn('Failed to load vehicles:', err)
  }

  try {
    const geofences: Geofence[] = await geofenceService.getGeofencesForUserMap()
    renderGeofences(geofences)
  } catch (err) {
    console.warn('Failed to load geofences:', err)
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
