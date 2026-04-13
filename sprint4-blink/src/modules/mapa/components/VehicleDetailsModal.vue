<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        role="dialog"
        aria-modal="true"
        @click.self="emit('close')"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
            <h2 class="text-lg font-semibold">
            {{ $t('vehicles.modal.detailsTitle') }}
            </h2>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
              @click="emit('close')"
            >
              ✕
            </button>
          </div>

          <div class="p-6" v-if="car">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">{{ $t('reservations.filters.brandLabel') }}</p>
                <p class="font-semibold">{{ car.brand || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">{{ $t('reservations.filters.modelLabel') }}</p>
                <p class="font-semibold">{{ car.model || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">{{ $t('reservations.filters.matrixLabel') }}</p>
                <p class="font-semibold">{{ car.license_plate || '—' }}</p>
              </div>
                          <div>
                            <p class="text-sm text-gray-600">{{ $t('reservations.filters.statusLabel') }}</p>
                            <p class="font-semibold">{{ statusLabel(car.status) }}</p>
                          </div>
              <div>
                <p class="text-sm text-gray-600">{{ $t('reservations.filters.colorsLabel') }}</p>
                            <p class="font-semibold">{{ colorLabel(car.color) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">{{ $t('reservations.filters.yearLabel') }}</p>
                <p class="font-semibold">{{ car.year ?? '—' }}</p>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <BaseButton
                size="lg"
                variant="primary"
                :full-width="true"
                @click="goToReservation(car)"
              >
                {{ $t('reservations.buttons.reserveButton') }}
              </BaseButton>

              <BaseButton
                size="md"
                variant="secondary"
                :full-width="true"
                @click="emit('close')"
              >
                {{ $t('reservations.buttons.cancelButton') }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { BaseButton } from '@/components/base'
import type { Vehicle as Car } from '@/modules/vehicles/types/vehicle.types'
import { useToast } from '@/shared/composables/useToast'
import { useI18n } from 'vue-i18n'

defineProps<{
  open: boolean
  car: Car | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openReservation', payload: {
    vehicleId: string
    brand: string
    model: string
    licensePlate: string
    startAt: string
    endAt: string
  }): void
}>()

const toast = useToast()
const { t } = useI18n()

function statusLabel(raw: string | undefined): string {
  if (!raw) return '—'
  const base = String(raw).trim().toLowerCase()
  const vehicleKey = `vehicles.status.${base}`
  const reservationKey = `reservations.status.${base}`

  const translatedVehicle = t(vehicleKey)
  if (translatedVehicle !== vehicleKey) return translatedVehicle

  const translatedReservation = t(reservationKey)
  if (translatedReservation !== reservationKey) return translatedReservation

  return raw
}

function colorLabel(raw: string | undefined): string {
  if (!raw) return '—'
  const base = String(raw).trim().toLowerCase()
  const vehicleKey = `vehicles.colors.${base}`
  const reservationKey = `reservations.colors.${base}`

  const translatedVehicle = t(vehicleKey)
  if (translatedVehicle !== vehicleKey) return translatedVehicle

  const translatedReservation = t(reservationKey)
  if (translatedReservation !== reservationKey) return translatedReservation

  return raw
}

function toDateTimeLocalInput(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

function isCarAvailable(car: Car): boolean {
  if (car.available === true) return true
  if (car.available === false) return false
  const statusKey = String(car.status ?? '').trim().toLowerCase()
  return statusKey === 'available' || statusKey === 'active'
}

function goToReservation(car: Car) {
  if (!isCarAvailable(car)) {
    toast.error(t('vehicles.errors.notAvailable'))
    return
  }

  const vehicleId = Number(car.vehicle_id ?? car.id)
  const startAt = toDateTimeLocalInput(new Date())
  const end = new Date()
  end.setDate(end.getDate() + 1)
  const endAt = toDateTimeLocalInput(end)

  emit('openReservation', {
    vehicleId: String(vehicleId),
    brand: car.brand ?? '',
    model: car.model ?? '',
    licensePlate: car.license_plate ?? '',
    startAt,
    endAt,
  })

  emit('close')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
