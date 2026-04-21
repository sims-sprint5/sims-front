<script setup lang="ts">
import blinkLogo from '@/assets/fleetly_isotip_blanc.svg';  
import { useI18n } from 'vue-i18n';

defineProps<{
  size?: 'sm' | 'md' | 'lg';
}>();

const sizeClasses = {
  sm: 'h-16',
  md: 'h-24',
  lg: 'h-32',
};

const { t } = useI18n();
</script>

<template>
  <div class="flex justify-center mb-6">
    <img 
      :src="blinkLogo" 
      :alt="t('common.logoAlt', { app: t('app.name') })" 
      :class="[sizeClasses[size || 'lg'], 'w-auto object-contain', 'shadow-none']"
    />
  </div>
</template>
