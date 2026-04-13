import { apiClient } from '@/shared/services/api.service';
import { buildQuery } from '@/shared/utils/queryBuilder';
import type { CreateReservationLogData, ReservationLog, ReservationStatus, RenewalIntentResponse } from '@/modules/reservations/types/reservationLog.types';
import type { AvailabilityCheckResponse } from '@/modules/vehicles/types/vehicle.types';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value: unknown): ReservationStatus {
  const s = String(value).toLowerCase();
  if (s === 'pending' || s === 'active' || s === 'completed' || s === 'cancelled') return s;
  return 'pending';
}

function normalizeLog(raw: any): ReservationLog {
  // Extraer datos del objeto vehicle anidado si existe
  const vehicleData = typeof raw?.vehicle === 'object' ? raw.vehicle : {}
  const userData = typeof raw?.user === 'object' ? raw.user : {}
  
  // Construir vehicle_name de brand + model
  const vehicleName = (vehicleData.brand && vehicleData.model)
    ? `${vehicleData.brand} ${vehicleData.model}`.trim()
    : vehicleData.name || vehicleData.vehicle_name || ''
  
  const normalized: ReservationLog = {
    id: toNumber(raw?.id ?? raw?.reservation_id, 0),
    log_type: 'created' as const,
    user_id: raw?.user_id === null || raw?.user_id === undefined ? null : toNumber(raw.user_id, 0),
    user_name: String(raw?.user_name ?? userData.name ?? userData.user_name ?? '').trim(),
    vehicle_id: toNumber(raw?.vehicle_id, 0),
    vehicle_name: vehicleName,
    license_plate: String(vehicleData.license_plate ?? raw?.license_plate ?? raw?.plate ?? '').trim(),
    status: normalizeStatus(raw?.status),
    start_at: String(raw?.start_date ?? raw?.start_at ?? ''),
    end_at: String(raw?.end_date ?? raw?.end_at ?? ''),
    created_at: String(raw?.created_at ?? new Date().toISOString()),
    pickup_location: raw?.pickup_location ?? undefined,
    dropoff_location: raw?.dropoff_location ?? undefined,
    is_expired: Boolean(raw?.is_expired ?? false),
    minutes_remaining: toNumber(raw?.minutes_remaining, 0),
    can_renew: Boolean(raw?.can_renew ?? false),
    renewal_notice: raw?.renewal_notice ?? null,
    renewal_payment_url: raw?.renewal_payment_url ?? null,
  };
  return normalized;
}

function normalizeLogs(raw: any): ReservationLog[] {
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return arr.map(normalizeLog);
}

export const reservationLogService = {
  async getLogs(page: number = 1, perPage: number = 200): Promise<ReservationLog[]> {
    const query = buildQuery({ page, per_page: perPage });
    const raw = await apiClient.get<any>(`/v1/reservations${query}`);
    return normalizeLogs(raw);
  },

  async getMyReservations(page: number = 1, perPage: number = 50): Promise<ReservationLog[]> {
    const query = buildQuery({ page, per_page: perPage });
    const raw = await apiClient.get<any>(`/v1/reservations${query}`);
    return normalizeLogs(raw);
  },

  async getLogById(id: number): Promise<ReservationLog> {
    const raw = await apiClient.get<any>(`/v1/reservations/${id}`);
    return normalizeLog(raw?.data ?? raw);
  },

  async createLog(data: CreateReservationLogData): Promise<ReservationLog> {
    const payload = {
      user_id: data.user_id,
      user_name: data.user_name.trim() || 'N/A',
      vehicle_id: data.vehicle_id,
      vehicle_name: data.vehicle_name.trim() || 'N/A',
      license_plate: data.license_plate.trim(),
      status: data.status ?? 'active',
      start_date: data.start_at,
      end_date: data.end_at,
      ...(data.pickup_location && { pickup_location: data.pickup_location }),
      ...(data.dropoff_location && { dropoff_location: data.dropoff_location }),
    };
    const raw = await apiClient.post<any>('/v1/reservations', payload);
    return normalizeLog(raw?.data ?? raw);
  },

  async requestRenewalIntent(reservationId: number): Promise<RenewalIntentResponse> {
    const raw = await apiClient.post<any>(`/v1/reservations/${reservationId}/renewal-intent`, {});
    return {
      id: toNumber(raw?.id ?? reservationId, reservationId),
      payment_url: String(raw?.payment_url ?? ''),
      renewal_notice: raw?.renewal_notice ?? null,
    };
  },

  async checkAvailability(
    vehicleId: number,
    startDate: string,
    endDate: string,
  ): Promise<AvailabilityCheckResponse> {
    const query = buildQuery({
      vehicle_id: vehicleId,
      start_date: startDate,
      end_date: endDate,
    });
    const raw = await apiClient.get<any>(`/v1/reservations/check-availability${query}`);
    return {
      available: Boolean(raw?.available ?? false),
      message: raw?.message ?? undefined,
      available_at: raw?.available_at ?? undefined,
      conflicting_reservation: raw?.conflicting_reservation ?? undefined,
    };
  },

  async searchLogs(query: string): Promise<ReservationLog[]> {
    const logs = await this.getLogs();
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return logs;

    return logs.filter((log) => {
      const haystack = [
        log.log_type,
        log.user_name,
        log.user_id,
        log.vehicle_name,
        log.vehicle_id,
        log.license_plate,
        log.status,
        log.start_at,
        log.end_at,
        log.created_at,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ');

      return haystack.includes(normalizedQuery);
    });
  },

  async deleteReservation(reservationId: number): Promise<{ message: string; vehicle_id: number }> {
    const raw = await apiClient.delete<any>(`/v1/reservations/${reservationId}`);
    return {
      message: raw?.message ?? 'Reservation deleted successfully',
      vehicle_id: toNumber(raw?.vehicle_id, 0),
    };
  },
};

export type ReservationLogService = typeof reservationLogService;