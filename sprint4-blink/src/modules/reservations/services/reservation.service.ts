import { apiClient } from '@/shared/services/api.service';
import { buildQuery } from '@/shared/utils/queryBuilder';
import type {
  CreateReservationData,
  Reservation,
  ReservationsResponse,
  UpdateReservationData,
} from '../types/reservation.types';

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Normalitza una reserva del backend als tipus del frontend */
function normalizeReservation(raw: any): Reservation {
  const id = raw?.id ?? raw?.reservation_id ?? 0;
  const reservation_id = raw?.reservation_id ?? raw?.id;

  return {
    id: id ?? 0,
    reservation_id,
    user_id: toNumberOrNull(raw?.user_id ?? raw?.userId ?? raw?.usuario_id),
    vehicle_id: toNumberOrNull(raw?.vehicle_id ?? raw?.vehicleId ?? raw?.vehiculo_id),
    status: String(raw?.status ?? raw?.estado ?? ''),
    start_at: String(raw?.start_at ?? raw?.start_date ?? raw?.fecha_inicio ?? ''),
    end_at: String(raw?.end_at ?? raw?.end_date ?? raw?.fecha_fin ?? ''),
    created_at: String(raw?.created_at ?? ''),
    updated_at: String(raw?.updated_at ?? ''),
  };
}

/** Normalitza una resposta paginada o array del backend */
function normalizeReservationsResponse(raw: any): ReservationsResponse {
  if (Array.isArray(raw)) {
    return { data: raw.map(normalizeReservation) };
  }
  if (Array.isArray(raw?.data)) {
    return { data: raw.data.map(normalizeReservation), meta: raw.meta };
  }
  return { data: [] };
}

export const reservationService = {
  /**
   * Listado de reservas
   * Endpoint backend: GET /api/v1/reservations
   */
  async getReservations(page: number = 1, perPage: number = 10): Promise<ReservationsResponse> {
    const query = buildQuery({ page, per_page: perPage });
    const raw = await apiClient.get<any>(`/v1/reservations${query}`);
    return normalizeReservationsResponse(raw);
  },

  /**
   * Obtenir reserva per ID
   * Endpoint backend: GET /api/v1/reservations/{reservation}
   */
  async getReservationById(id: number): Promise<Reservation> {
    const raw = await apiClient.get<any>(`/v1/reservations/${id}`);
    return normalizeReservation(raw?.data ?? raw);
  },

  /**
   * Crear reserva
   * Endpoint backend: POST /api/v1/reservations
   */
  async createReservation(data: CreateReservationData): Promise<Reservation> {
    const payload: any = {
      user_id: toNumberOrNull(data.user_id),
      vehicle_id: toNumberOrNull(data.vehicle_id),
      status: data.status,
      start_at: data.start_at,
      start_date: data.start_at,
      end_at: data.end_at,
      end_date: data.end_at,
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const raw = await apiClient.post<any>('/v1/reservations', payload);
    return normalizeReservation(raw?.data ?? raw);
  },

  /**
   * Actualizar reserva
   * Endpoint backend: PUT/PATCH /api/v1/reservations/{reservation}
   */
  async updateReservation(id: number, data: UpdateReservationData): Promise<Reservation> {
    const payload: any = {};
    if (data.user_id !== undefined) payload.user_id = toNumberOrNull(data.user_id);
    if (data.vehicle_id !== undefined) payload.vehicle_id = toNumberOrNull(data.vehicle_id);
    if (data.status !== undefined) payload.status = data.status;
    if (data.start_at !== undefined) {
      payload.start_at = data.start_at;
      payload.start_date = data.start_at;
    }
    if (data.end_at !== undefined) {
      payload.end_at = data.end_at;
      payload.end_date = data.end_at;
    }

    const raw = await apiClient.patch<any>(`/v1/reservations/${id}`, payload);
    return normalizeReservation(raw?.data ?? raw);
  },

  /**
   * Eliminar reserva
   * Endpoint backend: DELETE /api/v1/reservations/{reservation}
   */
  async deleteReservation(id: number): Promise<void> {
    await apiClient.delete<void>(`/v1/reservations/${id}`);
  },

  /**
   * Actualizar estado
   * Endpoint backend: PATCH /api/v1/reservations/{id}/status
   */
  async updateReservationStatus(id: number, status: string): Promise<Reservation> {
    const raw = await apiClient.patch<any>(`/v1/reservations/${id}/status`, { status });
    return normalizeReservation(raw?.data ?? raw);
  },

  /**
   * Reservas por usuario
   * Endpoint backend: GET /api/v1/reservations/user/{userId}
   */
  async getReservationsByUserId(userId: number): Promise<ReservationsResponse> {
    const raw = await apiClient.get<any>(`/v1/reservations/user/${userId}`);
    return normalizeReservationsResponse(raw);
  },

  /**
   * Búsqueda (sin endpoint dedicado)
   * Estrategia: cargar desde API y filtrar en cliente.
   */
  async searchReservations(query: string): Promise<Reservation[]> {
    const response = await this.getReservations(1, 200);
    const reservations = Array.isArray(response.data) ? response.data : [];

    const q = query.trim().toLowerCase();
    if (!q) return reservations;

    return reservations.filter((r) => {
      const status = (r.status ?? '').toLowerCase();
      const userId = r.user_id === null ? '' : String(r.user_id);
      const vehicleId = r.vehicle_id === null ? '' : String(r.vehicle_id);
      const start = (r.start_at ?? '').toLowerCase();
      const end = (r.end_at ?? '').toLowerCase();

      return (
        status.includes(q) ||
        userId.includes(q) ||
        vehicleId.includes(q) ||
        start.includes(q) ||
        end.includes(q)
      );
    });
  },
} as const;

export type ReservationService = typeof reservationService;
