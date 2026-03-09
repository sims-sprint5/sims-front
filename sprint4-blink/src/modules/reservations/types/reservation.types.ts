/**
 * Tipos relacionados con reservas
 */

export interface Reservation {
  id: number;
  reservation_id?: number;
  user_id: number | null;
  vehicle_id: number | null;
  status: string;
  start_at: string;
  end_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationData {
  user_id: string | number;
  vehicle_id: string | number;
  status: string;
  start_at: string;
  end_at: string;
}

export interface UpdateReservationData {
  user_id?: string | number;
  vehicle_id?: string | number;
  status?: string;
  start_at?: string;
  end_at?: string;
}

export interface ReservationsResponse {
  data: Reservation[];
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ReservationResponse {
  data: Reservation;
}
