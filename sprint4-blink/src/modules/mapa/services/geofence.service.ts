import { apiClient } from '@/shared/services/api.service'
import type {
  Geofence,
  CheckVehicleResponse,
  CreateGeofenceData,
  UpdateGeofenceData,
  VehicleGeofenceLog,
  GeofenceWithLogs
} from '../types/geofence.types'

const BASE_URL = '/v1/geofences'

const normalizeGeofence = (data: any): Geofence => {
  return {
    geofence_id: data.geofence_id,
    name: data.name,
    description: data.description || null,
    type: data.type,
    center_latitude: Number(data.center_latitude),
    center_longitude: Number(data.center_longitude),
    radius: data.radius,
    polygon_coordinates: data.polygon_coordinates || null,
    status: data.status || 'active',
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}

export const geofenceService = {
  async getGeofences(): Promise<Geofence[]> {
    const raw = await apiClient.get<any>(BASE_URL)
    const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
    return list.map(normalizeGeofence)
  },

  async getGeofencesForUserMap(): Promise<Geofence[]> {
    try {
      return await this.getGeofences()
    } catch (err: any) {
      const status = err && typeof err === 'object' && 'status' in err ? Number(err.status) : null

      // If backend protects /geofences by role (403), silently return empty array for normal users.
      if (status === 403) {
        return []
      }

      // For other errors, re-throw (network, 500, etc.)
      throw err
    }
  },

  async getGeofenceById(id: number): Promise<GeofenceWithLogs> {
    const raw = await apiClient.get<any>(`${BASE_URL}/${id}`)
    const entity = raw?.data ?? raw
    const geofence = normalizeGeofence(entity)
    return {
      ...geofence,
      vehicleLogs: entity.vehicleLogs || entity.vehicle_logs || []
    }
  },

  async createGeofence(payload: CreateGeofenceData): Promise<Geofence> {
    const raw = await apiClient.post<any>(BASE_URL, payload)
    return normalizeGeofence(raw?.data ?? raw)
  },

  async updateGeofence(id: number, payload: UpdateGeofenceData): Promise<Geofence> {
    const raw = await apiClient.patch<any>(`${BASE_URL}/${id}`, payload)
    return normalizeGeofence(raw?.data ?? raw)
  },

  async deleteGeofence(id: number): Promise<{ message: string }> {
    const raw = await apiClient.delete<any>(`${BASE_URL}/${id}`)
    return raw?.data ?? raw
  },

  async checkVehicleInGeofences(
    vehicleId: number,
    latitude: number,
    longitude: number
  ): Promise<CheckVehicleResponse> {
    const raw = await apiClient.post<any>('/v1/geofences/check-vehicle', {
      vehicle_id: vehicleId,
      latitude,
      longitude
    })
    const responseData = raw?.data ?? raw
    return {
      vehicle: responseData.vehicle,
      inside_geofences: (responseData.inside_geofences || []).map(normalizeGeofence)
    }
  },

  async getGeofenceLogs(geofenceId: number): Promise<VehicleGeofenceLog[]> {
    const raw = await apiClient.get<any>(`${BASE_URL}/${geofenceId}/logs`)
    const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
    return list.map((log: any) => log)
  }
} as const
