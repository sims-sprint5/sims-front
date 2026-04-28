<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  text?: string;
  disabled?: boolean;
  position?: 'top' | 'right';
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  disabled: false,
  position: 'top',
  fullWidth: false,
});

const isVisible = ref(false);

const hasText = computed(() => props.text.trim().length > 0);

const shouldShow = computed(() => {
  return !props.disabled && hasText.value && isVisible.value;
});

const wrapperClass = computed(() => {
  return props.fullWidth ? 'w-full' : 'inline-flex';
});

const tooltipPositionClass = computed(() => {
  if (props.position === 'right') {
    return 'left-full top-1/2 ml-2 -translate-y-1/2';
  }

  return 'left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(100%+0.5rem)]';
});

const showTooltip = () => {
  isVisible.value = true;
};

const hideTooltip = () => {
  isVisible.value = false;
};
</script>

<template>
  <span
    class="relative"
    :class="wrapperClass"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focusin="showTooltip"
    @focusout="hideTooltip"
  >
    <slot />

    <span
      v-if="shouldShow"
      class="pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow"
      :class="tooltipPositionClass"
      role="tooltip"
    >
      {{ text }}
    </span>
  </span>
</template>