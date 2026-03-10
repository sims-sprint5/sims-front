<script setup lang="ts">
import { BaseButton, BaseInput } from '@/components/base';
import type { ReservationFilters } from '@/modules/reservations/types/reservationFilters.types';

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
  <div class="bg-gray-50 rounded-2xl shadow-lg border border-gray-100 p-5 max-h-[calc(100vh-8.5rem)] overflow-auto">
    <div class="mb-4 flex justify-center">
    </div>

    <div class="flex items-center justify-between mb-5">
      <h2 class="text-base font-bold text-gray-900">Filtros</h2>
      <BaseButton size="sm" variant="secondary" :disabled="disabled" @click="onReset">
        Restablecer
      </BaseButton>
    </div>

    <div class="space-y-6">
      <section>
        <BaseInput
          :model-value="modelValue.search"
          type="search"
          label="Buscar"
          placeholder="Matrícula, marca o modelo"
          icon="search"
          :disabled="disabled"
          @update:model-value="(v) => patchFilters({ search: String(v ?? '') })"
        />
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-900 mb-2">Estado</h3>
        <select
          class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          :disabled="disabled"
          :value="modelValue.status ?? ''"
          @change="patchFilters({ status: ($event.target as HTMLSelectElement).value || null })"
        >
          <option value="">Todos</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-900 mb-2">Marca</h3>
        <select
          class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          :disabled="disabled"
          :value="modelValue.brand ?? ''"
          @change="patchFilters({ brand: ($event.target as HTMLSelectElement).value || null })"
        >
          <option value="">Todas</option>
          <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
        </select>
      </section>

      <section>
        <h3 class="text-sm font-semibold text-gray-900 mb-2">Año</h3>
        <div class="grid grid-cols-2 gap-3">
          <BaseInput
            :model-value="modelValue.yearFrom ?? ''"
            type="number"
            label="Desde"
            :placeholder="yearMin !== null ? String(yearMin) : ''"
            :disabled="disabled"
            @update:model-value="(v) => patchFilters({ yearFrom: toNumberOrNull(v) })"
          />
          <BaseInput
            :model-value="modelValue.yearTo ?? ''"
            type="number"
            label="Hasta"
            :placeholder="yearMax !== null ? String(yearMax) : ''"
            :disabled="disabled"
            @update:model-value="(v) => patchFilters({ yearTo: toNumberOrNull(v) })"
          />
        </div>
      </section>
    </div>
  </div>
</template>