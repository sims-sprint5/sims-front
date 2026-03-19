<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { BaseButton } from '@/components/base'
import AppLayout from '@/layouts/AppLayout.vue'
import { useUser } from '@/modules/auth/composables/useUser'
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service'
import { useToast } from '@/shared/composables/useToast'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user } = useUser()

const submitting = ref(false)
const showConfirmModal = ref(true)

const selectedVehicle = reactive({
  id: '',
  name: '—',
  brand: '',
  model: '',
  licensePlate: '',
})

const reservationForm = reactive({
  startAt: '',
  endAt: '',
})

function normalizeDateTime(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}

function readQueryString(key: string): string {
  const q = route.query[key]
  if (typeof q === 'string') return q
  if (Array.isArray(q) && typeof q[0] === 'string') return q[0]
  return ''
}

watch(
  () => route.query,
  () => {
    const vehicleId = readQueryString('vehicleId')
    const brand = readQueryString('brand')
    const model = readQueryString('model')
    const licensePlate = readQueryString('licensePlate')

    selectedVehicle.id = vehicleId
    selectedVehicle.brand = brand
    selectedVehicle.model = model
    selectedVehicle.licensePlate = licensePlate
    selectedVehicle.name = [brand, model].filter(Boolean).join(' ').trim() || licensePlate || '—'

    reservationForm.startAt = readQueryString('startAt')
    reservationForm.endAt = readQueryString('endAt')
  },
  { immediate: true }
)

function closeConfirmModal() {
  showConfirmModal.value = false
  router.push({ name: 'ReservationPage' })
}

const canConfirm = computed(() => Boolean(selectedVehicle.id && reservationForm.startAt && reservationForm.endAt))

async function confirmReservation() {
  if (submitting.value) return

  if (!canConfirm.value) {
    toast.error(t('reservations.errors.missingDates'))
    return
  }

  const startDate = new Date(reservationForm.startAt)
  const endDate = new Date(reservationForm.endAt)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
    toast.error(t('reservations.errors.invalidDates'))
    return
  }

  submitting.value = true

  try {
    await reservationLogService.createLog({
      user_id: user.value?.id ?? null,
      user_name: user.value?.name ?? 'N/A',
      vehicle_id: Number(selectedVehicle.id) || 0,
      vehicle_name: selectedVehicle.name,
      license_plate: selectedVehicle.licensePlate,
      status: 'active',
      start_at: normalizeDateTime(reservationForm.startAt),
      end_at: normalizeDateTime(reservationForm.endAt),
    })

    toast.success(t('reservations.toast.created'))
    closeConfirmModal()
  } catch {
    toast.error(t('reservations.errors.create'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppLayout :title="$t('nav.bookings')">
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showConfirmModal"
          class="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="reservation-modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeConfirmModal" />
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
                  {{ selectedVehicle.name }} · {{ $t('reservations.selectDates') }}
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
                <BaseButton variant="secondary" :disabled="submitting" @click="closeConfirmModal">
                  {{ $t('common.cancel') }}
                </BaseButton>
                <BaseButton :loading="submitting" :disabled="!canConfirm" @click="confirmReservation">
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
