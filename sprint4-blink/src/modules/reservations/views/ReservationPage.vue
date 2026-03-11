<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { BaseButton } from '@/components/base';
import AppLayout from '@/layouts/AppLayout.vue';
import { useUser } from '@/modules/auth/composables/useUser';
import FilterSidebar from '@/modules/reservations/components/FilterSidebar.vue';
import VehicleList from '@/modules/reservations/components/VehicleList.vue';
import { useReservationVehicles } from '@/modules/reservations/composables/useReservationVehicles';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import type { ReservationVehicleCardModel } from '@/modules/reservations/types/reservationUi.types';
import { useToast } from '@/shared/composables/useToast';

const { vehicleCards, loading, filters, facets, resetFilters, error } = useReservationVehicles();
const { t } = useI18n();
const { user } = useUser();
const toast = useToast();

const showReservationModal = ref(false);
const selectedVehicle = ref<ReservationVehicleCardModel | null>(null);
const submitting = ref(false);
const reservationForm = reactive({
  startAt: '',
  endAt: '',
});

function openReservationModal(vehicle: ReservationVehicleCardModel) {
  selectedVehicle.value = vehicle;
  reservationForm.startAt = '';
  reservationForm.endAt = '';
  showReservationModal.value = true;
}

function closeReservationModal() {
  showReservationModal.value = false;
  selectedVehicle.value = null;
  reservationForm.startAt = '';
  reservationForm.endAt = '';
}

function normalizeDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

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

  submitting.value = true;

  try {
    await reservationLogService.createLog({
      user_id: user.value?.id ?? null,
      user_name: user.value?.name ?? 'N/A',
      vehicle_id: Number(selectedVehicle.value.id) || 0,
      vehicle_name: selectedVehicle.value.name,
      license_plate: selectedVehicle.value.licensePlate ?? '',
      status: 'active',
      start_at: normalizeDateTime(reservationForm.startAt),
      end_at: normalizeDateTime(reservationForm.endAt),
    });

    toast.success(t('reservations.toast.created'));
    closeReservationModal();
  } catch {
    toast.error(t('reservations.errors.create'));
  } finally {
    submitting.value = false;
  }
}
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

                <div class="mt-6 space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">{{ $t('reservations.table.startAt') }}</label>
                    <input
                      v-model="reservationForm.startAt"
                      type="datetime-local"
                      class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">{{ $t('reservations.table.endAt') }}</label>
                    <input
                      v-model="reservationForm.endAt"
                      type="datetime-local"
                      class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                  </div>
                </div>
              </div>

              <div class="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                <BaseButton variant="secondary" :disabled="submitting" @click="closeReservationModal">
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
  </AppLayout>
</template>