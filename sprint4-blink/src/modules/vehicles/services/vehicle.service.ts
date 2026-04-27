import { apiClient } from '@/shared/services/api.service';
import { buildQuery } from '@/shared/utils/queryBuilder';
import { pushReservationDebug } from '@/modules/reservations/utils/reservationDebug';
import type {
  CalendarReservation,
  CreateVehicleData,
  UpdateVehicleData,
  Vehicle,
  VehiclesResponse,
} from '../types/vehicle.types';

/** Normalitza un vehicle del backend als tipus del frontend */
function normalizeVehicle(raw: any): Vehicle {
  const yearRaw = raw?.year ?? null;
  const year = yearRaw === null || yearRaw === undefined || yearRaw === '' ? null : Number(yearRaw);

  const latRaw = raw?.current_latitude ?? raw?.latitude ?? null;
  const lngRaw = raw?.current_longitude ?? raw?.longitude ?? null;

  const current_latitude = latRaw === null || latRaw === undefined || latRaw === '' ? null : Number(latRaw);
  const current_longitude = lngRaw === null || lngRaw === undefined || lngRaw === '' ? null : Number(lngRaw);

  const availableRaw = raw?.available ?? raw?.is_available;
  const statusKey = String(raw?.status ?? '').trim().toLowerCase();
  const availableDerived = statusKey === 'available';
  const available = typeof availableRaw === 'boolean' ? availableRaw : availableDerived;

  const calendarReservationsRaw = Array.isArray(raw?.calendar_reservations)
    ? raw.calendar_reservations
    : Array.isArray(raw?.calendarReservations)
    ? raw.calendarReservations
    : Array.isArray(raw?.reservations)
    ? raw.reservations
    : [];

  let calendar_reservations: CalendarReservation[] = calendarReservationsRaw
    .map((reservation: any) => ({
      start_date: String(reservation?.start_date ?? reservation?.start_at ?? reservation?.startDate ?? ''),
      end_date: String(reservation?.end_date ?? reservation?.end_at ?? reservation?.endDate ?? ''),
      user_name: reservation?.user_name ? String(reservation.user_name) : undefined,
      user_id: Number.isFinite(Number(reservation?.user_id)) ? Number(reservation.user_id) : undefined,
      status: reservation?.status ? String(reservation.status) : undefined,
      calendar_state: reservation?.calendar_state ? String(reservation.calendar_state) : undefined,
    }))
    .filter((reservation: CalendarReservation) => reservation.start_date && reservation.end_date);

  if (calendar_reservations.length > 1) {
    const seen = new Set<string>();
    calendar_reservations = calendar_reservations.filter((r) => {
      const key = `${r.start_date}|${r.end_date}|${String(r.user_id ?? '')}|${String(r.status ?? '')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const nextRaw = raw?.next_reservation ?? raw?.nextReservation ?? null;
  const next_reservation = nextRaw
    ? {
        start_date: String(nextRaw.start_date ?? nextRaw.start_at ?? nextRaw.startDate ?? ''),
        end_date: String(nextRaw.end_date ?? nextRaw.end_at ?? nextRaw.endDate ?? ''),
        user_name: nextRaw?.user_name ? String(nextRaw.user_name) : undefined,
        user_id: Number.isFinite(Number(nextRaw?.user_id)) ? Number(nextRaw.user_id) : undefined,
      }
    : null;

  const blocked_dates = Array.isArray(raw?.blocked_dates)
    ? raw.blocked_dates.map((d: any) => String(d))
    : Array.isArray(raw?.blockedDates)
    ? raw.blockedDates.map((d: any) => String(d))
    : undefined;

  return {
    id: Number(raw?.id ?? raw?.vehicle_id ?? 0),
    vehicle_id: raw?.vehicle_id ?? raw?.vehicleId,
    license_plate: String(raw?.license_plate ?? raw?.plate ?? ''),
    brand: String(raw?.brand ?? ''),
    model: String(raw?.model ?? ''),
    year,
    color: String(raw?.color ?? ''),
    status: String(raw?.status ?? ''),
    available,
    current_latitude,
    current_longitude,
    last_location_update: raw?.last_location_update ?? raw?.lastLocationUpdate ?? null,
    created_at: String(raw?.created_at ?? raw?.createdAt ?? ''),
    updated_at: String(raw?.updated_at ?? raw?.updatedAt ?? ''),
    next_reservation,
    next_available_at: raw?.next_available_at ?? raw?.nextAvailableAt ?? null,
    calendar_reservations: calendar_reservations.length ? calendar_reservations : undefined,
    blocked_dates,
    reservations: raw?.reservations ?? undefined,
  } as Vehicle;
}

/** Normalitza una resposta paginada o array del backend */
function normalizeVehiclesResponse(raw: any): VehiclesResponse {
  if (Array.isArray(raw)) {
    return { data: raw.map(normalizeVehicle) };
  }

  if (Array.isArray(raw?.data)) {
    return { data: raw.data.map(normalizeVehicle), meta: raw.meta };
  }

  if (Array.isArray(raw?.data?.data)) {
    return { data: raw.data.data.map(normalizeVehicle), meta: raw.data.meta ?? raw.meta };
  }

  if (Array.isArray(raw?.rows)) {
    return { data: raw.rows.map(normalizeVehicle), meta: raw.meta };
  }

  if (Array.isArray(raw?.items)) {
    return { data: raw.items.map(normalizeVehicle), meta: raw.meta };
  }

  return { data: [] };
}

function toNumberOrNull(value: string | number | undefined): number | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export const vehicleService = {
  async getVehicles(page: number = 1, perPage: number = 10): Promise<VehiclesResponse> {
    const query = buildQuery({ page, per_page: perPage });
    const raw = await apiClient.get<any>(`/v1/vehicles${query}`);
    return normalizeVehiclesResponse(raw?.data ?? raw);
  },

  async getVehiclesList(perPage: number = 200): Promise<Vehicle[]> {
    const result: Vehicle[] = [];
    let page = 1;
    for (;;) {
      const res = await this.getVehicles(page, perPage);
      const items = Array.isArray(res.data) ? res.data : [];
      result.push(...items);
      const lastPage = Number(res.meta?.last_page ?? 0);
      if (lastPage > 0) {
        if (page >= lastPage) break;
      } else if (items.length < perPage) {
        break;
      }
      page += 1;
    }
    // Dedupe by id/vehicle_id to avoid double-counting when backend pages overlap
    const seen = new Set<number>();
    const deduped: Vehicle[] = [];
    for (const v of result) {
      const id = Number(v.vehicle_id ?? v.id ?? 0);
      if (!seen.has(id) && id !== 0) {
        seen.add(id);
        deduped.push(v);
      } else if (!seen.has(id) && id === 0) {
        // fallback: include items without numeric id once
        deduped.push(v);
      }
    }
    return deduped;
  },

  async getVehiclesCalendar(page: number = 1, perPage: number = 200, vehicleId?: number) {
    const query = buildQuery({ page, per_page: perPage, ...(vehicleId ? { vehicleId } : {}) });
    let source = 'vehicles-calendar';
    let raw: any;
    try {
      raw = await apiClient.get<any>(`/v1/vehicles-calendar${query}`);
    } catch (err: any) {
      source = 'vehicles-fallback';
      const fallbackQuery = buildQuery({ page, per_page: perPage });
      if (vehicleId) {
        raw = await apiClient.get<any>(`/v1/vehicles/${vehicleId}`);
      } else {
        raw = await apiClient.get<any>(`/v1/vehicles${fallbackQuery}`);
      }
      try {
        pushReservationDebug('vehicles.getVehiclesCalendar.fallback', {
          page,
          perPage,
          vehicleId,
          status: err?.status ?? 0,
          message: err?.message,
        });
      } catch {}
    }

    const normalized = normalizeVehiclesResponse(raw?.data ?? raw);
    try {
      pushReservationDebug('vehicles.getVehiclesCalendar', { source, page, perPage, vehicleId, raw: raw?.data ?? raw });
    } catch {}
    return normalized;
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
