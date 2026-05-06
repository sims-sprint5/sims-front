<script setup lang="ts">
import { computed, useId } from 'vue';
import BaseButton from './BaseButton.vue';
import BaseTooltip from './BaseTooltip.vue';

interface Props {
  modelValue: string | number;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  label?: string;
  placeholder?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'right';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: 'email' | 'password' | 'search' | 'user' | 'phone';
  showPasswordToggle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  tooltip: '',
  tooltipPosition: 'top',
  required: false,
  disabled: false,
  showPasswordToggle: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  'togglePassword': [];
}>();

const inputId = `input-${useId()}`;

const inputClasses = computed(() => {
  const classes = [
    'w-full px-4 py-3 border rounded-lg transition-all bg-surface text-main',
    'focus:ring-2 focus:ring-primary focus:border-transparent',
    'disabled:bg-surface-muted disabled:cursor-not-allowed',
  ];

  // Si hay icono, agregar padding izquierdo
  if (props.icon) {
    classes.push('pl-10');
  }

  // Si hay toggle de password, agregar padding derecho
  if (props.showPasswordToggle) {
    classes.push('pr-12');
  }

  // Estado de error
  if (props.error) {
    classes.push('border-danger');
  } else {
    classes.push('border-border');
  }

  return classes.join(' ');
});

const icons = {
  email: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207',
  password: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
};

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" :for="inputId" class="flex items-center gap-2 text-sm font-medium text-main mb-2">
      <span>{{ label }}</span>
      <span v-if="required" class="text-danger">*</span>
      <BaseTooltip v-if="tooltip" :text="tooltip" :position="tooltipPosition">
        <span
          class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted"
          aria-hidden="true"
        >
          i
        </span>
      </BaseTooltip>
    </label>

    <!-- Input container -->
    <div class="relative">
      <!-- Icono izquierdo -->
      <div v-if="icon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icons[icon]" />
        </svg>
      </div>

      <!-- Input -->
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :title="tooltip"
        :class="inputClasses"
        @input="updateValue"
        @change="updateValue"
        v-on="$attrs"
      />

      <!-- Toggle password visibility -->
      <button
        v-if="showPasswordToggle"
        type="button"
        class="absolute inset-y-0 right-3 flex items-center justify-center bg-transparent focus:outline-none"
        :disabled="disabled"
        @click="emit('togglePassword')"
      >
        <svg v-if="type === 'password'" class="h-5 w-5 text-muted hover:text-main transition-colors" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <svg v-else class="h-5 w-5 text-muted hover:text-main transition-colors" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      </button>
    </div>

    <!-- Error message -->
    <p v-if="error" class="text-danger text-xs mt-1">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear {
  display: none;
}
input[type="password"]::-webkit-credentials-auto-fill-button {
  visibility: hidden;
  display: none !important;
  pointer-events: none;
}
</style>
