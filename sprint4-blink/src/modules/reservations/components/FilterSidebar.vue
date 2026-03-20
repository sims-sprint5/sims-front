<script setup lang="ts">
import { BaseButton, BaseInput } from '@/components/base';
import type { ReservationFilters } from '@/modules/reservations/types/reservationFilters.types';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue: ReservationFilters;
  statuses?: string[];
  brands?: string[];
  yearMin?: number | null;
  yearMax?: number | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  statuses: () => [],
  brands: () => [],
  yearMin: null,
  yearMax: null,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: ReservationFilters];
  reset: [];
}>();

const { t, te } = useI18n();

function patchFilters(partial: Partial<ReservationFilters>) {
  emit('update:modelValue', { ...props.modelValue, ...partial });
}

function toNumberOrNull(value: string | number): number | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function onReset() {
  emit('reset');
}
</script>

<template>
  <div class="bg-gray-50 rounded-2xl shadow-lg border border-gray-100 p-5 max-h-none lg:max-h-[calc(100vh-8.5rem)] overflow-visible lg:overflow-auto">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-base font-bold text-gray-900">{{ t('reservations.filters.title') }}</h2>
      <BaseButton size="sm" variant="secondary" :disabled="disabled" @click="onReset">
        {{ t('reservations.filters.reset') }}
      </BaseButton>
    </div>

    <div class="space-y-6">
      <section>
        <BaseInput
          :model-value="modelValue.search"
          type="search"
          :label="t('reservations.filters.searchLabel')"
          :placeholder="t('reservations.filters.searchPlaceholder')"
          icon="search"
          :disabled="disabled"
          @update:model-value="(v) => patchFilters({ search: String(v ?? '') })"
        />
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-900 mb-2">{{ t('reservations.filters.statusLabel') }}</h3>
        <select
          class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          :disabled="disabled"
          :value="modelValue.status ?? ''"
          @change="patchFilters({ status: ($event.target as HTMLSelectElement).value || null })"
        >
          <option value="">{{ t('reservations.filters.all') }}</option>
          <option v-for="s in statuses" :key="s" :value="s">
            {{ te(`reservations.status.${s}`) ? t(`reservations.status.${s}`) : s }}
          </option>
        </select>
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-900 mb-2">{{ t('reservations.filters.brandLabel') }}</h3>
        <select
          class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          :disabled="disabled"
          :value="modelValue.brand ?? ''"
          @change="patchFilters({ brand: ($event.target as HTMLSelectElement).value || null })"
        >
          <option value="">{{ t('reservations.filters.all') }}</option>
          <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
        </select>
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-900 mb-2">{{ t('reservations.filters.yearLabel') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BaseInput
            :model-value="modelValue.yearFrom ?? ''"
            type="number"
            :label="t('reservations.filters.from')"
            :placeholder="yearMin !== null ? String(yearMin) : ''"
            :disabled="disabled"
            @update:model-value="(v) => patchFilters({ yearFrom: toNumberOrNull(v) })"
          />
          <BaseInput
            :model-value="modelValue.yearTo ?? ''"
            type="number"
            :label="t('reservations.filters.to')"
            :placeholder="yearMax !== null ? String(yearMax) : ''"
            :disabled="disabled"
            @update:model-value="(v) => patchFilters({ yearTo: toNumberOrNull(v) })"
          />
        </div>
      </section>
    </div>
  </div>
</template>