/**
 * Types related to vehicles
 */

export interface NextReservation {
  start_date: string;
  end_date: string;
  user_name: string;
  user_id?: number;
}

export interface CalendarReservation {
  start_date: string;
  end_date: string;
  user_name?: string;
  user_id?: number;
  status?: string;
  calendar_state?: string;
}

export interface Vehicle {
  id: number;
  vehicle_id?: number; // Backend alias (real PK)
  license_plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string;
  status: string;
  available?: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: string | null;
  created_at: string;
  updated_at: string;
  next_reservation?: NextReservation | null;
  next_available_at?: string | null;
  calendar_reservations?: CalendarReservation[];
  blocked_dates?: string[];
  reservations?: unknown[];
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

export interface AvailabilityCheckResponse {
  available: boolean;
  message?: string;
  available_at?: string;
  conflicting_reservation?: {
    start_date: string;
    end_date: string;
  };
}

