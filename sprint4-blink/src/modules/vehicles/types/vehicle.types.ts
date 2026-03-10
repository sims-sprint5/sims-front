/**
 * Tipos relacionados con vehículos
 */

export interface Vehicle {
  id: number;
  vehicle_id?: number; // Alias del backend (PK real)
  license_plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string;
  status: string;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleData {
  license_plate: string;
  brand: string;
  model: string;
  year: string | number;
  color: string;
  status: string;
  current_latitude: string | number;
  current_longitude: string | number;
}

export interface UpdateVehicleData {
  license_plate?: string;
  brand?: string;
  model?: string;
  year?: string | number;
  color?: string;
  status?: string;
  current_latitude?: string | number;
  current_longitude?: string | number;
}

export interface VehiclesResponse {
  data: Vehicle[];
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

