<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { BaseButton } from '@/components/base';
import { useUser } from '@/modules/auth/composables/useUser';
import FilterSidebar from '@/modules/reservations/components/FilterSidebar.vue';
import VehicleList from '@/modules/reservations/components/VehicleList.vue';
import { useReservationVehicles } from '@/modules/reservations/composables/useReservationVehicles';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';
import { useToast } from '@/shared/composables/useToast';

const { vehicleCards, loading, filters, facets, resetFilters, error } = useReservationVehicles();
const { t } = useI18n();
const route = useRoute();
const toast = useToast();
const { user } = useUser();

const props = defineProps<{
  prefill?: Record<string, string | undefined> | null
  hideAccessibility?: boolean
}>()

const emit = defineEmits<{
  (e: 'reservationModalVisibility', open: boolean): void
}>()

const showReservationModal = ref(false);
const selectedVehicle = ref<ReservationVehicleCardModel | null>(null);
const submitting = ref(false);
const fromMap = computed(() => route.query.fromMap === 'true');
const reservationForm = reactive({
  startAt: '',
  endAt: '',
});
const hideAccessibilityClass = 'hide-userway-widget';

function toDateTimeLocalInput(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

const defaultStartAt = computed(() => toDateTimeLocalInput(new Date()));
const defaultEndAt = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateTimeLocalInput(d);
});

function normalizeDateInput(value?: string | null): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return toDateTimeLocalInput(parsed);
}

function getSuggestedStartForPreReservation(vehicle: ReservationVehicleCardModel): string {
  const byNextAvailable = normalizeDateInput(vehicle.nextAvailableAt);
  if (byNextAvailable) return byNextAvailable;

  const slots = Array.isArray(vehicle.calendarReservations) ? vehicle.calendarReservations : [];
  if (!slots.length) return defaultStartAt.value;

  const latestEnd = slots
    .map((slot) => new Date(slot.endDate))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return latestEnd ? toDateTimeLocalInput(latestEnd) : defaultStartAt.value;
}

function getSuggestedEndFromStart(startAt: string): string {
  const d = new Date(startAt);
  if (Number.isNaN(d.getTime())) return defaultEndAt.value;
  d.setHours(d.getHours() + 24);
  return toDateTimeLocalInput(d);
}

function isVehicleReservedNow(vehicle: ReservationVehicleCardModel): boolean {
  const slots = Array.isArray(vehicle.calendarReservations) ? vehicle.calendarReservations : [];
  if (!slots.length) return String(vehicle.status ?? vehicle.category ?? '').trim().toLowerCase() === 'reserved';

  const now = new Date();
  return slots.some((slot) => {
    const start = new Date(slot.startDate);
    const end = new Date(slot.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return start <= now && now < end;
  });
}

function openReservationModal(vehicle: ReservationVehicleCardModel) {
  selectedVehicle.value = vehicle;
  if (isVehicleReservedNow(vehicle)) {
    const suggestedStart = getSuggestedStartForPreReservation(vehicle);
    reservationForm.startAt = suggestedStart;
    reservationForm.endAt = getSuggestedEndFromStart(suggestedStart);
  } else {
    reservationForm.startAt = '';
    reservationForm.endAt = '';
  }
  showReservationModal.value = true;
  emit('reservationModalVisibility', true)
}

function openReservationModalPrefilled(vehicle: ReservationVehicleCardModel, startAt?: string, endAt?: string) {
  selectedVehicle.value = vehicle;
  reservationForm.startAt = startAt || defaultStartAt.value;
  reservationForm.endAt = endAt || defaultEndAt.value;
  showReservationModal.value = true;
  emit('reservationModalVisibility', true)
}

function closeReservationModal() {
  showReservationModal.value = false;
  selectedVehicle.value = null;
  reservationForm.startAt = '';
  reservationForm.endAt = '';
  emit('reservationModalVisibility', false)
}

const lastAppliedPrefillKey = ref<string | null>(null);

// UI: show/hide filters (hidden by default; user opens manually)
const showFilters = ref(false)
const toggleFilters = () => { showFilters.value = !showFilters.value }

const queryFirstString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value || undefined;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? (first || undefined) : undefined;
  }
  return undefined;
};

const reservationPrefill = computed(() => {
  if (props.prefill && props.prefill.vehicleId) {
    return {
      vehicleId: props.prefill.vehicleId,
      brand: props.prefill.brand,
      model: props.prefill.model,
      licensePlate: props.prefill.licensePlate,
      status: props.prefill.status,
      available: props.prefill.available,
      startAt: props.prefill.startAt,
      endAt: props.prefill.endAt,
      lat: props.prefill.lat,
      lng: props.prefill.lng,
    } as Record<string, string | undefined>;
  }

  const q = route.query;
  const vehicleId = queryFirstString(q.vehicleId);
  const brand = queryFirstString(q.brand);
  const model = queryFirstString(q.model);
  const licensePlate = queryFirstString(q.licensePlate);
  const status = queryFirstString(q.status);
  const available = queryFirstString(q.available);
  const startAt = queryFirstString(q.startAt);
  const endAt = queryFirstString(q.endAt);
  const lat = queryFirstString(q.lat);
  const lng = queryFirstString(q.lng);

  if (!vehicleId) return null;
  return { vehicleId, brand, model, licensePlate, status, available, startAt, endAt, lat, lng };
});

const shouldHideAccessibility = computed(() => {
  if (typeof props.hideAccessibility === 'boolean') return props.hideAccessibility;
  const queryValue = route.query.hideAccessibility;
  if (typeof queryValue === 'string') return queryValue === '1' || queryValue.toLowerCase() === 'true';
  if (Array.isArray(queryValue)) return queryValue.some(v => v === '1' || String(v).toLowerCase() === 'true');
  return false;
});

watch(
  shouldHideAccessibility,
  (hide) => {
    document.body.classList.toggle(hideAccessibilityClass, hide);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  document.body.classList.remove(hideAccessibilityClass);
});

watch(
  [() => reservationPrefill.value, () => loading.value],
  async ([prefill, isLoading]) => {
    if (!prefill) {
      lastAppliedPrefillKey.value = null;
      return;
    }

    if (isLoading) return;

    const prefillKey = [prefill.vehicleId, prefill.startAt ?? '', prefill.endAt ?? ''].join('|');
    if (lastAppliedPrefillKey.value === prefillKey) return;

    // Asegura que el coche se encuentre aunque el usuario tuviese filtros activos.
    resetFilters();
    await nextTick();

    const cards = vehicleCards.value;
    const idNum = Number(prefill.vehicleId);

    const found = cards.find((c) =>
      (Number.isFinite(idNum) && Number(c.id) === idNum) ||
      c.pricing?.total === prefill.vehicleId
    );

    const fallbackName = [prefill.brand, prefill.model].filter(Boolean).join(' ').trim() || prefill.licensePlate || '—';
    const prefillStatus = String(prefill.status ?? '').trim().toLowerCase();
    const prefillAvailable = String(prefill.available ?? '').trim().toLowerCase();
    const derivedAvailable = prefillAvailable === 'true' || prefillStatus === 'available' || prefillStatus === 'active';
    const vehicle: ReservationVehicleCardModel = found ?? {
      id: prefill.vehicleId as string,
      name: fallbackName,
      category: prefill.status || '—',
      brand: prefill.brand,
      model: prefill.model,
      licensePlate: prefill.licensePlate,
      available: derivedAvailable,
    };

    openReservationModalPrefilled(vehicle, prefill.startAt, prefill.endAt);
    lastAppliedPrefillKey.value = prefillKey;
  },
  { immediate: true }
);

function normalizeDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function formatReservationSlot(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

async function createReservation() {
  if (!selectedVehicle.value || submitting.value) return;

  const statusKey = String(selectedVehicle.value.category ?? '').trim().toLowerCase();
  const blockedByStatus = ['reserved', 'maintenance', 'inactive', 'out_of_service', 'rented'].includes(statusKey);
  const explicitlyUnavailable = selectedVehicle.value.available === false;
  if (blockedByStatus || explicitlyUnavailable) {
    toast.error('Este coche no está disponible');
    return;
  }

  if (!reservationForm.startAt || !reservationForm.endAt) {
    toast.error(t('reservations.errors.missingDates'));
    return;
  }

  const startDate = new Date(reservationForm.startAt);
  const endDate = new Date(reservationForm.endAt);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
    toast.error(t('reservations.errors.invalidDates'));
    return;
  }

  submitting.value = true;

  try {
    // Validar disponibilidad ANTES de crear la reserva
    const availability = await reservationLogService.checkAvailability(
      Number(selectedVehicle.value.id) || 0,
      normalizeDateTime(reservationForm.startAt),
      normalizeDateTime(reservationForm.endAt),
    );

    if (!availability.available) {
      let errorMsg = availability.message || t('reservations.errors.notAvailable');
      if (availability.available_at) {
        const availDate = new Date(availability.available_at);
        const formatted = availDate.toLocaleString();
        errorMsg = t('reservations.errors.availableFrom', { date: formatted });
      }
      toast.error(errorMsg);
      return;
    }

    // Si está disponible, proceder a crear la reserva
    const status = startDate > new Date() ? 'pending' : 'active';

    await reservationLogService.createLog({
      user_id: user.value?.id ?? null,
      user_name: user.value?.name ?? 'N/A',
      vehicle_id: Number(selectedVehicle.value.id) || 0,
      vehicle_name: selectedVehicle.value.name,
      license_plate: selectedVehicle.value.licensePlate ?? '',
      status,
      start_at: normalizeDateTime(reservationForm.startAt),
      end_at: normalizeDateTime(reservationForm.endAt),
    });

    toast.success(t('reservations.toast.created'));
    closeReservationModal();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="space-y-6">
      <aside v-if="showFilters" class="w-full">
        <div class="lg:sticky lg:top-6">
          <FilterSidebar
            v-model="filters"
            :statuses="facets.statuses"
            :brands="facets.brands"
            :year-min="facets.yearMin"
            :year-max="facets.yearMax"
            :disabled="loading"
            @reset="resetFilters"
          />
        </div>
      </aside>

      <section class="min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <BaseButton size="sm" variant="muted" @click="toggleFilters">
              {{ showFilters ? t('reservations.filters.hide') : t('reservations.filters.show') }}
            </BaseButton>
          </div>

          <div class="text-sm text-muted">
            <span class="font-medium text-main">Ordenar por:</span>
            <span class="ml-2">Recomendado</span>
          </div>
        </div>

        <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </div>

        <VehicleList :vehicles="vehicleCards" :loading="loading" @reserve="openReservationModal">
          <template #empty>
            <div class="rounded-2xl border border-default bg-surface p-6 text-sm text-muted">
              No hay vehículos que coincidan con los filtros.
            </div>
          </template>
        </VehicleList>
      </section>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showReservationModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="reservation-modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-base-dark0 bg-opacity-75 transition-opacity" @click="closeReservationModal" />
          <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

          <div class="inline-block w-full max-w-lg transform overflow-hidden rounded-2xl bg-surface text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
            <div class="px-6 py-5">
              <h2 id="reservation-modal-title" class="text-xl font-semibold text-main">
                {{ $t('reservations.createTitle') }}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ $t('reservations.createDescription') }}
              </p>

                <p class="mt-3 rounded-lg bg-base-dark px-3 py-2 text-sm text-muted">
                  {{ selectedVehicle?.name }} · {{ $t('reservations.selectDates') }}
                </p>

                <div
                  v-if="selectedVehicle?.calendarReservations?.length"
                  class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    {{ $t('reservations.preReservation.busySlots') }}
                  </p>
                  <ul class="mt-2 space-y-1 text-sm text-amber-900">
                    <li
                      v-for="(slot, idx) in selectedVehicle.calendarReservations"
                      :key="`${slot.startDate}-${slot.endDate}-${idx}`"
                    >
                      {{ formatReservationSlot(slot.startDate) }} - {{ formatReservationSlot(slot.endDate) }}
                    </li>
                  </ul>
                </div>

                <div class="mt-6 space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-main">{{ $t('reservations.table.startAt') }}</label>
                    <input
                      v-model="reservationForm.startAt"
                      type="datetime-local"
                      class="w-full rounded-lg border border-default px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-main">{{ $t('reservations.table.endAt') }}</label>
                    <input
                      v-model="reservationForm.endAt"
                      type="datetime-local"
                      class="w-full rounded-lg border border-default px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                  </div>
                </div>
              </div>

              <div class="flex flex-col-reverse gap-3 border-t border-gray-100 bg-base-dark px-6 py-4 sm:flex-row sm:justify-end">
                <BaseButton v-if="!fromMap" variant="secondary" :disabled="submitting" @click="closeReservationModal">
                  {{ $t('common.cancel') }}
                </BaseButton>
                <BaseButton :loading="submitting" @click="createReservation">
                  {{ $t('reservations.actions.createReservation') }}
                </BaseButton>
              </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>