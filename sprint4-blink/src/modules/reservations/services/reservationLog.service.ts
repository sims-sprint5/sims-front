import { apiClient } from '@/shared/services/api.service';
import { buildQuery } from '@/shared/utils/queryBuilder';
import type { CreateReservationLogData, ReservationLog, ReservationStatus, RenewalIntentResponse } from '@/modules/reservations/types/reservationLog.types';
import type { AvailabilityCheckResponse } from '@/modules/vehicles/types/vehicle.types';
import { pushReservationDebug } from '@/modules/reservations/utils/reservationDebug';
import { authService } from '@/modules/auth/services/auth.service';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value: unknown): ReservationStatus {
  const s = String(value).toLowerCase();
  if (s === 'paid' || s === 'succeeded' || s === 'success') return 'completed';
  if (s === 'pending' || s === 'active' || s === 'completed' || s === 'cancelled') return s;
  return 'pending';
}

function normalizeLog(raw: any): ReservationLog {
  // Extract data from the nested vehicle object if it exists
  const vehicleData = typeof raw?.vehicle === 'object' ? raw.vehicle : {}
  const userData = typeof raw?.user === 'object' ? raw.user : {}
  
  // Build vehicle_name from brand + model
  const vehicleName = (vehicleData.brand && vehicleData.model)
    ? `${vehicleData.brand} ${vehicleData.model}`.trim()
    : vehicleData.name || vehicleData.vehicle_name || ''
  
  const normalized: ReservationLog = {
    id: toNumber(raw?.id ?? raw?.reservation_id, 0),
    log_type: 'created' as const,
    user_id: (raw?.user_id === null || raw?.user_id === undefined)
      ? (userData && (userData.id ?? userData.user_id) ? toNumber(userData.id ?? userData.user_id, 0) : null)
      : toNumber(raw.user_id, 0),
    user_name: String(
      raw?.user_name ?? userData.name ?? `${userData.first_name ?? ''} ${userData.last_name ?? ''}`.trim() ?? userData.user_name ?? '',
    ).trim(),
    vehicle_id: toNumber(raw?.vehicle_id ?? vehicleData.id ?? vehicleData.vehicle_id, 0),
    vehicle_name: vehicleName,
    license_plate: String(vehicleData.license_plate ?? raw?.license_plate ?? raw?.plate ?? '').trim(),
    status: normalizeStatus(raw?.status ?? (raw?.paid_at ? 'completed' : undefined)),
    start_at: String(raw?.start_date ?? raw?.start_at ?? raw?.startDate ?? ''),
    end_at: String(raw?.end_date ?? raw?.end_at ?? raw?.endDate ?? ''),
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
  if (Array.isArray(raw)) {
    return raw.map(normalizeLog);
  }

  const candidates: unknown[] = [
    raw?.data,
    raw?.data?.data,
    raw?.rows,
    raw?.items,
    raw?.results,
    raw?.reservations,
  ];

  const firstArray = candidates.find((value) => Array.isArray(value));
  if (Array.isArray(firstArray)) {
    return firstArray.map(normalizeLog);
  }

  return [];
}

function filterToCurrentUserReservations(logs: ReservationLog[]): ReservationLog[] {
  const currentUser = authService.getUser() as any;
  const currentUserId = Number(currentUser?.id ?? currentUser?.user_id ?? 0);
  const currentUserName = String(currentUser?.name ?? '').trim().toLowerCase();

  if ((!Number.isFinite(currentUserId) || currentUserId <= 0) && !currentUserName) {
    return logs;
  }

  return logs.filter((item) => {
    const itemUserId = Number(item.user_id ?? 0);
    const byId = Number.isFinite(currentUserId) && currentUserId > 0 && itemUserId === currentUserId;

    const itemUserName = String(item.user_name ?? '').trim().toLowerCase();
    const byName = Boolean(currentUserName) && itemUserName === currentUserName;

    return byId || byName;
  });
}

async function fetchReservationsListRaw(page: number, perPage: number): Promise<any> {
  const query = buildQuery({ page, per_page: perPage });

  try {
    const raw = await apiClient.get<any>(`/v1/reservations${query}`);
    pushReservationDebug('reservations.fetch.primary', { page, perPage, raw });
    return raw;
  } catch (error: any) {
    const $u: any = authService.getUser() || {};
    const userId = Number($u?.id ?? $u?.user_id ?? 0);
    const shouldFallback = Number.isFinite(userId) && userId > 0;

    pushReservationDebug('reservations.fetch.primary.error', {
      page,
      perPage,
      status: Number(error?.status ?? 0),
      message: error?.message,
      userId,
    });

    if (!shouldFallback) {
      throw error;
    }

    const fallbackRaw = await apiClient.get<any>(`/v1/reservations/user/${userId}${query}`);
    pushReservationDebug('reservations.fetch.fallback.user', { page, perPage, userId, fallbackRaw });
    return fallbackRaw;
  }
}

async function fetchMyReservationsListRaw(page: number, perPage: number): Promise<any> {
  const query = buildQuery({ page, per_page: perPage });
  const $u: any = authService.getUser() || {};
  const userId = Number($u?.id ?? $u?.user_id ?? 0);

  if (Number.isFinite(userId) && userId > 0) {
    try {
      const raw = await apiClient.get<any>(`/v1/reservations/user/${userId}${query}`);
      pushReservationDebug('reservations.fetch.my.user', { page, perPage, userId, raw });
      return raw;
    } catch (error: any) {
      pushReservationDebug('reservations.fetch.my.user.error', {
        page,
        perPage,
        userId,
        status: Number(error?.status ?? 0),
        message: error?.message,
      });
    }
  }

  const raw = await fetchReservationsListRaw(page, perPage);
  pushReservationDebug('reservations.fetch.my.fallback', { page, perPage, raw });
  return raw;
}

export const reservationLogService = {
  async getLogs(page: number = 1, perPage: number = 200): Promise<ReservationLog[]> {
    const raw = await fetchReservationsListRaw(page, perPage);
    return normalizeLogs(raw);
  },

  async getMyReservations(page: number = 1, perPage: number = 50): Promise<ReservationLog[]> {
    const raw = await fetchMyReservationsListRaw(page, perPage);
    const normalized = normalizeLogs(raw);
    const mine = filterToCurrentUserReservations(normalized);

    pushReservationDebug('reservations.getMyReservations', {
      page,
      perPage,
      raw,
      normalizedCount: normalized.length,
      mineCount: mine.length,
      normalizedSample: normalized.slice(0, 3),
    });

    return mine;
  },

  async getMyReservationsPages(maxPages: number = 5, perPage: number = 200): Promise<ReservationLog[]> {
    const all: ReservationLog[] = [];
    const seen = new Set<number>();

    for (let page = 1; page <= maxPages; page += 1) {
      const raw = await fetchMyReservationsListRaw(page, perPage);
      const current = filterToCurrentUserReservations(normalizeLogs(raw));

      pushReservationDebug('reservations.getMyReservationsPages.page', {
        page,
        perPage,
        raw,
        currentCount: current.length,
        currentSample: current.slice(0, 2),
      });

      for (const item of current) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          all.push(item);
        }
      }

      const hasMoreByMeta = Number(raw?.last_page ?? raw?.meta?.last_page ?? 0);
      if ((hasMoreByMeta > 0 && page >= hasMoreByMeta) || current.length < perPage) {
        break;
      }
    }

    pushReservationDebug('reservations.getMyReservationsPages.result', {
      maxPages,
      perPage,
      dedupedCount: all.length,
      dedupedSample: all.slice(0, 5),
    });

    return all;
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

  async toggleVehicle(reservationId: number, action: 'on' | 'off'): Promise<any> {
    const raw = await apiClient.post<any>(`/v1/reservations/${reservationId}/vehicle/${action}`, {});
    return raw;
  },

  async updateReservationStatus(reservationId: number, status: ReservationStatus): Promise<ReservationLog> {
    const raw = await apiClient.patch<any>(`/v1/reservations/${reservationId}/status`, { status });
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
    excludeReservationId?: number,
  ): Promise<AvailabilityCheckResponse> {
    // Normalize startDate/endDate to ISO 8601 UTC before sending them to the backend.
    // Avoid concatenating ".000Z" on strings that already contain an offset (+02:00) or Z.
    const normalizeToISOString = (value: string): string => {
      if (!value) return value
      // If it already ends in Z or has an offset +/-HH:MM, convert to Date and use toISOString()
      try {
        const parsed = new Date(value)
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString()
        }
      } catch (e) {
        // ignore
      }
      // Fallback: return as-is (backend will validate)
      return value
    }

    const startISO = normalizeToISOString(startDate)
    const endISO = normalizeToISOString(endDate)
    
    const queryParams: Record<string, any> = {
      vehicle_id: vehicleId,
      start_date: startISO,
      end_date: endISO,
    };
    
    if (excludeReservationId) {
      queryParams.exclude_reservation_id = excludeReservationId;
    }
    
    const query = buildQuery(queryParams);
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

  async sendVehicleAction(reservationId: number, action: 'on' | 'off'): Promise<{ message: string }> {
    const raw = await apiClient.post<any>(`/v1/reservations/${reservationId}/vehicle/${action}`, {});
    return { message: raw?.message ?? '' };
  },

  async deleteReservation(reservationId: number): Promise<{ message: string; vehicle_id: number }> {
    const raw = await apiClient.delete<any>(`/v1/reservations/${reservationId}`);
    return {
      message: raw?.message ?? 'Reservation deleted successfully',
      vehicle_id: toNumber(raw?.vehicle_id, 0),
    };
  },

  async updateReservation(reservationId: number, endDate: string): Promise<ReservationLog> {
    const payload = {
      end_date: endDate, // Expected format: 2026-04-26T18:00:00
    };
    const raw = await apiClient.patch<any>(`/v1/reservations/${reservationId}`, payload);
    return normalizeLog(raw?.data ?? raw);
  },
};

export type ReservationLogService = typeof reservationLogService;