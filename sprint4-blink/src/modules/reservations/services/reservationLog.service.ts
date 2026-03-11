import type { CreateReservationLogData, ReservationLog, ReservationStatus } from '@/modules/reservations/types/reservationLog.types';

const STORAGE_KEY = 'reservation_logs';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value: unknown): ReservationStatus {
  return String(value).toLowerCase() === 'pending' ? 'pending' : 'confirmed';
}

function normalizeLog(raw: any): ReservationLog {
  return {
    id: toNumber(raw?.id, Date.now()),
    log_type: 'created',
    user_id: raw?.user_id === null || raw?.user_id === undefined ? null : toNumber(raw.user_id, 0),
    user_name: String(raw?.user_name ?? '').trim(),
    vehicle_id: toNumber(raw?.vehicle_id, 0),
    vehicle_name: String(raw?.vehicle_name ?? '').trim(),
    license_plate: String(raw?.license_plate ?? '').trim(),
    status: normalizeStatus(raw?.status),
    start_at: String(raw?.start_at ?? ''),
    end_at: String(raw?.end_at ?? ''),
    created_at: String(raw?.created_at ?? new Date().toISOString()),
  };
}

function readLogs(): ReservationLog[] {
  if (typeof window === 'undefined') return [];

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.map(normalizeLog).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      : [];
  } catch {
    return [];
  }
}

function writeLogs(logs: ReservationLog[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export const reservationLogService = {
  getLogs(): ReservationLog[] {
    return readLogs();
  },

  createLog(data: CreateReservationLogData): ReservationLog {
    const logs = readLogs();
    const log: ReservationLog = {
      id: Date.now(),
      log_type: 'created',
      user_id: data.user_id,
      user_name: data.user_name.trim() || 'N/A',
      vehicle_id: data.vehicle_id,
      vehicle_name: data.vehicle_name.trim() || 'N/A',
      license_plate: data.license_plate.trim(),
      status: data.status ?? 'confirmed',
      start_at: data.start_at,
      end_at: data.end_at,
      created_at: new Date().toISOString(),
    };

    const nextLogs = [log, ...logs];
    writeLogs(nextLogs);
    return log;
  },

  searchLogs(query: string): ReservationLog[] {
    const normalizedQuery = query.trim().toLowerCase();
    const logs = readLogs();

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