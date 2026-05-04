<template>
  <div class="space-y-2">
    <BaseButton
      size="lg"
      variant="secondary"
      :full-width="true"
      :loading="isLoading"
      :disabled="isLoading || disabled"
      @click="handleCheckout"
    >
      {{ t('reservations.reserveAndPay') }}
    </BaseButton>

    <p v-if="errorMessage" class="text-sm text-danger" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BaseButton } from '@/components/base'
import { createReservationCheckoutSession } from '@/modules/reservations/services/reservationCheckout.service'

interface Props {
  vehicleId: number | string | null | undefined
  startDate?: string
  endDate?: string
  pickupLocation?: string
  dropoffLocation?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const { t } = useI18n()

const isLoading = ref(false)
const errorMessage = ref('')

async function handleCheckout() {
  if (isLoading.value || props.disabled) return

  errorMessage.value = ''
  isLoading.value = true

  try {
    if (!props.startDate || !props.endDate) {
      errorMessage.value = t('reservations.errors.missingDates') as string
      return
    }

    const { checkoutUrl } = await createReservationCheckoutSession({
      vehicleId: props.vehicleId as number | string,
      startDate: props.startDate,
      endDate: props.endDate,
      pickupLocation: props.pickupLocation || 'Por definir',
      dropoffLocation: props.dropoffLocation || 'Por definir',
    })
    window.location.assign(checkoutUrl)
  } catch (error: unknown) {
    const anyErr: any = error
    // eslint-disable-next-line no-console
    console.error('ReserveAndPay checkout failed:', anyErr)
    const backendDetail = anyErr?.responseData?.error || anyErr?.responseData?.message || anyErr?.message

    if (anyErr?.message === 'Invalid vehicle id') {
      errorMessage.value = t('reservations.errors.invalidVehicle') as string
    } else if (anyErr?.message === 'Missing reservation dates') {
      errorMessage.value = t('reservations.errors.missingDates') as string
    } else if (anyErr?.message === 'Missing reservation locations') {
      errorMessage.value = t('reservations.errors.missingLocations') as string
    } else if (backendDetail) {
      errorMessage.value = String(backendDetail)
    } else {
      errorMessage.value = t('reservations.errors.checkoutFailed') as string
    }
  } finally {
    isLoading.value = false
  }
}
</script>