import { computed, onMounted, ref, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/types/vehicle.types';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';
import type { ReservationFilters } from '@/modules/reservations/types/reservationFilters.types';
import { createDefaultReservationFilters } from '@/modules/reservations/types/reservationFilters.types';
import { applyReservationFilters, getReservationFacets } from '@/modules/reservations/utils/reservationFilters';
import { useTranslateError } from '@/shared/composables/useTranslateError';

const NON_BLOCKING_RESERVATION_STATES = new Set(['cancelled', 'canceled', 'completed', 'finished', 'expired']);

function isReservationNotFinished(endDate: string, now: Date): boolean {
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return false;
  return now < end;
}

function isVehicleAvailableNow(v: Vehicle): boolean {
  if (isVehicleReservedNow(v)) return false;

  const now = new Date();
  const statusKey = (v.status ?? '').trim().toLowerCase();

  if (Array.isArray(v.calendar_reservations) && v.calendar_reservations.length > 0) {
    const blocking = v.calendar_reservations.some((reservation) =>
      isReservationNotFinished(reservation.end_date, now),
    );
    return !blocking;
  }

  const nextReservationEnd = v.next_reservation?.end_date ? new Date(v.next_reservation.end_date) : null;
  const hasNextReservationNotFinished = Boolean(
    nextReservationEnd && !Number.isNaN(nextReservationEnd.getTime()) && now < nextReservationEnd,
  );
  if (hasNextReservationNotFinished) {
    return false;
  }

  if (statusKey === 'maintenance' || statusKey === 'inactive' || statusKey === 'out_of_service' || statusKey === 'rented') {
    return false;
  }

  if (typeof v.available === 'boolean') return v.available;
  return true;
}

function isVehicleReservedNow(v: Vehicle): boolean {
  const now = new Date();

  if (Array.isArray(v.calendar_reservations) && v.calendar_reservations.length > 0) {
    const blocking = v.calendar_reservations.some((reservation) => {
      const statusKey = String(reservation.status ?? '').trim().toLowerCase();
      const calendarStateKey = String(reservation.calendar_state ?? '').trim().toLowerCase();
      if (NON_BLOCKING_RESERVATION_STATES.has(statusKey) || NON_BLOCKING_RESERVATION_STATES.has(calendarStateKey)) {
        return false;
      }

      const end = reservation.end_date ? new Date(reservation.end_date) : null;
      if (!end || Number.isNaN(end.getTime())) return false;
      if (reservation.start_date) {
        const start = new Date(reservation.start_date);
        if (Number.isNaN(start.getTime())) return false;
      }
      // Repo rule: reservation blocks the vehicle until it ends.
      return now < end;
    });
    if (blocking) return true;
  }

  const nextReservationEnd = v.next_reservation?.end_date ? new Date(v.next_reservation.end_date) : null;
  const hasNextReservationNotFinished = Boolean(
    nextReservationEnd && !Number.isNaN(nextReservationEnd.getTime()) && now < nextReservationEnd,
  );
  if (hasNextReservationNotFinished) return true;

  const nextAvailableAt = v.next_available_at ? new Date(v.next_available_at) : null;
  if (nextAvailableAt && !Number.isNaN(nextAvailableAt.getTime()) && now < nextAvailableAt) {
    return true;
  }

  const statusKey = String(v.status ?? '').trim().toLowerCase();
  if (statusKey === 'reserved') return true;

  return false;
}

function toCardModel(v: Vehicle): ReservationVehicleCardModel {
  const name = [v.brand, v.model].filter(Boolean).join(' ').trim() || v.license_plate || '—';
  const reservedNow = isVehicleReservedNow(v);
  const available = !reservedNow && isVehicleAvailableNow(v);
  const category = reservedNow ? 'reserved' : (available ? 'available' : (v.status || '—'));

  const description = v.color ? `Color: ${v.color}` : '';

  return {
    id: v.id,
    name,
    category,
    status: v.status,
    licensePlate: v.license_plate,
    brand: v.brand,
    model: v.model,
    available,
    nextAvailableAt: v.next_available_at ?? null,
    calendarReservations: Array.isArray(v.calendar_reservations)
      ? v.calendar_reservations.map((reservation) => ({
          startDate: reservation.start_date,
          endDate: reservation.end_date,
          userName: reservation.user_name,
          status: reservation.status,
        }))
      : [],
    description,
    specs: {
      seatsLabel: v.license_plate ? `License: ${v.license_plate}` : undefined,
      transmissionLabel: undefined,
      acLabel: v.color ? `Color: ${v.color}` : undefined,
      minAgeLabel: undefined,
    },
    features: description ? [description] : [],
    pricing: {
      fromLabel: 'STATUS',
      pricePerDay: v.status || '—',
      totalLabel: 'ID',
      total: String(v.vehicle_id ?? v.id),
    },
  };
}

export function useReservationVehicles() {
  const { t } = useI18n();
  const { translateErrorMessage } = useTranslateError();

  const vehicles = ref<Vehicle[]>([]);
  const loading = ref<boolean>(true);
  const error = ref<string>('');

  const filters = ref<ReservationFilters>(createDefaultReservationFilters());

  const facets = computed(() => getReservationFacets(vehicles.value));

  const filteredVehicles = computed(() => {
    return applyReservationFilters(vehicles.value, filters.value);
  });

  const vehicleCards = computed<ReservationVehicleCardModel[]>(() => filteredVehicles.value.map(toCardModel));

  async function loadVehicles() {
    loading.value = true;
    error.value = '';
    try {
      const allVehicles: Vehicle[] = [];
      let page = 1;

      while (true) {
        const response = await vehicleService.getVehiclesCalendar(page, 200);
        const current = Array.isArray(response?.data) ? response.data : [];
        allVehicles.push(...current);

        const lastPage = Number(response?.meta?.last_page ?? 0);
        if (lastPage > 0) {
          if (page >= lastPage) break;
        } else if (current.length < 200) {
          break;
        }

        page += 1;
      }

      vehicles.value = allVehicles;
    } catch (e: any) {
      error.value = translateErrorMessage(e?.message, t('vehicles.errors.load'));
      vehicles.value = [];
    } finally {
      loading.value = false;
    }
  }

  function resetFilters() {
    filters.value = createDefaultReservationFilters();
  }

  let autoRefreshTimer: number | null = null;
  onMounted(() => {
    loadVehicles();
    // Refresh periodically to update statuses when reservations end
    autoRefreshTimer = window.setInterval(() => {
      void loadVehicles();
    }, 30000) as unknown as number;
  });

  onBeforeUnmount(() => {
    if (autoRefreshTimer) {
      window.clearInterval(autoRefreshTimer as number);
      autoRefreshTimer = null;
    }
  });

  return {
    vehicleCards,
    facets,
    filters,
    loading,
    error,
    resetFilters,
    reloadVehicles: loadVehicles,
  };
}