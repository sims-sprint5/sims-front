import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/types/vehicle.types';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';
import type { ReservationFilters } from '@/modules/reservations/types/reservationFilters.types';
import { createDefaultReservationFilters } from '@/modules/reservations/types/reservationFilters.types';
import { applyReservationFilters, getReservationFacets } from '@/modules/reservations/utils/reservationFilters';
import { useTranslateError } from '@/shared/composables/useTranslateError';

function toCardModel(v: Vehicle): ReservationVehicleCardModel {
  const name = [v.brand, v.model].filter(Boolean).join(' ').trim() || v.license_plate || '—';
  const category = v.status || '—';

  const statusKey = (v.status ?? '').trim().toLowerCase();
  const availableDerived = statusKey === 'available' || statusKey === 'active';
  const available = v.available ?? availableDerived;

  const description = v.color ? `Color: ${v.color}` : '';

  return {
    id: v.id,
    name,
    category,
    licensePlate: v.license_plate,
    brand: v.brand,
    model: v.model,
    available,
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

  const filteredVehicles = computed(() => applyReservationFilters(vehicles.value, filters.value));

  const vehicleCards = computed<ReservationVehicleCardModel[]>(() => filteredVehicles.value.map(toCardModel));

  async function loadVehicles() {
    loading.value = true;
    error.value = '';
    try {
      const response = await vehicleService.getVehicles(1, 200);
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