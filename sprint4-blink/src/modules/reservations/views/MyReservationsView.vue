<template>
  <AppLayout :title="$t('reservations.myReservations.title')">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">{{ $t('reservations.myReservations.title') }}</h1>
        <p class="mt-2 text-sm text-gray-600">{{ $t('reservations.myReservations.description') }}</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ error }}
      </div>

      <!-- Empty state -->
      <div v-if="!loading && reservations.length === 0" class="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">{{ $t('reservations.myReservations.empty') }}</h3>
        <p class="mt-2 text-sm text-gray-600">{{ $t('reservations.myReservations.emptyDesc') }}</p>
        <div class="mt-6">
          <router-link to="/reservation" class="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            {{ $t('reservations.myReservations.bookNow') }}
          </router-link>
        </div>
      </div>

      <!-- Table -->
      <div v-if="!loading && reservations.length > 0" class="space-y-4">
        <MyReservationsTable
          :reservations="reservations"
          :loading="loading"
          @view-vehicle="openVehicleDetail"
          @edit="openEditModal"
          @delete="openDeleteModal"
          @renew="handleRenew"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <div class="h-12 w-full animate-pulse rounded bg-gray-200" />
        <div class="h-12 w-full animate-pulse rounded bg-gray-200" />
      </div>
    </div>

    <!-- Vehicle Detail Modal -->
    <VehicleDetailModal
      v-if="selectedReservation"
      :show="showVehicleModal"
      :reservation="selectedReservation"
      @close="closeVehicleModal"
      @edit="openEditModal"
      @cancel="handleCancel"
    />

    <!-- Edit Reservation Modal -->
    <EditReservationModal
      v-if="editingReservation"
      :show="showEditModal"
      :reservation="editingReservation"
      @close="closeEditModal"
      @save="handleSaveEdit"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import AppLayout from '@/layouts/AppLayout.vue';
import MyReservationsTable from '@/modules/reservations/components/MyReservationsTable.vue';
import VehicleDetailModal from '@/modules/reservations/components/VehicleDetailModal.vue';
import EditReservationModal from '@/modules/reservations/components/EditReservationModal.vue';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';
import { useToast } from '@/shared/composables/useToast';

const { t } = useI18n();
const toast = useToast();

const reservations = ref<ReservationLog[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const selectedReservation = ref<ReservationLog | null>(null);
const showVehicleModal = ref(false);
const editingReservation = ref<ReservationLog | null>(null);
const showEditModal = ref(false);

onMounted(async () => {
  await loadReservations();
});

async function loadReservations() {
  try {
    loading.value = true;
    error.value = null;
    reservations.value = await reservationLogService.getMyReservations();
  } catch (err: any) {
    error.value = err?.message || t('reservations.errors.load');
  } finally {
    loading.value = false;
  }
}

async function openVehicleDetail(reservation: ReservationLog) {
  if (!reservation) return;

  try {
    const fullReservation = await reservationLogService.getLogById(reservation.id);
    selectedReservation.value = fullReservation;
  } catch {
    selectedReservation.value = { ...reservation };
  }

  showVehicleModal.value = true;
}

function closeVehicleModal() {
  showVehicleModal.value = false;
}

function openEditModal(reservation: ReservationLog) {
  editingReservation.value = reservation;
  showEditModal.value = true;
  showVehicleModal.value = false;
}

function closeEditModal() {
  showEditModal.value = false;
  editingReservation.value = null;
}

async function handleSaveEdit(updatedData: any) {
  if (!editingReservation.value) return;

  try {
    loading.value = true;
    await reservationLogService.createLog({
      user_id: editingReservation.value.user_id,
      user_name: editingReservation.value.user_name,
      vehicle_id: editingReservation.value.vehicle_id,
      vehicle_name: editingReservation.value.vehicle_name,
      license_plate: editingReservation.value.license_plate,
      status: editingReservation.value.status as any,
      start_at: updatedData.start_at,
      end_at: updatedData.end_at,
      pickup_location: updatedData.pickup_location,
      dropoff_location: updatedData.dropoff_location,
    });

    toast.success(t('reservations.toast.updated'));
    closeEditModal();
    await loadReservations();
  } catch (err: any) {
    toast.error(err?.message || t('reservations.errors.save'));
  } finally {
    loading.value = false;
  }
}

async function handleCancel() {
  if (!confirm(t('reservations.myReservations.confirmCancel'))) return;

  try {
    loading.value = true;
    // Backend deletion would be implemented here
    toast.success(t('reservations.toast.deleted'));
    if (showVehicleModal.value) {
      showVehicleModal.value = false;
    }
    await loadReservations();
  } catch (err: any) {
    toast.error(err?.message || t('reservations.errors.delete'));
  } finally {
    loading.value = false;
  }
}

function openDeleteModal() {
  handleCancel();
}

function handleRenew(reservation: ReservationLog) {
  // Navegar a página de renovación
  window.location.href = `/reservation/${reservation.id}/completed`;
}
</script>
