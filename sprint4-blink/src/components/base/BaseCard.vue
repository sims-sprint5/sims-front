<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  padding?: 'sm' | 'md' | 'lg' | 'none';
  shadow?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  shadow: true,
});

const cardClasses = computed(() => [
  'bg-black/70 backdrop-blur-md  rounded-2xl border border-white/10',
  props.shadow ? 'shadow-lg' : '',
  props.padding === 'sm' ? 'p-4' : '',
  props.padding === 'md' ? 'p-8' : '',
  props.padding === 'lg' ? 'p-12' : '',
].filter(Boolean).join(' '));
</script>

<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>
