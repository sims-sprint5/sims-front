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
}