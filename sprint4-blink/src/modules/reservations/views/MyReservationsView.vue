<template>
  <AppLayout :title="$t('reservations.myReservations.title')">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-main">{{ $t('reservations.myReservations.title') }}</h1>
        <p class="mt-2 text-sm text-muted">{{ $t('reservations.myReservations.description') }}</p>
      </div>

      <div v-if="error" class="mb-6 rounded-lg border border-red-200 bg-danger/10 px-4 py-3 text-sm text-danger">
        {{ error }}
      </div>

      <div v-if="debugEnabled" class="mb-6 rounded-lg border border-warning bg-warning/10 p-4">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-warning-dark">Reservation Debug Mode</h2>
          <span class="text-xs text-warning-dark">Activo via ?debugReservations=1</span>
        </div>
        <p class="mb-2 text-xs text-warning-dark">
          Revisa payload crudo y normalizado para diagnosticar por que no aparecen reservas.
        </p>
        <pre class="max-h-80 overflow-auto rounded bg-surface p-3 text-[11px] leading-4 text-main">{{ debugDump }}</pre>
      </div>

      <div v-if="!loading && reservations.length === 0" class="rounded-lg border border-default bg-surface p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-main">{{ $t('reservations.myReservations.empty') }}</h3>
        <p class="mt-2 text-sm text-muted">{{ $t('reservations.myReservations.emptyDesc') }}</p>
        <div class="mt-6">
          <router-link to="/reservation" class="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-inverse hover:brightness-110 hover:text-inverse transition-all">
            {{ $t('reservations.myReservations.bookNow') }}
          </router-link>
        </div>
      </div>

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

      <div v-if="loading" class="space-y-4">
        <div class="h-12 w-full animate-pulse rounded bg-surface-dark" />
        <div class="h-12 w-full animate-pulse rounded bg-surface-dark" />
      </div>
    </div>

    <VehicleDetailModal
      v-if="selectedReservation"
      :show="showVehicleModal"
      :reservation="selectedReservation"
      @close="closeVehicleModal"
      @cancel="handleCancel"
    />

    <EditReservationModal
      v-if="editingReservation"
      :show="showEditModal"
      :reservation="editingReservation"
      @close="closeEditModal"
      @save="handleSaveEdit"
    />

    <BaseModal
      :show="showDeleteModal"
      :title="$t('reservations.myReservations.confirmDeleteTitle')"
      :message="$t('reservations.myReservations.confirmCancel')"
      type="danger"
      :confirm-text="$t('common.delete')"
      :cancel-text="$t('common.cancel')"
      :loading="deleting"
      @confirm="confirmDeleteReservation"
      @close="closeDeleteModal"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppLayout from '@/layouts/AppLayout.vue';
import MyReservationsTable from '@/modules/reservations/components/MyReservationsTable.vue';
import VehicleDetailModal from '@/modules/reservations/components/VehicleDetailModal.vue';
import EditReservationModal from '@/modules/reservations/components/EditReservationModal.vue';
import BaseModal from '@/components/base/BaseModal.vue';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import type { ReservationLog } from '@/modules/reservations/types/reservationLog.types';
import { clearPendingReservationCheckout, getPendingReservationCheckout } from '@/modules/reservations/utils/checkoutStorage';
import {
  getReservationDebugEventName,
  getReservationDebugSnapshot,
  isReservationDebugEnabled,
} from '@/modules/reservations/utils/reservationDebug';
import { useToast } from '@/shared/composables/useToast';

const { t } = useI18n();
const toast = useToast();
const router = useRouter();

const reservations = ref<ReservationLog[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const selectedReservation = ref<ReservationLog | null>(null);
const showVehicleModal = ref(false);
const editingReservation = ref<ReservationLog | null>(null);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const reservationToDelete = ref<ReservationLog | null>(null);
const deleting = ref(false);
let retryTimer: number | null = null;

const debugEnabled = ref(false);
const debugEntries = ref<any[]>([]);

const debugDump = computed(() =>
  JSON.stringify(
    {
      pendingCheckout: getPendingReservationCheckout(),
      reservationsCount: reservations.value.length,
      lastEntries: debugEntries.value.slice(-8),
    },
    null,
    2,
  ),
);

function refreshDebugEntries() {
  debugEntries.value = getReservationDebugSnapshot();
}

onMounted(async () => {
  const pending = getPendingReservationCheckout();
  if (pending) {
    await router.replace({ name: 'MyReservations' });
    return;
  }

  debugEnabled.value = isReservationDebugEnabled();
  if (debugEnabled.value) {
    refreshDebugEntries();
    window.addEventListener(getReservationDebugEventName(), refreshDebugEntries);
  }

  await loadReservations();
  startAutoRefreshAfterCheckout();
  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  if (retryTimer) {
    window.clearInterval(retryTimer);
    retryTimer = null;
  }

  window.removeEventListener('focus', handleWindowFocus);
  document.removeEventListener('visibilitychange', handleVisibilityChange);

  if (debugEnabled.value) {
    window.removeEventListener(getReservationDebugEventName(), refreshDebugEntries);
  }
});

async function loadReservations() {
  try {
    loading.value = true;
    error.value = null;
    const data = await reservationLogService.getMyReservationsPages(5, 200);
    reservations.value = data.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    const pending = getPendingReservationCheckout();
    if (pending) {
      const found = reservations.value.some((item) =>
        Number(item.vehicle_id) === Number(pending.vehicleId) &&
        dateKey(item.start_at) === dateKey(pending.startDate) &&
        dateKey(item.end_at) === dateKey(pending.endDate),
      );
      if (found) {
        clearPendingReservationCheckout();
      }
    }
  } catch (err: any) {
    error.value = err?.message || t('reservations.errors.load');
  } finally {
    loading.value = false;
  }
}

function dateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function startAutoRefreshAfterCheckout() {
  if (retryTimer) {
    window.clearInterval(retryTimer);
    retryTimer = null;
  }

  const pending = getPendingReservationCheckout();
  if (!pending) return;

  let attempts = 0;
  retryTimer = window.setInterval(async () => {
    attempts += 1;
    await loadReservations();

    if (!getPendingReservationCheckout() || attempts >= 8) {
      if (retryTimer) {
        window.clearInterval(retryTimer);
        retryTimer = null;
      }
    }
  }, 1500);
}

function handleWindowFocus() {
  void loadReservations();
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    void loadReservations();
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

async function handleSaveEdit(_updatedData?: any) {
  if (!editingReservation.value) return;

  try {
    loading.value = true;
    // Simply reload reservations since the edit modal already called the API
    await loadReservations();
    toast.success(t('reservations.toast.updated'));
    closeEditModal();
  } catch (err: any) {
    toast.error(err?.message || t('reservations.errors.save'));
  } finally {
    loading.value = false;
  }
}

async function handleCancel(reservation?: ReservationLog) {
  const targetReservation = reservation || selectedReservation.value;
  if (!targetReservation) return;

  reservationToDelete.value = targetReservation;
  showDeleteModal.value = true;
}

function openDeleteModal(reservation: ReservationLog) {
  void handleCancel(reservation);
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  reservationToDelete.value = null;
}

async function confirmDeleteReservation() {
  if (!reservationToDelete.value) return;

  try {
    deleting.value = true;
    await reservationLogService.deleteReservation(reservationToDelete.value.id);
    toast.success(t('reservations.toast.deleted'));
    if (showVehicleModal.value) {
      showVehicleModal.value = false;
    }
    closeDeleteModal();
    await loadReservations();
  } catch (err: any) {
    const errorMessage = err?.response?.data?.message || err?.message || t('reservations.errors.delete');
    toast.error(errorMessage);
  } finally {
    deleting.value = false;
  }
}

function handleRenew(reservation: ReservationLog) {
  window.location.href = `/reservation/${reservation.id}/completed`;
}
</script>
