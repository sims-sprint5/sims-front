<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import FilterSidebar from '@/modules/reservations/components/FilterSidebar.vue';
import VehicleList from '@/modules/reservations/components/VehicleList.vue';
import { useReservationVehicles } from '@/modules/reservations/composables/useReservationVehicles';

const { vehicleCards, loading, filters, facets, resetFilters, error } = useReservationVehicles();
</script>

<template>
  <AppLayout :title="$t('nav.bookings')">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-6">
        <aside class="lg:w-80 shrink-0">
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

        <section class="min-w-0 flex-1">
          <div class="flex items-center justify-end mb-4">
            <div class="text-sm text-gray-600">
              <span class="font-medium text-gray-900">Ordenar por:</span>
              <span class="ml-2">Recomendado</span>
            </div>
          </div>

          <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ error }}
          </div>

          <VehicleList :vehicles="vehicleCards" :loading="loading">
            <template #empty>
              <div class="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
                No hay vehículos que coincidan con los filtros.
              </div>
            </template>
          </VehicleList>
        </section>
      </div>
    </div>
  </AppLayout>
</template>