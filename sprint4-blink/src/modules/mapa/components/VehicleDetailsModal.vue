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
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $t('reservations.filters.brandLabel') }}</p>
                <p class="text-base font-bold text-gray-900 mt-1">{{ car.brand || '—' }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $t('reservations.filters.modelLabel') }}</p>
                <p class="text-base font-bold text-gray-900 mt-1">{{ car.model || '—' }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $t('reservations.filters.matrixLabel') }}</p>
                <p class="text-base font-bold text-gray-900 mt-1">{{ car.license_plate || '—' }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $t('reservations.filters.statusLabel') }}</p>
                <p class="text-base font-bold text-gray-900 mt-1">{{ statusLabel(getEffectiveStatus(car)) }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $t('reservations.filters.colorsLabel') }}</p>
                <p class="text-base font-bold text-gray-900 mt-1">{{ colorLabel(car.color) }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ultima reserva</p>
                <p class="text-base font-bold text-gray-900 mt-1">{{ lastReservationLabel(car) }}</p>
              </div>
              <!-- Year removed as per UI request -->
            </div>

            <div class="mt-6 space-y-3">
              <BaseButton
                size="lg"
                variant="primary"
                :full-width="true"
                @click="goToReservation(car)"
              >
                {{ canPreReserve(car)
                    ? $t('reservations.buttons.preReserveButton')
                  : isCarAvailable(car)
                    ? $t('reservations.buttons.reserveButton')
                    : statusLabel(car.status)
                }}
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
    status?: string
    available?: string
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

function getNextReservableMinute(): Date {
  const now = new Date()
  now.setSeconds(0, 0)
  now.setMinutes(now.getMinutes() + 1)
  return now
}

function parseReservationDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isBlockingReservationState(status: unknown, calendarState: unknown): boolean {
  const statusKey = String(status ?? '').trim().toLowerCase()
  const calendarStateKey = String(calendarState ?? '').trim().toLowerCase()
  const nonBlockingStates = new Set(['cancelled', 'canceled', 'completed', 'finished', 'expired'])

  if (statusKey && nonBlockingStates.has(statusKey)) return false
  if (calendarStateKey && nonBlockingStates.has(calendarStateKey)) return false
  return true
}

function getCalendarSlots(car: Car): Array<{ start: Date; end: Date }> {
  const rawSlots = Array.isArray(car.calendar_reservations) ? car.calendar_reservations : []
  return rawSlots
    .map((slot) => {
      const start = parseReservationDate((slot as any)?.start_date ?? (slot as any)?.startDate)
      const end = parseReservationDate((slot as any)?.end_date ?? (slot as any)?.endDate)
      if (!start || !end) return null
      return { start, end }
    })
    .filter((slot): slot is { start: Date; end: Date } => Boolean(slot))
}

function hasBlockingReservation(car: Car): boolean {
  const now = new Date()

  const rawSlots = Array.isArray(car.calendar_reservations) ? car.calendar_reservations : []
  for (const rawSlot of rawSlots) {
    const start = parseReservationDate((rawSlot as any)?.start_date ?? (rawSlot as any)?.startDate)
    const end = parseReservationDate((rawSlot as any)?.end_date ?? (rawSlot as any)?.endDate)
    if (!start || !end) continue
    if (!isBlockingReservationState((rawSlot as any)?.status, (rawSlot as any)?.calendar_state)) continue
    if (now < end) return true
  }

  const nextReservationStart = parseReservationDate(car.next_reservation?.start_date)
  const nextReservationEnd = parseReservationDate(car.next_reservation?.end_date)
  const nextReservationStatus = (car.next_reservation as any)?.status
  if (
    nextReservationStart &&
    nextReservationEnd &&
    isBlockingReservationState(nextReservationStatus, null) &&
    now < nextReservationEnd
  ) {
    return true
  }

  return false
}

function getEffectiveStatus(car: Car): string {
  return isCarReservedNow(car) ? 'reserved' : String(car.status ?? '')
}

function isCarReservedNow(car: Car): boolean {
  const now = new Date()
  const slots = getCalendarSlots(car)

  if (slots.some((slot) => slot.start <= now && now < slot.end)) return true

  const nextReservationStart = parseReservationDate(car.next_reservation?.start_date)
  const nextReservationEnd = parseReservationDate(car.next_reservation?.end_date)
  if (nextReservationStart && nextReservationEnd && nextReservationStart <= now && now < nextReservationEnd) return true
  return false
}

function canPreReserve(car: Car): boolean {
  const statusKey = String(car.status ?? '').trim().toLowerCase()
  if (['maintenance', 'inactive', 'out_of_service', 'rented'].includes(statusKey)) return false
  return hasBlockingReservation(car)
}

function getSuggestedStartForPreReservation(car: Car): string {
  const byNextAvailable = parseReservationDate(car.next_available_at)
  if (byNextAvailable) return toDateTimeLocalInput(byNextAvailable)

  const slots = getCalendarSlots(car)
  if (!slots.length) return toDateTimeLocalInput(getNextReservableMinute())

  const sorted = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime())
  let cursor = getNextReservableMinute()

  for (const slot of sorted) {
    if (slot.end <= cursor) continue
    if (slot.start > cursor) {
      return toDateTimeLocalInput(cursor)
    }
    cursor = slot.end
  }

  return toDateTimeLocalInput(cursor)
}

function getLatestReservationEnd(car: Car): Date | null {
  const ends: Date[] = []

  for (const slot of getCalendarSlots(car)) {
    ends.push(slot.end)
  }

  const nextReservationEnd = parseReservationDate(car.next_reservation?.end_date)
  if (nextReservationEnd) ends.push(nextReservationEnd)

  const nextAvailable = parseReservationDate(car.next_available_at)
  if (nextAvailable) ends.push(nextAvailable)

  if (!ends.length) return null
  return ends.sort((a, b) => b.getTime() - a.getTime())[0] ?? null
}

function lastReservationLabel(car: Car): string {
  const latest = getLatestReservationEnd(car)
  if (!latest) return '—'
  return latest.toLocaleString()
}

function isCarAvailable(car: Car): boolean {
  const statusKey = String(car.status ?? '').trim().toLowerCase()
  if (isCarReservedNow(car)) return false
  if (['maintenance', 'inactive', 'out_of_service', 'rented'].includes(statusKey)) return false
  if (statusKey === 'available' || statusKey === 'active') return true
  if (car.available === false) return false
  if (car.available === true) return true
  return true
}



function goToReservation(car: Car) {
  const canReserveNow = isCarAvailable(car)
  const canPreReserveNow = canPreReserve(car)

  if (!canReserveNow && !canPreReserveNow) {
    toast.error(t('vehicles.errors.notAvailable'))
    return
  }

  const vehicleId = Number(car.vehicle_id ?? car.id)

  let startAt = toDateTimeLocalInput(getNextReservableMinute())
  if (canPreReserveNow) {
    startAt = getSuggestedStartForPreReservation(car)
  }

  const end = new Date(startAt)
  if (Number.isNaN(end.getTime())) {
    end.setDate(end.getDate() + 1)
  } else {
    end.setDate(end.getDate() + 1)
  }
  const endAt = toDateTimeLocalInput(end)

  emit('openReservation', {
    vehicleId: String(vehicleId),
    brand: car.brand ?? '',
    model: car.model ?? '',
    licensePlate: car.license_plate ?? '',
    status: getEffectiveStatus(car),
    available: String(canReserveNow),
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
