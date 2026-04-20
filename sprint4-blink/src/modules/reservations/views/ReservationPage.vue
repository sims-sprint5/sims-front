<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick, onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { BaseButton } from '@/components/base';
import FilterSidebar from '@/modules/reservations/components/FilterSidebar.vue';
import VehicleList from '@/modules/reservations/components/VehicleList.vue';
import { useReservationVehicles } from '@/modules/reservations/composables/useReservationVehicles';
import { createReservationCheckoutSession } from '@/modules/reservations/services/reservationCheckout.service';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';
import { getPendingReservationCheckout, savePendingReservationCheckout } from '@/modules/reservations/utils/checkoutStorage';
import {
  getReservationDebugEventName,
  getReservationDebugSnapshot,
  isReservationDebugEnabled,
} from '@/modules/reservations/utils/reservationDebug';
import { useToast } from '@/shared/composables/useToast';
import BaseDateTimePicker from '@/components/base/BaseDateTimePicker.vue';
import BusyDaysCalendar from '@/modules/reservations/components/BusyDaysCalendar.vue';
import '@/styles/flatpickr.css';

const { vehicleCards, loading, filters, facets, resetFilters, error, reloadVehicles } = useReservationVehicles();
const { t } = useI18n();
const route = useRoute();
const toast = useToast();

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
let autoRefreshTimer: number | null = null;
const debugEnabled = ref(false);
const debugEntries = ref<any[]>([]);
const fromMap = computed(() => route.query.fromMap === 'true');
const reservationForm = reactive({
  startAt: '',
  endAt: '',
});
const hideAccessibilityClass = 'hide-userway-widget';
type DatePickerConfig = {
  enableTime?: boolean;
  time_24hr?: boolean;
  minuteIncrement?: number;
  dateFormat?: string;
  disable?: Array<{ from: Date; to: Date }>;
  minDate?: Date;
};

const debugDump = computed(() =>
  JSON.stringify(
    {
      pendingCheckout: getPendingReservationCheckout(),
      selectedVehicleId: selectedVehicle.value?.id ?? null,
      selectedVehicleSlots: selectedVehicle.value?.calendarReservations?.length ?? 0,
      vehicleCardsCount: vehicleCards.value.length,
      lastEntries: debugEntries.value.slice(-8),
    },
    null,
    2,
  ),
);

function refreshDebugEntries() {
  debugEntries.value = getReservationDebugSnapshot();
  void debugDump.value;
}

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

  const sorted = slots
    .map((slot) => ({
      start: new Date(slot.startDate),
      end: new Date(slot.endDate),
    }))
    .filter((slot) => !Number.isNaN(slot.start.getTime()) && !Number.isNaN(slot.end.getTime()))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let cursor = new Date();
  for (const slot of sorted) {
    if (slot.end <= cursor) continue;
    if (slot.start > cursor) {
      return toDateTimeLocalInput(cursor);
    }
    cursor = slot.end;
  }

  return toDateTimeLocalInput(cursor);
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
    return end > now;
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
  if (autoRefreshTimer) {
    window.clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }

  window.removeEventListener('focus', handleWindowFocus);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (debugEnabled.value) {
    window.removeEventListener(getReservationDebugEventName(), refreshDebugEntries);
  }
  document.body.classList.remove(hideAccessibilityClass);
});

async function refreshAfterCheckout(): Promise<void> {
  const pending = getPendingReservationCheckout();
  if (!pending) return;

  try {
    await reloadVehicles();
  } catch {
    // Ignore transient refresh errors.
  }
}

function handleWindowFocus() {
  void refreshAfterCheckout();
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    void refreshAfterCheckout();
  }
}

onMounted(() => {
  debugEnabled.value = isReservationDebugEnabled();
  if (debugEnabled.value) {
    refreshDebugEntries();
    window.addEventListener(getReservationDebugEventName(), refreshDebugEntries);
  }

  void refreshAfterCheckout();
  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  autoRefreshTimer = window.setInterval(() => {
    void refreshAfterCheckout();
  }, 4000);
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

function getCheckoutErrorMessage(err: any, t: (key: string, params?: Record<string, unknown>) => string): string {
  const status = Number(err?.status);

  if (status === 401) {
    return t('reservations.errors.checkoutUnauthorized');
  }

  if (status === 422) {
    return t('reservations.errors.notAvailable');
  }

  if (status === 409) {
    return t('reservations.errors.checkoutConflict');
  }

  if (status >= 500) {
    return t('reservations.errors.checkoutServer');
  }

  const backendDetail = err?.responseData?.error || err?.responseData?.message || err?.message;
  if (backendDetail) return String(backendDetail);

  return t('reservations.errors.checkoutFailed');
}



function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function findOverlappingSlot(
  startDate: Date,
  endDate: Date,
  slots: Array<{ startDate: string; endDate: string }> = [],
): { start: Date; end: Date } | null {
  for (const slot of slots) {
    const slotStart = parseDate(slot.startDate);
    const slotEnd = parseDate(slot.endDate);
    if (!slotStart || !slotEnd) continue;

    if (startDate < slotEnd && slotStart < endDate) {
      return { start: slotStart, end: slotEnd };
    }
  }

  return null;
}

function toDisabledRanges(slots: Array<{ startDate: string; endDate: string }> = []): Array<{ from: Date; to: Date }> {
  return slots
    .map((slot) => {
      const from = parseDate(slot.startDate);
      const end = parseDate(slot.endDate);
      if (!from || !end) return null;

      // Keep boundary behavior consistent with overlap checks: end moment can be used as next start.
      const to = new Date(end.getTime() - 1);
      if (to <= from) return null;
      return { from, to };
    })
    .filter((range): range is { from: Date; to: Date } => Boolean(range));
}

const reservationDisabledRanges = computed(() =>
  toDisabledRanges(selectedVehicle.value?.calendarReservations ?? []),
);

const startPickerConfig = computed<DatePickerConfig>(() => ({
  enableTime: true,
  time_24hr: true,
  minuteIncrement: 1,
  dateFormat: 'Y-m-d\\TH:i',
  disable: reservationDisabledRanges.value,
}));

const endPickerConfig = computed<DatePickerConfig>(() => {
  const minEndDate = reservationForm.startAt ? parseDate(reservationForm.startAt) : null;
  return {
    enableTime: true,
    time_24hr: true,
    minuteIncrement: 1,
    dateFormat: 'Y-m-d\\TH:i',
    disable: reservationDisabledRanges.value,
    minDate: minEndDate ?? undefined,
  };
});

async function createReservation() {
  if (!selectedVehicle.value || submitting.value) return;

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

  const localOverlap = findOverlappingSlot(
    startDate,
    endDate,
    selectedVehicle.value.calendarReservations ?? [],
  );
  if (localOverlap) {
    toast.error(t('reservations.errors.availableFrom', { date: localOverlap.end.toLocaleString() }));
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

      const conflictingStart = parseDate(availability.conflicting_reservation?.start_date);
      const conflictingEnd = parseDate(availability.conflicting_reservation?.end_date);
      const overlapsWithConflict = Boolean(
        conflictingStart && conflictingEnd && startDate < conflictingEnd && conflictingStart < endDate,
      );

      if (overlapsWithConflict && conflictingEnd) {
        const formatted = conflictingEnd.toLocaleString();
        errorMsg = t('reservations.errors.availableFrom', { date: formatted });
      } else {
        const backendAvailableAt = parseDate(availability.available_at);
        const formatted = backendAvailableAt?.toLocaleString();
        if (formatted) {
          errorMsg = t('reservations.errors.availableFrom', { date: formatted });
        }
      }

      toast.error(errorMsg);
      return;
    }

    const vehicleId = Number(selectedVehicle.value.id) || 0;
    const normalizedStart = normalizeDateTime(reservationForm.startAt);
    const normalizedEnd = normalizeDateTime(reservationForm.endAt);

    try {
      const { checkoutUrl, stripeSessionId } = await createReservationCheckoutSession({
        vehicleId,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        pickupLocation: 'Calle X',
        dropoffLocation: 'Calle Y',
      });

      savePendingReservationCheckout({
        vehicleId,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        stripeSessionId,
        createdAt: new Date().toISOString(),
      });

      window.location.assign(checkoutUrl);
    } catch (err: any) {
      // Log full error for debugging
      // eslint-disable-next-line no-console
      console.error('Checkout start failed (ReservationPage):', err);
      toast.error(getCheckoutErrorMessage(err, t));
      return;
    }
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

          <div class="text-sm text-gray-600">
            <span class="font-medium text-gray-900">Ordenar por:</span>
            <span class="ml-2">Recomendado</span>
          </div>
        </div>

        <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </div>

        <div v-if="debugEnabled" class="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-amber-900">Reservation Debug Mode</h2>
            <span class="text-xs text-amber-700">Activo via ?debugReservations=1</span>
          </div>
          <p class="mb-2 text-xs text-amber-800">
            Muestra respuestas crudas/normalizadas de reservas y calendario para diagnostico.
          </p>
          <pre class="max-h-80 overflow-auto rounded bg-white p-3 text-[11px] leading-4 text-gray-800">{{ debugDump }}</pre>
        </div>

        <VehicleList :vehicles="vehicleCards" :loading="loading" @reserve="openReservationModal">
          <template #empty>
            <div class="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
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
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeReservationModal" />
          <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

          <div class="inline-block w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
            <div class="px-6 py-5">
              <h2 id="reservation-modal-title" class="text-xl font-semibold text-gray-900">
                {{ $t('reservations.createTitle') }}
              </h2>
              <p class="mt-1 text-sm text-gray-500">
                {{ $t('reservations.createDescription') }}
              </p>

                <p class="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  {{ selectedVehicle?.name }} · {{ $t('reservations.selectDates') }}
                </p>

              
                <BusyDaysCalendar
                  :slots="selectedVehicle?.calendarReservations ?? []"
                  title="Calendario de ocupacion"
                />

                <div class="mt-6 space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">{{ $t('reservations.table.startAt') }}</label>
                    <BaseDateTimePicker
                      v-model="reservationForm.startAt"
                      :config="startPickerConfig"
                      class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">{{ $t('reservations.table.endAt') }}</label>
                    <BaseDateTimePicker
                      v-model="reservationForm.endAt"
                      :config="endPickerConfig"
                      class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>

              <div class="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                <BaseButton v-if="!fromMap" variant="secondary" :disabled="submitting" @click="closeReservationModal">
                  {{ $t('common.cancel') }}
                </BaseButton>
                <BaseButton :loading="submitting" @click="createReservation">
                  Reservar y pagar
                </BaseButton>
              </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>