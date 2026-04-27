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
      <label class="block text-sm font-medium text-main mb-2">{{ $t('tickets.form.descripcion') }}</label>
      <textarea
        v-model="formData.descripcion"
        rows="4"
        class="w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent border-default"
        :placeholder="$t('tickets.form.descripcionPlaceholder')"
      />
      <p v-if="(errors as any).descripcion" class="text-sm text-danger mt-1">{{ formatError((errors as any).descripcion) }}</p>
    </div>

    <!-- Tipo -->
    <div>
      <label class="block text-sm font-medium text-main mb-2">{{ $t('tickets.form.type') }}</label>
      <select
        v-model="formData.type"
        :disabled="typeOptions.length === 0"
        class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
      >
        <option disabled value="">{{ $t('tickets.form.typeSelect') }}</option>
        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <p v-if="(errors as any).type" class="text-sm text-danger mt-1">{{ formatError((errors as any).type) }}</p>
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
import { computed, ref } from 'vue';
import { BaseInput, BaseButton } from '@/components/base';
import type { CreateTicketData } from '@/modules/tickets/types/ticket.types';
import type { ValidationErrors } from '@/modules/tickets/utils/ticketValidation';
import { useFormatError } from '@/shared/composables/useFormatError';

type SelectOption = { label: string; value: string };

interface Props {
  loading?: boolean;
  errors?: ValidationErrors | Record<string, string>;
  typeOptions?: SelectOption[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  errors: () => ({}),
  typeOptions: () => [],
});

const emit = defineEmits<{
  submit: [data: CreateTicketData];
  cancel: [];
}>();

const { formatError } = useFormatError();

const formData = ref<CreateTicketData>({
  asunto: '',
  descripcion: '',
  type: '',
});

const typeOptions = computed(() => props.typeOptions ?? []);

const handleSubmit = () => {
  emit('submit', formData.value);
};
</script>
