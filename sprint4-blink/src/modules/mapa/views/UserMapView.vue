<template>
  <AppLayout :title="pageTitle">
    <div class="h-[calc(100dvh-64px)] md:h-[calc(100vh-64px)] flex flex-col p-3 sm:p-4 overflow-hidden">
      <div class="flex-1 min-h-0 flex gap-3 relative">
        <div class="absolute top-3 right-3 z-[1000]">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 sm:px-4 text-sm font-medium text-inverse shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[40px]"
            @click="openReservationPanel"
            :aria-label="t('mapa.openReservationPanel')"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="hidden sm:inline">{{ t('mapa.openReservationPanel') }}</span>
            <span class="sm:hidden">{{ t('reservations.buttons.reserveButton') }}</span>
          </button>
        </div>

        <div class="flex-1 min-w-0 rounded-lg overflow-hidden shadow-lg">
          <div ref="mapEl" class="w-full h-full"></div>
        </div>

        <div
          v-if="isReservationPanelOpen"
          v-show="!isReservationCreateModalOpen"
          class="absolute inset-0 z-[1100] bg-black/20 backdrop-blur-[1px] md:hidden"
          @click="closeReservationPanel"
          aria-hidden="true"
        />

        <aside
          v-if="isReservationPanelOpen"
          v-show="!isReservationCreateModalOpen"
          class="absolute right-3 top-16 bottom-3 z-[1200] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] rounded-2xl bg-surface/95 shadow-2xl border border-default overflow-hidden flex flex-col backdrop-blur-sm"
          :style="reservationPanelStyle"
          role="complementary"
          :aria-label="t('mapa.reservationPanelTitle')"
        >
          <div
            class="hidden sm:block absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-transparent hover:bg-primary/50"
            @mousedown.prevent="startPanelResize"
            aria-hidden="true"
          />

          <div class="flex items-center justify-between px-4 py-3 border-b border-default/80 bg-base/90">
            <h2 class="text-sm sm:text-base font-semibold text-main">
              {{ t('mapa.reservationPanelTitle') }}
            </h2>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary"
              @click="closeReservationPanel"
              :aria-label="t('mapa.closeReservationPanel')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="h-full w-full overflow-auto">
            <ReservationPage
              :key="reservationPageKey"
              :prefill="reservationPrefill"
              :is-embedded="true"
              :hide-accessibility="true"
              @reservationModalVisibility="onReservationModalVisibility"
            />
          </div>
        </aside>
      </div>
    </div>

    <VehicleDetailsModal
      :open="isModalOpen"
      :car="selectedCar"
      @close="closeVehicleModal"
      @openReservation="openReservationFromVehicle"
    />

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showQuickReservationModal"
          class="fixed inset-0 z-[1400] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-reservation-title"
        >
          <div class="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeQuickReservationModal" />
            <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div class="inline-block w-full max-w-lg transform overflow-hidden rounded-2xl bg-surface text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
              <div class="px-6 py-5">
                <h2 id="quick-reservation-title" class="text-xl font-semibold text-main">
                  {{ t('reservations.createTitle') }}
                </h2>
                <p class="mt-1 text-sm text-muted">
                  {{ t('reservations.createDescription') }}
                </p>

                <p class="mt-3 rounded-lg bg-base px-3 py-2 text-sm text-muted">
                  {{ quickReservationVehicleName }} · {{ t('reservations.selectDates') }} · {{ t('reservations.pricePerHour') }}
                </p>

              

                <BusyDaysCalendar
                  :slots="quickReservationBusySlots"
                  :title="t('reservations.occupancyCalendar')"
                />

                

                <div class="mt-6 space-y-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-main">{{ t('reservations.table.startAt') }}</label>
                    <BaseDateTimePicker
                      v-model="quickReservationForm.startAt"
                      :config="quickStartPickerConfig"
                      class="w-full rounded-lg border border-default px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-main">{{ t('reservations.table.endAt') }}</label>
                    <BaseDateTimePicker
                      v-model="quickReservationForm.endAt"
                      :config="quickEndPickerConfig"
                      class="w-full rounded-lg border border-default px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div class="flex flex-col-reverse gap-3 border-t border-default bg-base px-6 py-4 sm:flex-row sm:justify-end">
                <BaseButton variant="secondary" :disabled="submittingQuickReservation" @click="closeQuickReservationModal">
                  {{ t('common.cancel') }}
                </BaseButton>
                <BaseButton :loading="submittingQuickReservation" @click="submitQuickReservation">
                  {{ t('reservations.reserveAndPay') }}
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick, computed, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import BaseDateTimePicker from '@/components/base/BaseDateTimePicker.vue'
import '@/styles/flatpickr.css'
import { BaseButton } from '@/components/base'
import AppLayout from '@/layouts/AppLayout.vue'
import { geofenceService } from '../services/geofence.service'
import { vehicleService } from '@/modules/vehicles/services/vehicle.service'
import { reservationLogService } from '@/modules/reservations/services/reservationLog.service'
import { createReservationCheckoutSession } from '@/modules/reservations/services/reservationCheckout.service'
import { useUser } from '@/modules/auth/composables/useUser'
import { authService } from '@/modules/auth/services/auth.service'
import { useToast } from '@/shared/composables/useToast'
import type { Geofence } from '../types/geofence.types'
import type { Vehicle } from '@/modules/vehicles/types/vehicle.types'
import VehicleDetailsModal from '../components/VehicleDetailsModal.vue'
import ReservationPage from '@/modules/reservations/views/ReservationPage.vue'
import BusyDaysCalendar from '@/modules/reservations/components/BusyDaysCalendar.vue'

const route = useRoute()
const { t } = useI18n()
const { user } = useUser()
const toast = useToast()

const isMapDebugEnabled = (() => {
  if (!import.meta.env.DEV) return false
  const queryFlag = String(route.query.debugMap ?? '').trim()
  const storageFlag = String(localStorage.getItem('debugMap') ?? '').trim()
  return queryFlag === '1' || queryFlag.toLowerCase() === 'true' || storageFlag === '1' || storageFlag.toLowerCase() === 'true'
})()

const pageTitle = computed(() => {
  const titleKey = route.meta.titleKey as string | undefined
  return titleKey ? t(titleKey) : ''
})

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let userMarker: L.Marker | null = null
let markerLayer: L.LayerGroup | null = null
const isReservationPanelOpen = ref(false)
const isReservationCreateModalOpen = ref(false)
const reservationPanelWidth = ref(0)
const isResizingPanel = ref(false)

const selectedCar = ref<Vehicle | null>(null)
const isModalOpen = ref(false)

const reservationPrefill = ref<Record<string, string> | null>(null)
const reservationPageKey = ref(0)
const quickReservationPayload = ref<Record<string, string> | null>(null)
const showQuickReservationModal = ref(false)
const submittingQuickReservation = ref(false)
const mapVehicles = ref<Vehicle[]>([])
const quickReservationForm = reactive({
  startAt: '',
  endAt: '',
})

const PANEL_SIDE_GAP_PX = 24
const PANEL_RIGHT_OFFSET_PX = 12

const clampPanelWidth = (width: number): number => {
  const maxWidth = Math.max(320, window.innerWidth - PANEL_SIDE_GAP_PX)
  const minWidth = window.innerWidth < 640 ? Math.min(300, maxWidth) : 360
  return Math.min(maxWidth, Math.max(minWidth, width))
}

const getDefaultPanelWidth = (): number => {
  const viewport = window.innerWidth
  if (viewport < 640) return viewport - PANEL_SIDE_GAP_PX
  if (viewport < 768) return 33 * 16
  if (viewport < 1024) return 42 * 16
  return 53 * 16
}

const reservationPanelStyle = computed(() => {
  if (!reservationPanelWidth.value) return undefined
  return {
    width: `${reservationPanelWidth.value}px`,
    maxWidth: 'calc(100% - 1.5rem)'
  }
})

  // Layer to group markers and allow clearing/re-drawing (initialized in initMap)

const syncPanelWidthToViewport = () => {
  const target = reservationPanelWidth.value || getDefaultPanelWidth()
  reservationPanelWidth.value = clampPanelWidth(target)
}

const onPanelResizeMove = (event: MouseEvent) => {
  if (!isResizingPanel.value) return
  const newWidth = window.innerWidth - event.clientX - PANEL_RIGHT_OFFSET_PX
  reservationPanelWidth.value = clampPanelWidth(newWidth)
}

const stopPanelResize = () => {
  if (!isResizingPanel.value) return
  isResizingPanel.value = false
  document.body.classList.remove('select-none', 'cursor-ew-resize')
  window.removeEventListener('mousemove', onPanelResizeMove)
  window.removeEventListener('mouseup', stopPanelResize)
}

const startPanelResize = (event: MouseEvent) => {
  if (window.innerWidth < 640) return
  isResizingPanel.value = true
  document.body.classList.add('select-none', 'cursor-ew-resize')
  onPanelResizeMove(event)
  window.addEventListener('mousemove', onPanelResizeMove)
  window.addEventListener('mouseup', stopPanelResize)
}

const toDateTimeLocalInput = (value: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

const getNextReservableMinute = (): Date => {
  const now = new Date()
  now.setSeconds(0, 0)
  now.setMinutes(now.getMinutes() + 1)
  return now
}

const quickReservationVehicleName = computed(() => {
  const p = quickReservationPayload.value
  if (!p) return ''
  return [p.brand, p.model].filter(Boolean).join(' ').trim() || p.licensePlate || '—'
})

const quickReservationVehicle = computed<Vehicle | null>(() => {
  const vehicleIdRaw = quickReservationPayload.value?.vehicleId
  if (!vehicleIdRaw) return null
  const vehicleId = Number(vehicleIdRaw)
  if (!Number.isFinite(vehicleId)) return null
  return mapVehicles.value.find((v) => Number(v.vehicle_id ?? v.id) === vehicleId) ?? null
})

type ReservationSlot = { startDate: string; endDate: string }
const quickRuntimeConflictSlot = ref<ReservationSlot | null>(null)
type DatePickerConfig = {
  enableTime?: boolean
  time_24hr?: boolean
  minuteIncrement?: number
  dateFormat?: string
  disable?: Array<{ from: Date; to: Date }>
  minDate?: Date
}

const parseDate = (value: string | null | undefined): Date | null => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isReservationStateBlocking = (status: unknown, calendarState: unknown): boolean => {
  const statusKey = String(status ?? '').trim().toLowerCase()
  const calendarStateKey = String(calendarState ?? '').trim().toLowerCase()

  const nonBlockingStates = new Set([
    'cancelled',
    'canceled',
    'completed',
    'finished',
    'expired',
  ])

  if (statusKey && nonBlockingStates.has(statusKey)) return false
  if (calendarStateKey && nonBlockingStates.has(calendarStateKey)) return false
  return true
}

const quickReservationBusySlots = computed<ReservationSlot[]>(() => {
  const vehicle = quickReservationVehicle.value
  if (!vehicle) {
    return quickRuntimeConflictSlot.value ? [quickRuntimeConflictSlot.value] : []
  }

  const now = new Date()
  const slots: ReservationSlot[] = []

  for (const reservation of vehicle.calendar_reservations ?? []) {
    const start = String(reservation.start_date ?? '').trim()
    const end = String(reservation.end_date ?? '').trim()
    const endDate = parseDate(end)
    if (!start || !end || !endDate) continue
    if (endDate < now) continue
    slots.push({ startDate: start, endDate: end })
  }

  const nextStart = String(vehicle.next_reservation?.start_date ?? '').trim()
  const nextEnd = String(vehicle.next_reservation?.end_date ?? '').trim()
  if (nextStart && nextEnd) {
    const alreadyIncluded = slots.some((slot) => slot.startDate === nextStart && slot.endDate === nextEnd)
    const nextEndDate = parseDate(nextEnd)
    if (!alreadyIncluded && nextEndDate && nextEndDate >= now) {
      slots.push({ startDate: nextStart, endDate: nextEnd })
    }
  }

  const nextAvailableAt = parseDate(vehicle.next_available_at)
  if (nextAvailableAt && nextAvailableAt > now) {
    const syntheticStart = toDateTimeLocalInput(now)
    const syntheticEnd = toDateTimeLocalInput(nextAvailableAt)
    const exists = slots.some((slot) => slot.startDate === syntheticStart && slot.endDate === syntheticEnd)
    if (!exists) {
      slots.push({ startDate: syntheticStart, endDate: syntheticEnd })
    }
  }

  if (quickRuntimeConflictSlot.value) {
    const exists = slots.some(
      (slot) =>
        slot.startDate === quickRuntimeConflictSlot.value?.startDate &&
        slot.endDate === quickRuntimeConflictSlot.value?.endDate,
    )
    if (!exists) {
      slots.push(quickRuntimeConflictSlot.value)
    }
  }

  return slots.sort((a, b) => {
    const aStart = parseDate(a.startDate)?.getTime() ?? 0
    const bStart = parseDate(b.startDate)?.getTime() ?? 0
    return aStart - bStart
  })
})

const findOverlappingSlot = (
  startDate: Date,
  endDate: Date,
  slots: ReservationSlot[],
): { start: Date; end: Date } | null => {
  for (const slot of slots) {
    const slotStart = parseDate(slot.startDate)
    const slotEnd = parseDate(slot.endDate)
    if (!slotStart || !slotEnd) continue

    if (startDate < slotEnd && slotStart < endDate) {
      return { start: slotStart, end: slotEnd }
    }
  }

  return null
}

const toDisabledRanges = (slots: ReservationSlot[]): Array<{ from: Date; to: Date }> => {
  return slots
    .map((slot) => {
      const from = parseDate(slot.startDate)
      const end = parseDate(slot.endDate)
      if (!from || !end) return null

      // Keep boundary behavior consistent with overlap checks: end moment can be used as next start.
      const to = new Date(end.getTime() - 1)
      if (to <= from) return null
      return { from, to }
    })
    .filter((range): range is { from: Date; to: Date } => Boolean(range))
}

const quickReservationDisabledRanges = computed(() => toDisabledRanges(quickReservationBusySlots.value))

const quickStartPickerConfig = computed<DatePickerConfig>(() => ({
  enableTime: true,
  time_24hr: true,
  minuteIncrement: 1,
  dateFormat: 'Y-m-d\\TH:i',
  disable: quickReservationDisabledRanges.value,
  minDate: getNextReservableMinute(),
}))

const quickEndPickerConfig = computed<DatePickerConfig>(() => {
  const minEndDate = quickReservationForm.startAt ? parseDate(quickReservationForm.startAt) : null
  return {
    enableTime: true,
    time_24hr: true,
    minuteIncrement: 1,
    dateFormat: 'Y-m-d\\TH:i',
    disable: quickReservationDisabledRanges.value,
    minDate: minEndDate ?? undefined,
  }
})


const openReservationPanel = () => {
  reservationPageKey.value += 1
  reservationPrefill.value = null
  syncPanelWidthToViewport()
  isReservationPanelOpen.value = true
}

const openReservationFromVehicle = (payload: Record<string, string>) => {
  const now = getNextReservableMinute()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  quickReservationPayload.value = payload
  quickRuntimeConflictSlot.value = null
  quickReservationForm.startAt = payload.startAt || toDateTimeLocalInput(now)
  quickReservationForm.endAt = payload.endAt || toDateTimeLocalInput(tomorrow)
  isReservationPanelOpen.value = false
  showQuickReservationModal.value = true
}

const closeQuickReservationModal = () => {
  showQuickReservationModal.value = false
  quickReservationPayload.value = null
  quickRuntimeConflictSlot.value = null
  quickReservationForm.startAt = ''
  quickReservationForm.endAt = ''
}

const closeReservationPanel = () => {
  isReservationPanelOpen.value = false
  isReservationCreateModalOpen.value = false
  reservationPrefill.value = null
}

const onReservationModalVisibility = (open: boolean) => {
  isReservationCreateModalOpen.value = open
}

const closeVehicleModal = () => {
  isModalOpen.value = false
  selectedCar.value = null
}

const normalizeDateTime = (value: string): string => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  const pad = (n: number) => String(n).padStart(2, '0')
  const year = parsed.getFullYear()
  const month = pad(parsed.getMonth() + 1)
  const day = pad(parsed.getDate())
  const hours = pad(parsed.getHours())
  const minutes = pad(parsed.getMinutes())
  const seconds = pad(parsed.getSeconds())

  const offsetMinutes = -parsed.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offsetHours = pad(Math.floor(absOffset / 60))
  const offsetMins = pad(absOffset % 60)

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`
}

const formatDateTimeWithOffset = (value: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = value.getFullYear()
  const month = pad(value.getMonth() + 1)
  const day = pad(value.getDate())
  const hours = pad(value.getHours())
  const minutes = pad(value.getMinutes())
  const seconds = pad(value.getSeconds())

  const offsetMinutes = -value.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offsetHours = pad(Math.floor(absOffset / 60))
  const offsetMins = pad(absOffset % 60)

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`
}

const buildReservationLocationText = (vehicle: Vehicle | null, fallbackName: string): string => {
  if (vehicle) {
    const lat = Number(vehicle.current_latitude)
    const lng = Number(vehicle.current_longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`
    }

    if (vehicle.license_plate?.trim()) {
      return `Vehicle ${vehicle.license_plate.trim()}`
    }
  }

  if (fallbackName.trim()) {
    return `Vehicle ${fallbackName.trim()}`
  }

  return 'Location to be confirmed'
}

const submitQuickReservation = async () => {
  if (!quickReservationPayload.value || submittingQuickReservation.value) return

  if (!quickReservationForm.startAt || !quickReservationForm.endAt) {
    toast.error(t('reservations.errors.missingDates'))
    return
  }

  const startDate = new Date(quickReservationForm.startAt)
  const endDate = new Date(quickReservationForm.endAt)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
    toast.error(t('reservations.errors.invalidDates'))
    return
  }

  const minStartDate = getNextReservableMinute()
  if (startDate < minStartDate) {
    toast.error(t('reservations.errors.availableFrom', { date: minStartDate.toLocaleString() }))
    return
  }

  const localOverlap = findOverlappingSlot(startDate, endDate, quickReservationBusySlots.value)
  if (localOverlap) {
    toast.error(t('reservations.errors.availableFrom', { date: localOverlap.end.toLocaleString() }))
    return
  }

  submittingQuickReservation.value = true
  try {
    const vehicleIdRaw = quickReservationPayload.value.vehicleId
    if (!vehicleIdRaw) {
      toast.error(t('vehicles.errors.notAvailable'))
      return
    }

    const vehicleId = Number(vehicleIdRaw) || 0
    const normalizedStart = normalizeDateTime(quickReservationForm.startAt)
    const normalizedEnd = normalizeDateTime(quickReservationForm.endAt)

    const availability = await reservationLogService.checkAvailability(
      vehicleId,
      normalizedStart,
      normalizedEnd,
    )

    if (!availability.available) {
      let errorMsg = availability.message || t('reservations.errors.notAvailable')

      const conflictStartRaw = String(availability.conflicting_reservation?.start_date ?? '').trim()
      const conflictEndRaw = String(availability.conflicting_reservation?.end_date ?? '').trim()
      if (conflictStartRaw && conflictEndRaw) {
        quickRuntimeConflictSlot.value = { startDate: conflictStartRaw, endDate: conflictEndRaw }
      } else {
        const backendAvailableAt = parseDate(availability.available_at)
        if (backendAvailableAt) {
          quickRuntimeConflictSlot.value = {
            startDate: normalizedStart,
            endDate: toDateTimeLocalInput(backendAvailableAt),
          }
        }
      }

      const conflictingStart = parseDate(availability.conflicting_reservation?.start_date)
      const conflictingEnd = parseDate(availability.conflicting_reservation?.end_date)
      const overlapsWithConflict = Boolean(
        conflictingStart && conflictingEnd && startDate < conflictingEnd && conflictingStart < endDate,
      )

      if (overlapsWithConflict && conflictingEnd) {
        const formatted = conflictingEnd.toLocaleString()
        errorMsg = t('reservations.errors.availableFrom', { date: formatted })
        toast.error(errorMsg)
        return
      } else {
        const backendAvailableAt = parseDate(availability.available_at)
        const formatted = backendAvailableAt?.toLocaleString()
        if (formatted) {
          errorMsg = t('reservations.errors.availableFrom', { date: formatted })
        }
      }

      toast.error(errorMsg)
      return
    }

    try {
      const pickupLocation = buildReservationLocationText(
        quickReservationVehicle.value,
        quickReservationVehicleName.value,
      )

      const { checkoutUrl } = await createReservationCheckoutSession({
        vehicleId,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        pickupLocation,
        dropoffLocation: pickupLocation,
      })
      window.location.assign(checkoutUrl)
    } catch (err: any) {
      console.error('Checkout start failed (QuickReservation):', err)
      const backendDetail = err?.responseData?.error || err?.responseData?.message || err?.message
      toast.error(backendDetail || t('reservations.errors.checkoutFailed'))
      return
    }
  } finally {
    submittingQuickReservation.value = false
  }
}

const vehicleIcon = L.divIcon({
  html: '<i class="fas fa-car" style="color: #000000; font-size: 24px;"></i>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  className: 'vehicle-marker'
})

const getColorByType = (type: string): string => {
  const colors: Record<string, string> = {
    allowed: '#22c55e',
    restricted: '#ef4444',
    parking: '#3b82f6',
    service_area: '#f97316'
  }
  return colors[type] || '#6366f1'
}

const parseCoordinate = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const renderGeofences = (geofences: Geofence[]) => {
  if (!map) return

  geofences.forEach(geofence => {
    const lat = parseCoordinate(geofence.center_latitude)
    const lng = parseCoordinate(geofence.center_longitude)
    if (lat == null || lng == null) return

    const circle = L.circle(
      [lat, lng],
      {
        radius: geofence.radius,
        color: getColorByType(geofence.type),
        fillColor: getColorByType(geofence.type),
        fillOpacity: 0.2,
        weight: 2,
        dashArray: geofence.status === 'inactive' ? '5, 5' : undefined
      }
    )

    circle.addTo(map!)
  })
}

// User map: hide only cars occupied NOW.
// If it has reservations at other times today, it remains visible to reserve available slots.
const filterVehiclesForUserMap = async (
  vehicles: Vehicle[],
  myReservedVehicleIds: Set<number>,
  currentUserId: number,
  currentUserName: string,
): Promise<Vehicle[]> => {
  const now = Date.now()
  const hasCurrentUserId = Number.isFinite(currentUserId) && currentUserId > 0
  const hasCurrentUserName = Boolean(currentUserName)
  const availabilityProbeStart = formatDateTimeWithOffset(new Date(now))
  const availabilityProbeEnd = formatDateTimeWithOffset(new Date(now + 2 * 60 * 1000))
  const visible: Vehicle[] = []

  for (const orig of vehicles) {
    const v = { ...orig } // avoid mutating original objects
      const vehicleId = Number(v.vehicle_id ?? v.id)
      if (!Number.isFinite(vehicleId)) continue

      // Never show maintenance, inactive or out-of-service vehicles to normal users
      const earlyStatus = String(v.status ?? '').trim().toLowerCase()
      if (earlyStatus === 'maintenance' || earlyStatus === 'inactive' || earlyStatus === 'out_of_service' || earlyStatus === 'rented') continue

      // Consider only reservations that are active NOW (start <= now < end).
      const activeNowReservations = (v.calendar_reservations ?? []).filter((cr) => {
        const s = parseDate(cr.start_date)
        const e = parseDate(cr.end_date)
        if (!s || !e) return false
        if (!isReservationStateBlocking(cr.status, cr.calendar_state)) return false
        return s.getTime() <= now && now < e.getTime()
      })
      const hasActiveOrFutureReservation = activeNowReservations.length > 0
      const hasMyActiveOrFutureReservation = activeNowReservations.some((cr) => {
        const reservationUserId = Number(cr.user_id)
        const reservationUserName = String(cr.user_name ?? '').trim().toLowerCase()
        const byId = hasCurrentUserId && Number.isFinite(reservationUserId) && reservationUserId === currentUserId
        const byName = hasCurrentUserName && reservationUserName === currentUserName
        return byId || byName
      })

      // Fallback in case it only comes in next_reservation
      // next_reservation can come for a future reservation; consider it only if it happens NOW
      const nextStart = parseDate(v.next_reservation?.start_date)
      const nextEnd = parseDate(v.next_reservation?.end_date)
      const nextStatus = (v.next_reservation as any)?.status
      const hasNextReservationActiveOrFuture = Boolean(
        nextStart && nextEnd && isReservationStateBlocking(nextStatus, null) && nextStart.getTime() <= now && now < nextEnd.getTime()
      )
      const nextReservationUserId = Number(v.next_reservation?.user_id)
      const nextReservationUserName = String(v.next_reservation?.user_name ?? '').trim().toLowerCase()
      const hasMyNextReservation = Boolean(
        hasNextReservationActiveOrFuture && (
          (hasCurrentUserId && Number.isFinite(nextReservationUserId) && nextReservationUserId === currentUserId)
          || (hasCurrentUserName && nextReservationUserName === currentUserName)
        ),
      )

      const nextAvailableAt = parseDate(v.next_available_at)
      const blockedByNextAvailable = Boolean(nextAvailableAt && now < nextAvailableAt.getTime())
      const statusKey = String(v.status ?? '').trim().toLowerCase()
      // `reserved` or `next_available_at` can represent future availability,
      // not necessarily occupation at this moment. To not hide everything,
      // on the user map we only block by temporal overlap "now".
      const blockedByReservedStatus = statusKey === 'reserved' && (
        hasActiveOrFutureReservation || hasNextReservationActiveOrFuture
      )
      const hasMyReservation = hasMyActiveOrFutureReservation || hasMyNextReservation
      const hasMyReservationById = myReservedVehicleIds.has(vehicleId)

      if (isMapDebugEnabled) {
        console.info('[map-debug] vehicle visibility', {
          vehicleId,
          plate: v.license_plate,
          status: v.status,
          hasActiveOrFutureReservation,
          hasMyActiveOrFutureReservation,
          hasNextReservationActiveOrFuture,
          hasMyNextReservation,
          hasMyReservation,
          hasMyReservationById,
          blockedByNextAvailable,
          nextAvailableAt: v.next_available_at,
          blockedByReservedStatus,
          available: v.available,
        })
      }

      if (hasMyReservation || hasMyReservationById) {
        v.status = 'reserved'
        if (isMapDebugEnabled) {
          console.info('[map-debug] visible own reserved vehicle', {
            vehicleId,
            plate: v.license_plate,
          })
        }
        visible.push(v)
        continue
      }

      const blockedByTemporalOverlap = hasActiveOrFutureReservation || hasNextReservationActiveOrFuture
      if (blockedByTemporalOverlap || blockedByReservedStatus) {
        if (isMapDebugEnabled) {
          console.info('[map-debug] hidden vehicle', {
            vehicleId,
            plate: v.license_plate,
            reason: {
              hasActiveOrFutureReservation,
              hasNextReservationActiveOrFuture,
              blockedByNextAvailable,
              blockedByReservedStatus,
            },
          })
        }
        continue
      }

      // Fallback robusto: cuando status/available/next_available_at sugieren bloqueo,
      // validar disponibilidad real "ahora" con backend para evitar falsos positivos.
      const needsAvailabilityProbe = v.available === false || statusKey === 'reserved' || blockedByNextAvailable
      if (needsAvailabilityProbe) {
        try {
          const availability = await reservationLogService.checkAvailability(
            vehicleId,
            availabilityProbeStart,
            availabilityProbeEnd,
          )
          if (!availability.available) {
            if (isMapDebugEnabled) {
              console.info('[map-debug] hidden by checkAvailability', {
                vehicleId,
                plate: v.license_plate,
                availability,
              })
            }
            continue
          }
        } catch (err) {
          // Si falla el chequeo pero el backend ya marca potencialmente no disponible,
          // ocultamos para evitar enseñar coches reservados por otros usuarios.
          if (isMapDebugEnabled) {
            console.warn('[map-debug] checkAvailability failed', {
              vehicleId,
              plate: v.license_plate,
              error: err,
              fallbackHidden: Boolean(v.available === false || statusKey === 'reserved' || blockedByNextAvailable),
            })
          }
          if (v.available === false || statusKey === 'reserved' || blockedByNextAvailable) {
            continue
          }
        }
      }

      // No está ocupado ahora: visible para reservar hoy u otro día.
      v.status = 'available'
      if (isMapDebugEnabled) {
        console.info('[map-debug] visible vehicle', {
          vehicleId,
          plate: v.license_plate,
        })
      }
      visible.push(v)
  }

  return visible
}

const renderVehicles = (vehicles: Vehicle[]) => {
  if (!map) return

  if (!markerLayer && map) {
    markerLayer = L.layerGroup().addTo(map)
  }

  // Limpiar marcadores anteriores
  markerLayer?.clearLayers()

  vehicles.forEach(vehicle => {
    const lat = parseCoordinate(vehicle.current_latitude)
    const lng = parseCoordinate(vehicle.current_longitude)
    if (lat == null || lng == null) return

    const marker = L.marker(
      [lat, lng],
      {
        title: String(vehicle.brand ?? '').trim() || 'Vehiculo',
        icon: vehicleIcon,
      }
    )

    const vehicleBrandTooltip = String(vehicle.brand ?? '').trim() || 'Vehiculo'
    marker.bindTooltip(vehicleBrandTooltip, {
      direction: 'top',
      offset: [0, -12],
      opacity: 0.95,
      sticky: true,
    })

    marker.on('mouseover', () => {
      marker.openTooltip()
    })

    marker.on('mouseout', () => {
      marker.closeTooltip()
    })

    marker.on('click', () => {
      selectedCar.value = vehicle
      isModalOpen.value = true
    })

    markerLayer?.addLayer(marker)
  })
}

const showUserLocation = () => {
  if (!map || !navigator.geolocation) return

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords
      const latlng = L.latLng(latitude, longitude)

      if (userMarker) {
        userMarker.setLatLng(latlng)
      } else {
        userMarker = L.marker(latlng, {
          icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
        }).addTo(map!)

        userMarker.bindPopup('<b>Tu ubicación</b>')
      }

      map!.setView(latlng, 15)
    },
    () => {
      // Geolocation denied or unavailable — stay on default center
    }
  )
}

const initMap = () => {
  if (!mapEl.value) return

  map = L.map(mapEl.value, {
    center: [41.3851, 2.1734],
    zoom: 13,
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      })
    ]
  })

  setTimeout(() => map?.invalidateSize(), 200)
  // Inicializar layer para marcadores ahora que el mapa existe
  if (map) {
    markerLayer = L.layerGroup().addTo(map)
  }
}

watch(isReservationPanelOpen, async () => {
  await nextTick()
  map?.invalidateSize()
})

onMounted(async () => {
  syncPanelWidthToViewport()
  window.addEventListener('resize', syncPanelWidthToViewport)

  await nextTick()
  initMap()

  try {
    const storedUser = authService.getUser()
    const currentUser = storedUser ?? user.value
    const isAdminRole = currentUser?.role === 'admin' || currentUser?.role === 'superadmin'
    const currentUserId = Number(currentUser?.id ?? 0)
    const currentUserName = String(currentUser?.name ?? '').trim().toLowerCase()

    const geofencesPromise = geofenceService.getGeofences()
    const vehiclesPromise = vehicleService.getVehiclesCalendar(1, 500)
    const myReservationsPromise = isAdminRole ? Promise.resolve([]) : reservationLogService.getMyReservationsPages(3, 200)

    const [geofencesResult, vehiclesResult, myReservationsResult] = await Promise.allSettled([
      geofencesPromise,
      vehiclesPromise,
      myReservationsPromise,
    ])

    const geofences = geofencesResult.status === 'fulfilled' ? geofencesResult.value : []
    const vehiclesResponse = vehiclesResult.status === 'fulfilled' ? vehiclesResult.value : { data: [] }
    let myReservations = myReservationsResult.status === 'fulfilled' ? myReservationsResult.value : []

    if (geofencesResult.status === 'rejected') {
      console.warn('Failed to load geofences:', geofencesResult.reason)
    }
    if (myReservationsResult.status === 'rejected') {
      console.warn('Failed to load my reservations for user map filtering:', myReservationsResult.reason)
      if (!isAdminRole) {
        try {
          myReservations = await reservationLogService.getMyReservations(1, 500)
        } catch (fallbackErr) {
          console.warn('Fallback failed while loading my reservations:', fallbackErr)
        }
      }
    }

    const vehicles = Array.isArray(vehiclesResponse?.data) ? vehiclesResponse.data : []

    if (vehiclesResult.status === 'rejected') {
      console.warn('Failed to load vehicles:', vehiclesResult.reason)
    }

    if (vehicles.length === 0) {
      if (isMapDebugEnabled) {
        console.info('[map-debug] no vehicles returned to render')
      }
      // continuar: queremos que el mapa se inicialice aunque no haya vehículos
    }

    const now = Date.now()
    const myReservedVehicleIds = new Set(
      (myReservations ?? [])
        .filter((reservation) => {
          const end = parseDate(reservation.end_at)
          if (!end) return false

          const statusKey = String(reservation.status ?? '').trim().toLowerCase()
          const isBlockingState = !['cancelled', 'canceled', 'completed', 'finished', 'expired'].includes(statusKey)

          return isBlockingState && now < end.getTime()
        })
        .map((reservation) => Number(reservation.vehicle_id))
        .filter((id) => Number.isFinite(id)),
    )

    let visibleVehicles: Vehicle[]
    if (isAdminRole) {
      visibleVehicles = vehicles
    } else if (myReservedVehicleIds.size > 0) {
      // User has active reservations — only show their reserved car(s)
      visibleVehicles = vehicles
        .filter((v) => myReservedVehicleIds.has(Number(v.vehicle_id ?? v.id)))
        .map((v) => ({ ...v, status: 'reserved' }))
    } else {
      visibleVehicles = await filterVehiclesForUserMap(vehicles, myReservedVehicleIds, currentUserId, currentUserName)
    }
    mapVehicles.value = visibleVehicles

    renderGeofences(geofences)
    renderVehicles(visibleVehicles)
  } catch (err) {
    console.warn('Failed to load map data:', err)
  }

  showUserLocation()
})

onBeforeUnmount(() => {
  stopPanelResize()
  window.removeEventListener('resize', syncPanelWidthToViewport)
  // limpiar marcadores y referencias al desmontar
  try {
    markerLayer?.clearLayers()
    markerLayer = null
  } catch (e) {
    // ignore
  }
})

// Re-renderizar marcadores cuando cambie la lista de vehículos
watch(mapVehicles, (v) => {
  try {
    renderVehicles(v)
  } catch (e) {
    if (isMapDebugEnabled) console.warn('[map-debug] renderVehicles failed on watch', e)
  }
}, { deep: true })
</script>

<style scoped>
:deep(.leaflet-container) {
  z-index: 1;
}

:deep(.user-location-marker) {
  background: transparent;
  border: none;
}
</style>
