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
            <h2 class="text-lg font-semibold">Detalles del coche</h2>
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
                <p class="text-sm text-gray-600">Marca</p>
                <p class="font-semibold">{{ car.brand || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Modelo</p>
                <p class="font-semibold">{{ car.model || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Matrícula</p>
                <p class="font-semibold">{{ car.license_plate || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Estado</p>
                <p class="font-semibold">{{ car.status || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Color</p>
                <p class="font-semibold">{{ car.color || '—' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Año</p>
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
                Reservar ahora
              </BaseButton>

              <BaseButton
                size="md"
                variant="secondary"
                :full-width="true"
                @click="emit('close')"
              >
                Cerrar
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
import { useRouter } from 'vue-router'
import { useToast } from '@/shared/composables/useToast'

defineProps<{
  open: boolean
  car: Car | null
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const toast = useToast()

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

async function goToReservation(car: Car) {
  if (!isCarAvailable(car)) {
    toast.error('Este coche no está disponible')
    return
  }

  const vehicleId = Number(car.vehicle_id ?? car.id)
  const startAt = toDateTimeLocalInput(new Date())
  const end = new Date()
  end.setDate(end.getDate() + 1)
  const endAt = toDateTimeLocalInput(end)

  await router.push({
    name: 'ReservationPage',
    query: {
      vehicleId: String(vehicleId),
      brand: car.brand ?? '',
      model: car.model ?? '',
      licensePlate: car.license_plate ?? '',
      startAt,
      endAt,
    },
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
