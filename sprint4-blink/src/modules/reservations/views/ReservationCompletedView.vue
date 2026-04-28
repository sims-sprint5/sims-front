<template>
  <AppLayout :title="$t('reservations.completed.title')">
    <div class="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <!-- Success Card -->
      <div class="rounded-lg bg-surface p-8 shadow">
        <!-- Success Icon -->
        <div class="mb-6 flex justify-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg class="h-8 w-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h1 class="mb-2 text-center text-2xl font-bold text-main">
          {{ $t('reservations.completed.title') }}
        </h1>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-4">
          <div class="h-4 w-full animate-pulse rounded bg-surface-dark" />
          <div class="h-4 w-3/4 animate-pulse rounded bg-surface-dark" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="space-y-4">
          <p class="text-center text-danger">{{ error }}</p>
          <BaseButton block variant="secondary" @click="goBack">
            {{ $t('common.back') }}
          </BaseButton>
        </div>

        <!-- Reservation Details -->
        <div v-else-if="reservation" class="space-y-6">
          <!-- Vehicle Info -->
          <div class="space-y-2 border-b pb-4">
            <p class="text-sm text-muted">{{ $t('reservations.completed.vehicleInfo') }}</p>
            <h2 class="text-xl font-semibold text-main">{{ reservation.vehicle_name }}</h2>
            <p class="text-sm text-muted">{{ reservation.license_plate }}</p>
          </div>

          <!-- Reservation Times -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <p class="text-xs font-medium uppercase text-muted">{{ $t('reservations.completed.startDate') }}</p>
              <p class="text-lg font-semibold text-main">
                {{ formatDateTime(reservation.start_at) }}
              </p>
            </div>
            <div class="space-y-2">
              <p class="text-xs font-medium uppercase text-muted">{{ $t('reservations.completed.endDate') }}</p>
              <p class="text-lg font-semibold text-main">
                {{ formatDateTime(reservation.end_at) }}
              </p>
            </div>
          </div>

          <!-- Renewal Notice / Warning -->
          <div
            v-if="reservation.renewal_notice"
            class="rounded-lg bg-yellow-50 p-4"
          >
            <div class="flex items-start gap-3">
              <svg class="h-5 w-5 shrink-0 text-warning mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div>
                <p class="text-sm font-semibold text-yellow-800">{{ $t('reservations.completed.notice') }}</p>
                <p class="text-sm text-yellow-700 mt-1">{{ reservation.renewal_notice }}</p>
              </div>
            </div>
          </div>

          <!-- Renewal Section -->
          <div v-if="reservation.can_renew" class="border-t pt-4 space-y-3">
            <div class="space-y-2">
              <p class="text-sm font-medium text-main">{{ $t('reservations.completed.extendReservation') }}</p>
              <p class="text-xs text-muted">
                {{ $t('reservations.completed.extendDescription', { minutes: reservation.minutes_remaining || 0 }) }}
              </p>
            </div>

            <BaseButton
              block
              :loading="renewalLoading"
              :disabled="renewalLoading"
              @click="handleRenewalRequest"
            >
              {{ $t('reservations.completed.proceedToPayment') }}
            </BaseButton>
          </div>

          <!-- No Renewal Available -->
          <div v-else class="rounded-lg bg-base p-4">
            <p class="text-sm text-blue-800">
              {{ $t('reservations.completed.noRenewal') }}
            </p>
          </div>

          <!-- Back Button -->
          <BaseButton block variant="secondary" @click="goBack">
            {{ $t('common.back') }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Renewal Modal -->
    <ReservationRenewalModal
      v-if="renewalData"
      :reservation="reservation!"
      :payment-url="renewalData.payment_url"
      :renewal-notice="renewalData.renewal_notice"
      @close="closeRenewalModal"
      @proceed="proceedToPayment"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import AppLayout from '@/layouts/AppLayout.vue';
import { BaseButton } from '@/components/base';
import ReservationRenewalModal from '@/modules/reservations/components/ReservationRenewalModal.vue';
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service';
import type { ReservationLog, RenewalIntentResponse } from '@/modules/reservations/types/reservationLog.types';
import { clearPendingReservationCheckout, getPendingReservationCheckout } from '@/modules/reservations/utils/checkoutStorage';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';
import { useToast } from '@/shared/composables/useToast';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const { formatDateTime } = useDateFormatter();

const reservation = ref<ReservationLog | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const renewalLoading = ref(false);
const renewalData = ref<RenewalIntentResponse | null>(null);

function resolveReservationIdFromRoute(): number | null {
  const candidates: unknown[] = [
    route.params.id,
    route.query.reservation_id,
    route.query.reservationId,
    route.query.id,
  ];

  for (const candidate of candidates) {
    const value = Array.isArray(candidate) ? candidate[0] : candidate;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return null;
}

function dateKey(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

async function findReservationFromPendingCheckout(): Promise<ReservationLog | null> {
  const pending = getPendingReservationCheckout();
  if (!pending) return null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    let match: ReservationLog | undefined;

    try {
      const myReservations = await reservationLogService.getMyReservationsPages(5, 200);
      match = myReservations.find((item) => {
        const sameVehicle = Number(item.vehicle_id) === Number(pending.vehicleId);
        const sameStart = dateKey(item.start_at) === dateKey(pending.startDate);
        const sameEnd = dateKey(item.end_at) === dateKey(pending.endDate);
        return sameVehicle && sameStart && sameEnd;
      });
    } catch {
      match = undefined;
    }

    if (match) {
      clearPendingReservationCheckout();
      return match;
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 1200);
    });
  }

  return null;
}

async function ensureCompletedStatus(log: ReservationLog): Promise<ReservationLog> {
  if (log.status === 'completed') return log;

  try {
    const updated = await reservationLogService.updateReservationStatus(log.id, 'completed');
    return updated;
  } catch {
    return {
      ...log,
      status: 'completed',
    };
  }
}

onMounted(async () => {
  try {
    loading.value = true;
    const reservationId = resolveReservationIdFromRoute();

    if (reservationId) {
      const byId = await reservationLogService.getLogById(reservationId);
      reservation.value = await ensureCompletedStatus(byId);
      return;
    }

    const found = await findReservationFromPendingCheckout();
    reservation.value = found ? await ensureCompletedStatus(found) : null;
    if (!reservation.value) {
      error.value = t('reservations.errors.load');
    }
  } catch (err: any) {
    error.value = err?.message || t('reservations.errors.load');
  } finally {
    loading.value = false;
  }
});

async function handleRenewalRequest() {
  if (!reservation.value || renewalLoading.value) return;

  try {
    renewalLoading.value = true;
    renewalData.value = await reservationLogService.requestRenewalIntent(reservation.value.id);
  } catch (err: any) {
    toast.error(err?.message || t('reservations.errors.renewal'));
  } finally {
    renewalLoading.value = false;
  }
}

function closeRenewalModal() {
  renewalData.value = null;
}

function proceedToPayment() {
  if (renewalData.value?.payment_url) {
    window.location.href = renewalData.value.payment_url;
  }
}

function goBack() {
  router.push({ name: 'ReservationPage' });
}
</script>
