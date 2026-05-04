<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseButton } from '@/components/base';
import { useToast } from '@/shared/composables/useToast';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'info' | 'muted';

interface Props {
  vehicle?: ReservationVehicleCardModel;
  skeleton?: boolean;
  largeView?: boolean;
}

const emit = defineEmits<{
  reserve: [vehicle: ReservationVehicleCardModel];
}>();

const props = withDefaults(defineProps<Props>(), {
  vehicle: undefined,
  skeleton: false,
  largeView: false,
});

const { t } = useI18n();
const toast = useToast();

function statusLabel(raw: string | undefined): string {
  if (!raw) return '—';
  const key = `vehicles.status.${raw.trim().toLowerCase()}`;
  const translated = t(key);
  return translated === key ? raw : translated;
}

const STATUS_STYLES: Record<string, { badge: string; bar: string }> = {
  available:      { badge: 'bg-vehicle-available-bg text-vehicle-available-text ring-1 ring-vehicle-available-ring',  bar: 'bg-vehicle-available-bar' },
  active:         { badge: 'bg-vehicle-available-bg text-vehicle-available-text ring-1 ring-vehicle-available-ring',       bar: 'bg-vehicle-available-bar'    },
  maintenance:    { badge: 'bg-vehicle-maintenance-bg text-vehicle-maintenance-text ring-1 ring-vehicle-maintenance-ring',     bar: 'bg-vehicle-maintenance-bar'  },
  reserved:       { badge: 'bg-vehicle-reserved-bg text-vehicle-reserved-text ring-1 ring-vehicle-reserved-ring',        bar: 'bg-vehicle-reserved-bar'     },
  rented:         { badge: 'bg-[rgb(var(--color-bg-base-dark))] text-indigo-700 ring-1 ring-indigo-300',     bar: 'bg-indigo-400'  },
  inactive:       { badge: 'bg-surface-muted text-main ring-1 ring-default',       bar: 'bg-muted'    },
  out_of_service: { badge: 'bg-vehicle-reserved-bg text-vehicle-reserved-text ring-1 ring-vehicle-reserved-ring',        bar: 'bg-vehicle-reserved-bar'     },
};

const statusStyle = computed(() => {
  const key = (props.vehicle?.category ?? '').trim().toLowerCase();
  return STATUS_STYLES[key] ?? { badge: 'bg-surface-muted text-muted ring-1 ring-gray-300', bar: 'bg-gray-300' };
});

const statusKey = computed(() => (props.vehicle?.category ?? '').trim().toLowerCase());

const isAvailable = computed(() => {
  const key = statusKey.value;
  if (['reserved', 'maintenance', 'inactive', 'out_of_service', 'rented'].includes(key)) return false;
  if (key === 'available' || key === 'active') return true;
  if (props.vehicle?.available === true) return true;
  if (props.vehicle?.available === false) return false;
  return false;
});

const isReservedNow = computed(() => {
  if (!props.vehicle?.calendarReservations?.length) {
    const nextAvailableAt = props.vehicle?.nextAvailableAt ? new Date(props.vehicle.nextAvailableAt) : null;
    const blockedByNextAvailable = Boolean(nextAvailableAt && !Number.isNaN(nextAvailableAt.getTime()) && new Date() < nextAvailableAt);
    return statusKey.value === 'reserved' || blockedByNextAvailable;
  }
  const now = new Date();
  return props.vehicle.calendarReservations.some((slot) => {
    const end = slot.endDate ? new Date(slot.endDate) : null;
    if (!end || Number.isNaN(end.getTime())) return false;
    if (slot.startDate) {
      const start = new Date(slot.startDate);
      if (Number.isNaN(start.getTime())) return false;
    }
    // Module rule: considered blocked until the reservation ends.
    return now < end;
  });
});

const canPreReserve = computed(() => isReservedNow.value);

const actionButtonVariant = computed<ButtonVariant>(() => {
  if (isAvailable.value) return 'primary';
  const key = statusKey.value;
  if (key === 'reserved') return 'tertiary';
  if (key === 'maintenance') return 'warning';
  if (key === 'inactive') return 'muted';
  if (key === 'out_of_service') return 'tertiary';
  return 'primary';
});

function handleReserve() {
  if (!props.vehicle) return;
  if (!isAvailable.value && !canPreReserve.value) {
    toast.error('This car is not available');
    return;
  }
  emit('reserve', props.vehicle);
}
</script>

<template>
  <article
    class="relative bg-surface rounded-2xl shadow-md border border-default overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
    :aria-busy="skeleton ? 'true' : 'false'"
  >
    <div
      class="absolute left-0 inset-y-0 w-1.5 rounded-l-2xl"
      :class="skeleton ? 'bg-surface-dark' : statusStyle.bar"
    />

    <div :class="[props.largeView ? 'pl-8 pr-8 py-8 md:pr-10 md:py-10' : 'pl-6 pr-6 py-4 md:pr-8 md:py-4']">
      <div class="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_180px] lg:items-start lg:gap-4">
        <div class="min-w-0 flex-1">
          <div v-if="skeleton" class="space-y-3">
            <div class="h-6 w-56 max-w-full rounded-lg bg-surface-dark animate-pulse" />
            <div class="h-4 w-32 rounded-full bg-surface-dark animate-pulse" />
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div v-for="i in 4" :key="i" class="h-4 rounded bg-surface-dark animate-pulse" />
            </div>
          </div>

          <template v-else>
            <div class="flex flex-wrap items-center gap-3">
              <h3 :class="[props.largeView ? 'text-xl md:text-2xl' : 'text-lg md:text-xl', 'font-bold text-main whitespace-normal lg:truncate']">
                {{ vehicle?.name ?? '—' }}
              </h3>
              <span
                class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                :class="statusStyle.badge"
              >
                {{ statusLabel(vehicle?.category) }}
              </span>
            </div>

            <div class="mt-3 flex gap-2.5 overflow-x-auto pb-1 pr-1">
              <div class="rounded-lg px-2.5 py-2 bg-base border border-default min-w-[150px] shrink-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-semibold text-main text-xs">License</span>
                </div>
                <p class="mt-1 text-main text-sm font-bold truncate">{{ vehicle?.licensePlate ?? '—' }}</p>
              </div>

              <div class="rounded-lg px-2.5 py-2 bg-base border border-default min-w-[150px] shrink-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-semibold text-main text-xs">Color</span>
                </div>
                <p class="mt-1 text-main text-sm font-bold truncate">{{ vehicle?.description ?? '—' }}</p>
              </div>

            </div>
          </template>
        </div>

        <div :class="[props.largeView ? 'lg:w-56' : 'lg:w-[180px]', 'w-full lg:shrink-0 flex flex-col justify-end gap-2 pt-2 lg:pt-0']">
          <template v-if="skeleton">
            <div class="h-4 w-20 rounded bg-surface-dark animate-pulse md:ml-auto" />
            <div class="h-9 w-full rounded-lg bg-surface-dark animate-pulse mt-auto" />
          </template>
          <template v-else>
            <BaseButton
              :variant="actionButtonVariant"
              full-width
              @click="handleReserve"
            >
              {{ isAvailable ? $t('reservations.buttons.reserveButton') : canPreReserve ? $t('reservations.buttons.preReserveButton') : statusLabel(vehicle?.category) }}
            </BaseButton>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>