export type GeofenceType = 'allowed' | 'restricted' | 'parking' | 'service_area'
export type GeofenceStatus = 'active' | 'inactive'
export type GeofenceEventType = 'entry' | 'exit' | 'violation'

export interface Geofence {
  geofence_id: number
  name: string
  description: string | null
  type: GeofenceType
  center_latitude: string | number
  center_longitude: string | number
  radius: number
  polygon_coordinates: PolygonCoordinate[] | null
  status: GeofenceStatus
  created_at: string
  updated_at: string
}

export interface PolygonCoordinate {
  latitude: string | number
  longitude: string | number
}

export interface Vehicle {
  vehicle_id: number
  license_plate: string
  current_latitude: string | number | null
  current_longitude: string | number | null
  last_location_update: string | null
}

export interface VehicleGeofenceLog {
  log_id: number
  vehicle_id: number
  geofence_id: number
  event_type: GeofenceEventType
  event_timestamp: string
  latitude: string | number
  longitude: string | number
  vehicle?: Vehicle
}

export interface CheckVehicleResponse {
  vehicle: Vehicle
  inside_geofences: Geofence[]
}

export interface CreateGeofenceData {
  name: string
  description?: string
  type: GeofenceType
  center_latitude: number
  center_longitude: number
  radius: number
  polygon_coordinates?: PolygonCoordinate[]
  status?: GeofenceStatus
}

export interface UpdateGeofenceData {
  name?: string
  description?: string
  type?: GeofenceType
  center_latitude?: number
  center_longitude?: number
  radius?: number
  polygon_coordinates?: PolygonCoordinate[]
  status?: GeofenceStatus
}

export interface GeofenceWithLogs extends Geofence {
  vehicleLogs?: VehicleGeofenceLog[]
}
