<template>
  <input
    v-bind="attrs"
    type="datetime-local"
    :value="modelValue"
    @input="onInput"
  >
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  modelValue?: string
  config?: unknown
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const attrs = useAttrs()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>
