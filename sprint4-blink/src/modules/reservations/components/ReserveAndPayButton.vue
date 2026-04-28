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
      Reserve and Pay
    </BaseButton>

    <p v-if="errorMessage" class="text-sm text-danger" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

const isLoading = ref(false)
const errorMessage = ref('')

async function handleCheckout() {
  if (isLoading.value || props.disabled) return

  errorMessage.value = ''
  isLoading.value = true

  try {
    if (!props.startDate || !props.endDate) {
      errorMessage.value = 'Select dates before proceeding to payment.'
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
    const fallback = 'Could not start checkout. Please try again.'

    const anyErr: any = error
    // eslint-disable-next-line no-console
    console.error('ReserveAndPay checkout failed:', anyErr)
    const backendDetail = anyErr?.responseData?.error || anyErr?.responseData?.message || anyErr?.message

    if (anyErr?.message === 'Invalid vehicle id') {
      errorMessage.value = 'Invalid vehicle selected.'
    } else if (anyErr?.message === 'Missing reservation dates') {
      errorMessage.value = 'Select dates before proceeding to payment.'
    } else if (anyErr?.message === 'Missing reservation locations') {
      errorMessage.value = 'Set pickup and dropoff locations before proceeding to payment.'
    } else if (backendDetail) {
      errorMessage.value = String(backendDetail)
    } else {
      errorMessage.value = fallback
    }
  } finally {
    isLoading.value = false
  }
}
</script>
