import { apiClient } from '@/shared/services/api.service'
import type { Vehicle } from '../types/geofence.types'

const BASE_URL = '/v1/vehicles'

const normalizeVehicle = (data: any): Vehicle => {
  return {
    vehicle_id: data.vehicle_id,
    license_plate: data.license_plate,
    current_latitude: data.current_latitude ? Number(data.current_latitude) : null,
    current_longitude: data.current_longitude ? Number(data.current_longitude) : null,
    last_location_update: data.last_location_update || null
  }
}

export const vehicleService = {
  async getVehicles(): Promise<Vehicle[]> {
    const raw = await apiClient.get<any>(BASE_URL)
    const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
    return list.map(normalizeVehicle)
  },

  async updateVehicleLocation(
    vehicleId: number,
    latitude: number,
    longitude: number
  ): Promise<Vehicle> {
    const raw = await apiClient.patch<any>(`${BASE_URL}/${vehicleId}/location`, {
      latitude,
      longitude
    })
    return normalizeVehicle(raw?.data ?? raw)
  }
} as const
