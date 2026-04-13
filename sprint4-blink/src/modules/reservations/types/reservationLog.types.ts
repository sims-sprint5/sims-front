export type ReservationLogType = 'created';

export type ReservationStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface ReservationLog {
  id: number;
  log_type: ReservationLogType;
  user_id: number | null;
  user_name: string;
  vehicle_id: number;
  vehicle_name: string;
  license_plate: string;
  status: ReservationStatus;
  start_at: string;
  end_at: string;
  created_at: string;
  pickup_location?: string;
  dropoff_location?: string;
  // Campos calculados del backend
  is_expired?: boolean;
  minutes_remaining?: number;
  can_renew?: boolean;
  renewal_notice?: string | null;
  renewal_payment_url?: string | null;
}

export interface CreateReservationLogData {
  user_id: number | null;
  user_name: string;
  vehicle_id: number;
  vehicle_name: string;
  license_plate: string;
  status?: ReservationStatus;
  start_at: string;
  end_at: string;
  pickup_location?: string;
  dropoff_location?: string;
}

export interface RenewalIntentResponse {
  id: number;
  payment_url: string;
  renewal_notice: string | null;
}