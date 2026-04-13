<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseButton } from '@/components/base';
import { useToast } from '@/shared/composables/useToast';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';
import {
  IdentificationIcon,
  SwatchIcon,
  TruckIcon,
  CalendarIcon,
} from '@heroicons/vue/24/outline';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'info' | 'muted';

interface Props {
  vehicle?: ReservationVehicleCardModel;
  skeleton?: boolean;
}

const emit = defineEmits<{
  reserve: [vehicle: ReservationVehicleCardModel];
}>();

const props = withDefaults(defineProps<Props>(), {
  vehicle: undefined,
  skeleton: false,
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
  available:      { badge: 'bg-blue-100 text-blue-700 ring-1 ring-blue-300',  bar: 'bg-blue-400' },
  active:         { badge: 'bg-blue-100   text-blue-700   ring-1 ring-blue-300',       bar: 'bg-blue-400'    },
  maintenance:    { badge: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300',     bar: 'bg-yellow-400'  },
  reserved:       { badge: 'bg-red-100    text-red-800    ring-1 ring-red-300',        bar: 'bg-red-400'     },
  rented:         { badge: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300',     bar: 'bg-indigo-400'  },
  inactive:       { badge: 'bg-gray-100   text-gray-800   ring-1 ring-gray-300',       bar: 'bg-gray-400'    },
  out_of_service: { badge: 'bg-red-100    text-red-700    ring-1 ring-red-300',        bar: 'bg-red-400'     },
};

const statusStyle = computed(() => {
  const key = (props.vehicle?.category ?? '').trim().toLowerCase();
  return STATUS_STYLES[key] ?? { badge: 'bg-gray-100 text-gray-500 ring-1 ring-gray-300', bar: 'bg-gray-300' };
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
  if (!props.vehicle?.calendarReservations?.length) return statusKey.value === 'reserved' && !isAvailable.value;
  const now = new Date();
  return props.vehicle.calendarReservations.some((slot) => {
    const start = new Date(slot.startDate);
    const end = new Date(slot.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return start <= now && now < end;
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
    toast.error('Este coche no está disponible');
    return;
  }
  emit('reserve', props.vehicle);
}
</script>

<template>
  <article
    class="relative bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
    :aria-busy="skeleton ? 'true' : 'false'"
  >
    <div
      class="absolute left-0 inset-y-0 w-1.5 rounded-l-2xl"
      :class="skeleton ? 'bg-gray-200' : statusStyle.bar"
    />

    <div class="pl-5 pr-5 py-5 md:pr-6 md:py-6">
      <div class="flex flex-col md:flex-row gap-5">
        <div class="min-w-0 flex-1">
          <div v-if="skeleton" class="space-y-3">
            <div class="h-6 w-56 max-w-full rounded-lg bg-gray-200 animate-pulse" />
            <div class="h-4 w-32 rounded-full bg-gray-200 animate-pulse" />
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div v-for="i in 4" :key="i" class="h-4 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>

          <template v-else>
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="text-lg md:text-xl font-bold text-gray-900 truncate">
                {{ vehicle?.name ?? '—' }}
              </h3>
              <span
                class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                :class="statusStyle.badge"
              >
                {{ statusLabel(vehicle?.category) }}
              </span>
            </div>

            <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <div class="flex items-center gap-2 text-gray-600">
                <IdentificationIcon class="h-4 w-4 shrink-0 text-gray-400" />
                <dt class="font-medium text-gray-500 shrink-0">{{ $t('vehicles.table.licensePlate') }}</dt>
                <dd class="truncate">{{ vehicle?.licensePlate ?? '—' }}</dd>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <TruckIcon class="h-4 w-4 shrink-0 text-gray-400" />
                <dt class="font-medium text-gray-500 shrink-0">{{ $t('vehicles.table.brand') }}</dt>
                <dd class="truncate">{{ vehicle?.brand ?? '—' }}</dd>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <TruckIcon class="h-4 w-4 shrink-0 text-gray-400" />
                <dt class="font-medium text-gray-500 shrink-0">{{ $t('vehicles.table.model') }}</dt>
                <dd class="truncate">{{ vehicle?.model ?? '—' }}</dd>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <SwatchIcon class="h-4 w-4 shrink-0 text-gray-400" />
                <dt class="font-medium text-gray-500 shrink-0">{{ $t('vehicles.table.color') }}</dt>
                <dd class="truncate">{{ vehicle?.description ?? '—' }}</dd>
              </div>
            </dl>
          </template>
        </div>

        <div class="md:w-48 shrink-0 flex flex-col justify-between gap-4">
          <template v-if="skeleton">
            <div class="h-4 w-20 rounded bg-gray-200 animate-pulse md:ml-auto" />
            <div class="h-9 w-full rounded-lg bg-gray-200 animate-pulse mt-auto" />
          </template>
          <template v-else>
            <div class="md:text-right">
              <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {{ $t('vehicles.table.licensePlate') }}
              </p>
              <p class="mt-0.5 text-base font-bold text-gray-800">{{ vehicle?.licensePlate ?? '—' }}</p>
            </div>

            <BaseButton
              :variant="actionButtonVariant"
              full-width
              @click="handleReserve"
            >
              <CalendarIcon class="h-4 w-4 mr-1.5" />
              {{ isAvailable ? $t('reservations.buttons.reserveButton') : canPreReserve ? $t('reservations.buttons.preReserveButton') : statusLabel(vehicle?.category) }}
            </BaseButton>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>