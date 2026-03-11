<template>
  <div class="w-full h-full rounded-lg overflow-hidden shadow-lg">
    <div ref="mapContainer" class="w-full h-full"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import type { Geofence, Vehicle } from '../types/geofence.types'

interface MapEmits {
  (e: 'geofence-created', data: { center_latitude: number; center_longitude: number; radius: number }): void
  (e: 'geofence-click', geofence: Geofence): void
  (e: 'geofence-edit', geofence: Geofence): void
}

const props = defineProps<{
  geofences: Geofence[]
  vehicles?: Vehicle[]
  loading?: boolean
}>()

const emit = defineEmits<MapEmits>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
const geofenceLayersMap = new Map<number, L.Circle>()
const vehicleMarkersMap = new Map<number, L.Marker>()
let userLocationMarker: L.Marker | null = null

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
    console.warn('Geolocation is not supported by this browser')
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

        // Create a new marker for user location
        userLocationMarker = L.marker([latitude, longitude], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          }),
          title: 'Mi ubicación'
        })

        const popupContent = `
          <div class="p-2">
            <b>Tu ubicación</b><br/>
            Lat: ${latitude.toFixed(4)}<br/>
            Lon: ${longitude.toFixed(4)}
          </div>
        `
        userLocationMarker.bindPopup(popupContent)
        userLocationMarker.addTo(map)

        // Center map on user location (optional, uncomment if desired)
        // map.setView([latitude, longitude], 15)
      }
    },
    (error) => {
      console.warn('Error getting user location:', error.message)
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

    // Add popup with geofence info
    const popupContent = `
      <div class="p-2">
        <b>${geofence.name}</b><br/>
        Type: ${geofence.type}<br/>
        Radius: ${geofence.radius}m<br/>
        Status: ${geofence.status}
      </div>
    `
    circle.bindPopup(popupContent)

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
    if (vehicle.current_latitude && vehicle.current_longitude) {
      const marker = L.marker(
        [Number(vehicle.current_latitude), Number(vehicle.current_longitude)],
        {
          title: vehicle.license_plate,
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }
      )

      const popupContent = `
        <div class="p-2">
          <b>Vehículo</b><br/>
          Placa: ${vehicle.license_plate}<br/>
          Última actualización: ${vehicle.last_location_update || 'N/A'}
        </div>
      `
      marker.bindPopup(popupContent)
      marker.addTo(map!)
      vehicleMarkersMap.set(vehicle.vehicle_id, marker)
    }
  })
}

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

// Watch for changes in geofences and vehicles
watch(() => props.geofences, () => {
  renderGeofences()
}, { deep: true })

watch(() => props.vehicles, () => {
  renderVehicles()
}, { deep: true })

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
