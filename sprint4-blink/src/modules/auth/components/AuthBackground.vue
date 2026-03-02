<script setup lang="ts">
import backgroundVideo from '@/assets/blackground.mp4';

withDefaults(
  defineProps<{
    containerClass?: string;
  }>(),
  {
    containerClass: 'max-w-md',
  }
);
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
    <video 
      autoplay 
      loop 
      muted 
      playsinline
      class="absolute inset-0 w-full h-full object-cover"
    >
      <source :src="backgroundVideo" type="video/mp4">
    </video>
    
    <!-- Contenido -->
    <div :class="['w-full relative z-10', containerClass]">
      <slot></slot>
    </div>
  </div>
</template>
