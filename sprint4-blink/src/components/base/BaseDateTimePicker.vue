<template>
  <input
    v-bind="attrs"
    type="datetime-local"
    :value="modelValue"
    :min="minValue"
    :step="stepValue"
    @input="onInput"
  >
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue?: string
  config?: unknown
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const attrs = useAttrs()

const toDateTimeLocalInput = (value: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

const minValue = computed(() => {
  const attrsMin = attrs.min
  if (typeof attrsMin === 'string' && attrsMin.trim()) return attrsMin

  const cfg = props.config as { minDate?: Date | string } | undefined
  const minDate = cfg?.minDate
  if (!minDate) return undefined

  if (minDate instanceof Date) {
    return Number.isNaN(minDate.getTime()) ? undefined : toDateTimeLocalInput(minDate)
  }

  const parsed = new Date(minDate)
  return Number.isNaN(parsed.getTime()) ? undefined : toDateTimeLocalInput(parsed)
})

const stepValue = computed(() => {
  const attrsStep = attrs.step
  if (typeof attrsStep === 'string' && attrsStep.trim()) return attrsStep

  const cfg = props.config as { minuteIncrement?: number } | undefined
  const minuteIncrement = Number(cfg?.minuteIncrement)
  if (!Number.isFinite(minuteIncrement) || minuteIncrement <= 0) return undefined
  return String(Math.round(minuteIncrement * 60))
})

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>
