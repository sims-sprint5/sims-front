import { apiClient } from '@/shared/services/api.service'
import { buildQuery } from '@/shared/utils/queryBuilder'
import type {
  Geofence,
  CheckVehicleResponse,
  CreateGeofenceData,
  UpdateGeofenceData,
  VehicleGeofenceLog,
  GeofenceWithLogs
} from '../types/geofence.types'

const BASE_URL = '/v1/geofences'

interface PaginationMeta {
  current_page?: number
  last_page?: number
}

const normalizeListResponse = (raw: any): { data: any[]; meta?: PaginationMeta } => {
  if (Array.isArray(raw)) return { data: raw }

  if (Array.isArray(raw?.data)) {
    return { data: raw.data, meta: raw?.meta }
  }

  if (Array.isArray(raw?.data?.data)) {
    return {
      data: raw.data.data,
      meta: raw.data.meta ?? { current_page: raw.data.current_page, last_page: raw.data.last_page }
    }
  }

  return { data: [] }
}

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
  async getGeofences(perPage: number = 200): Promise<Geofence[]> {
    const all: Geofence[] = []
    let page = 1

    while (true) {
      const query = buildQuery({ page, per_page: perPage })
      const raw = await apiClient.get<any>(`${BASE_URL}${query}`)
      const { data, meta } = normalizeListResponse(raw)

      all.push(...data.map(normalizeGeofence))

      if (meta?.last_page) {
        if (page >= meta.last_page) break
      } else {
        if (data.length < perPage) break
      }

      page += 1
    }

    return all
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
