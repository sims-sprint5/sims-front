<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseButton } from '@/components/base';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';
import {
  IdentificationIcon,
  SwatchIcon,
  TruckIcon,
  CalendarIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  vehicle?: ReservationVehicleCardModel;
  skeleton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  vehicle: undefined,
  skeleton: false,
});

const { t } = useI18n();

function statusLabel(raw: string | undefined): string {
  if (!raw) return '—';
  const key = `vehicles.status.${raw.trim().toLowerCase()}`;
  const translated = t(key);
  return translated === key ? raw : translated;
}

const STATUS_STYLES: Record<string, { badge: string; bar: string }> = {
  available:      { badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300',  bar: 'bg-emerald-400' },
  active:         { badge: 'bg-blue-100   text-blue-700   ring-1 ring-blue-300',       bar: 'bg-blue-400'    },
  maintenance:    { badge: 'bg-amber-100  text-amber-700  ring-1 ring-amber-300',      bar: 'bg-amber-400'   },
  reserved:       { badge: 'bg-violet-100 text-violet-700 ring-1 ring-violet-300',     bar: 'bg-violet-400'  },
  rented:         { badge: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300',     bar: 'bg-indigo-400'  },
  inactive:       { badge: 'bg-gray-100   text-gray-500   ring-1 ring-gray-300',       bar: 'bg-gray-300'    },
  out_of_service: { badge: 'bg-red-100    text-red-700    ring-1 ring-red-300',        bar: 'bg-red-400'     },
};

const statusStyle = computed(() => {
  const key = (props.vehicle?.category ?? '').trim().toLowerCase();
  return STATUS_STYLES[key] ?? { badge: 'bg-gray-100 text-gray-500 ring-1 ring-gray-300', bar: 'bg-gray-300' };
});

const isAvailable = computed(() => {
  const key = (props.vehicle?.category ?? '').trim().toLowerCase();
  return key === 'available' || key === 'active';
});
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
              :variant="isAvailable ? 'primary' : 'secondary'"
              full-width
              :disabled="!isAvailable"
            >
              <CalendarIcon class="h-4 w-4 mr-1.5" />
              {{ isAvailable ? $t('common.confirm') : statusLabel(vehicle?.category) }}
            </BaseButton>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>