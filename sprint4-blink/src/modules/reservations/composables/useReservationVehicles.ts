import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/types/vehicle.types';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';
import type { ReservationFilters } from '@/modules/reservations/types/reservationFilters.types';
import { createDefaultReservationFilters } from '@/modules/reservations/types/reservationFilters.types';
import { applyReservationFilters, getReservationFacets } from '@/modules/reservations/utils/reservationFilters';
import { useTranslateError } from '@/shared/composables/useTranslateError';

function isReservationBlockingNow(startDate: string, endDate: string, now: Date): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return start <= now && now < end;
}

function isVehicleAvailableNow(v: Vehicle): boolean {
  const now = new Date();
  const statusKey = (v.status ?? '').trim().toLowerCase();

  if (Array.isArray(v.calendar_reservations) && v.calendar_reservations.length > 0) {
    const blocking = v.calendar_reservations.some((reservation) =>
      isReservationBlockingNow(reservation.start_date, reservation.end_date, now),
    );
    return !blocking;
  }

  if (statusKey === 'maintenance' || statusKey === 'inactive' || statusKey === 'out_of_service' || statusKey === 'rented') {
    return false;
  }

  if (statusKey === 'reserved' && v.next_reservation?.start_date) {
    const startsAt = new Date(v.next_reservation.start_date);
    if (!Number.isNaN(startsAt.getTime()) && startsAt > now) {
      return true;
    }
  }

  if (typeof v.available === 'boolean') return v.available;
  return statusKey === 'available' || statusKey === 'active';
}

function toCardModel(v: Vehicle): ReservationVehicleCardModel {
  const name = [v.brand, v.model].filter(Boolean).join(' ').trim() || v.license_plate || '—';
  const available = isVehicleAvailableNow(v);
  const category = available ? 'available' : (v.status || '—');

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
      seatsLabel: v.license_plate ? `Matrícula: ${v.license_plate}` : undefined,
      transmissionLabel: undefined,
      acLabel: v.color ? `Color: ${v.color}` : undefined,
      minAgeLabel: undefined,
    },
    features: description ? [description] : [],
    pricing: {
      fromLabel: 'ESTADO',
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
    const statusFiltered = vehicles.value.filter((v) => {
      const statusKey = (v.status ?? '').trim().toLowerCase();
      return statusKey === 'available' || statusKey === 'reserved';
    });
    return applyReservationFilters(statusFiltered, filters.value);
  });

  const vehicleCards = computed<ReservationVehicleCardModel[]>(() => filteredVehicles.value.map(toCardModel));

  async function loadVehicles() {
    loading.value = true;
    error.value = '';
    try {
      const response = await vehicleService.getVehiclesCalendar(1, 200);
      vehicles.value = Array.isArray(response?.data) ? response.data : [];
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

  onMounted(loadVehicles);

  return {
    vehicleCards,
    facets,
    filters,
    loading,
    error,
    resetFilters,
  };
}