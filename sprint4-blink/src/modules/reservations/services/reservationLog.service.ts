import { apiClient } from '@/shared/services/api.service';
import { buildQuery } from '@/shared/utils/queryBuilder';
import type { CreateReservationLogData, ReservationLog, ReservationStatus } from '@/modules/reservations/types/reservationLog.types';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value: unknown): ReservationStatus {
  const s = String(value).toLowerCase();
  return s === 'pending' ? 'pending' : 'confirmed';
}

function normalizeLog(raw: any): ReservationLog {
  return {
    id: toNumber(raw?.id, 0),
    log_type: 'created',
    user_id: raw?.user_id === null || raw?.user_id === undefined ? null : toNumber(raw.user_id, 0),
    user_name: String(raw?.user_name ?? '').trim(),
    vehicle_id: toNumber(raw?.vehicle_id, 0),
    vehicle_name: String(raw?.vehicle_name ?? '').trim(),
    license_plate: String(raw?.license_plate ?? '').trim(),
    status: normalizeStatus(raw?.status),
    start_at: String(raw?.start_date ?? raw?.start_at ?? ''),
    end_at: String(raw?.end_date ?? raw?.end_at ?? ''),
    created_at: String(raw?.created_at ?? new Date().toISOString()),
  };
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
    };
    const raw = await apiClient.post<any>('/v1/reservations', payload);
    return normalizeLog(raw?.data ?? raw);
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
};

export type ReservationLogService = typeof reservationLogService;