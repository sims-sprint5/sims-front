<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'info' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false,
});

const buttonClasses = computed(() => {
  const classes = [
    'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };
  classes.push(sizeClasses[props.size]);

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-hover text-inverse focus:ring-primary shadow-md',
    secondary: 'bg-surface-inverse hover:opacity-80 text-inverse focus:ring-surface-inverse shadow-md',
    tertiary: 'bg-danger hover:opacity-90 text-inverse focus:ring-danger shadow-md',
    warning: 'bg-warning hover:opacity-90 text-main focus:ring-warning shadow-md',
    info: 'bg-info hover:opacity-90 text-inverse focus:ring-info shadow-md',
    muted: 'bg-surface-muted hover:bg-border text-main focus:ring-border shadow-md',
  };

  classes.push(variantClasses[props.variant]);

  if (props.fullWidth) {
    classes.push('w-full');
  }

  return classes.join(' ');
});
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="buttonClasses">
    <svg v-if="loading" class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>

    <slot />
  </button>
</template>
