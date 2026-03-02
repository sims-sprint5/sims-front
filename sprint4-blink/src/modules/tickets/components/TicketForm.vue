<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Asunto -->
    <BaseInput
      v-model="formData.asunto"
      :label="$t('tickets.form.asunto')"
      type="text"
      :placeholder="$t('tickets.form.asuntoPlaceholder')"
      :error="formatError((errors as any).asunto)"
      required
    />


    <!-- Descripcion / Problema -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('tickets.form.descripcion') }}</label>
      <textarea
        v-model="formData.descripcion"
        rows="4"
        class="w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent border-gray-300"
        :placeholder="$t('tickets.form.descripcionPlaceholder')"
      />
      <p v-if="(errors as any).descripcion" class="text-sm text-red-600 mt-1">{{ formatError((errors as any).descripcion) }}</p>
    </div>

    <!-- Tipo -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('tickets.form.type') }}</label>
      <select v-model="formData.type" class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500">
        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <!-- Prioridad -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('tickets.form.priority') }}</label>
      <select v-model="formData.priority" required class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500">
        <option disabled value="">{{ $t('tickets.form.prioritySelect') }}</option>
        <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <p v-if="(errors as any).priority" class="text-sm text-red-600 mt-1">{{ formatError((errors as any).priority) }}</p>
    </div>

    <div class="flex justify-end space-x-3 pt-4">
      <BaseButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="loading">
        {{ $t('tickets.actions.createTicket') }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BaseInput, BaseButton } from '@/components/base';
import type { CreateTicketData } from '@/modules/tickets/types/ticket.types';
import type { ValidationErrors } from '@/modules/tickets/utils/ticketValidation';
import { useI18n } from 'vue-i18n';
import { useFormatError } from '@/shared/composables/useFormatError';

interface Props {
  loading?: boolean;
  errors?: ValidationErrors | Record<string, string>;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  errors: () => ({}),
});

const emit = defineEmits<{
  submit: [data: CreateTicketData];
  cancel: [];
}>();

const { t } = useI18n();
const { formatError } = useFormatError();

const formData = ref<CreateTicketData>({
  asunto: '',
  descripcion: '',
  type: 'support',
  priority: 'medium',
});

const typeOptions = [
  { label: t('tickets.form.typeSupport'), value: 'support' },
  { label: t('tickets.form.typeBilling'), value: 'billing' },
  { label: t('tickets.form.typeTechnical'), value: 'technical' },
  { label: t('tickets.form.typeOther'), value: 'other' },
];

const priorityOptions = [
  { label: t('tickets.form.priorityLow'), value: 'low' },
  { label: t('tickets.form.priorityMedium'), value: 'medium' },
  { label: t('tickets.form.priorityHigh'), value: 'high' },
  { label: t('tickets.form.priorityUrgent'), value: 'urgent' },
];

const handleSubmit = () => {
  emit('submit', formData.value);
};
</script>
