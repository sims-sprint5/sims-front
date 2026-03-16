import { apiClient } from '@/shared/services/api.service';
import { buildQuery } from '@/shared/utils/queryBuilder';
import type {
  CreateVehicleData,
  UpdateVehicleData,
  Vehicle,
  VehiclesResponse,
} from '../types/vehicle.types';

/** Normalitza un vehicle del backend als tipus del frontend */
function normalizeVehicle(raw: any): Vehicle {
  const yearRaw = raw.year ?? null;
  const year = yearRaw === null || yearRaw === undefined || yearRaw === '' ? null : Number(yearRaw);

  const latRaw = raw.current_latitude ?? raw.latitude ?? null;
  const lngRaw = raw.current_longitude ?? raw.longitude ?? null;

  const current_latitude = latRaw === null || latRaw === undefined || latRaw === '' ? null : Number(latRaw);
  const current_longitude = lngRaw === null || lngRaw === undefined || lngRaw === '' ? null : Number(lngRaw);

  return {
    id: raw.id ?? raw.vehicle_id ?? 0,
    vehicle_id: raw.vehicle_id ?? raw.id,
    license_plate: raw.license_plate ?? raw.licensePlate ?? '',
    brand: raw.brand ?? '',
    model: raw.model ?? '',
    year: Number.isFinite(year) ? year : null,
    color: raw.color ?? '',
    status: raw.status ?? '',
    current_latitude: Number.isFinite(current_latitude) ? current_latitude : null,
    current_longitude: Number.isFinite(current_longitude) ? current_longitude : null,
    last_location_update: raw.last_location_update ?? raw.lastLocationUpdate ?? null,
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  };
}

/** Normalitza una resposta paginada o array del backend */
function normalizeVehiclesResponse(raw: any): VehiclesResponse {
  if (Array.isArray(raw)) {
    return { data: raw.map(normalizeVehicle) };
  }
  if (Array.isArray(raw?.data)) {
    return { data: raw.data.map(normalizeVehicle), meta: raw.meta };
  }
  return { data: [] };
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export const vehicleService = {

  async getVehicles(page: number = 1, perPage: number = 10): Promise<VehiclesResponse> {
    const query = buildQuery({ page, per_page: perPage });
    const raw = await apiClient.get<any>(`/v1/vehicles${query}`);
    return normalizeVehiclesResponse(raw);
  },

  async getVehiclesList(page: number = 1, perPage: number = 200): Promise<Vehicle[]> {
    const response = await this.getVehicles(page, perPage);
    return Array.isArray(response.data) ? response.data : [];
  },

  async getVehicleById(id: number): Promise<Vehicle> {
    const raw = await apiClient.get<any>(`/v1/vehicles/${id}`);
    return normalizeVehicle(raw?.data ?? raw);
  },

  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    const payload: any = {
      license_plate: data.license_plate,
      brand: data.brand,
      model: data.model,
      year: toNumberOrNull(data.year),
      color: data.color,
      status: data.status,
      current_latitude: toNumberOrNull(data.current_latitude),
      current_longitude: toNumberOrNull(data.current_longitude),
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const raw = await apiClient.post<any>('/v1/vehicles', payload);
    return normalizeVehicle(raw?.data ?? raw);
  },

  async updateVehicle(id: number, data: UpdateVehicleData): Promise<Vehicle> {
    const payload: any = {};

    if (data.license_plate !== undefined) payload.license_plate = data.license_plate;
    if (data.brand !== undefined) payload.brand = data.brand;
    if (data.model !== undefined) payload.model = data.model;
    if (data.year !== undefined) payload.year = toNumberOrNull(data.year);
    if (data.color !== undefined) payload.color = data.color;
    if (data.status !== undefined) payload.status = data.status;
    if (data.current_latitude !== undefined) payload.current_latitude = toNumberOrNull(data.current_latitude);
    if (data.current_longitude !== undefined) payload.current_longitude = toNumberOrNull(data.current_longitude);

    const raw = await apiClient.patch<any>(`/v1/vehicles/${id}`, payload);
    return normalizeVehicle(raw?.data ?? raw);
  },

  async updateVehicleLocation(id: number, latitude: number, longitude: number): Promise<Vehicle> {
    const raw = await apiClient.patch<any>(`/v1/vehicles/${id}/location`, {
      latitude,
      longitude,
    });

    return normalizeVehicle(raw?.data ?? raw);
  },

  async deleteVehicle(id: number): Promise<void> {
    await apiClient.delete<void>(`/v1/vehicles/${id}`);
  },

  async searchVehicles(query: string): Promise<Vehicle[]> {
    const response = await this.getVehicles(1, 200);
    const vehicles = Array.isArray(response.data) ? response.data : [];

    const q = query.trim().toLowerCase();
    if (!q) return vehicles;

    return vehicles.filter(
      (v) =>
        (v.license_plate ?? '').toLowerCase().includes(q) ||
        (v.brand ?? '').toLowerCase().includes(q) ||
        (v.model ?? '').toLowerCase().includes(q),
    );
  },
} as const;

export type VehicleService = typeof vehicleService;

export { normalizeVehicle };
