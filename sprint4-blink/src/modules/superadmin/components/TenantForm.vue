<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <BaseInput v-model="formData.name" :label="$t('tenants.form.name')" type="text"
      :placeholder="$t('tenants.form.namePlaceholder')" required />
    <BaseInput v-model="formData.domain" :label="$t('tenants.form.domain')" type="text"
      :placeholder="$t('tenants.form.domainPlaceholder')" required />
    <BaseInput v-model="formData.email" :label="$t('tenants.form.email')" type="email"
      :placeholder="$t('tenants.form.emailPlaceholder')" />

    <div v-if="isEditing" class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        {{ $t('tenants.form.status') }}
      </label>
      <select v-model="formData.status"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="active">{{ $t('tenants.status.active') }}</option>
        <option value="inactive">{{ $t('tenants.status.inactive') }}</option>
      </select>
    </div>

    <div class="flex justify-end space-x-3 pt-4">
      <BaseButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="loading">
        {{ isEditing ? $t('tenants.actions.update') : $t('tenants.actions.create') }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { BaseInput, BaseButton } from '@/components/base';
import type { Tenant, CreateTenantData, UpdateTenantData } from '../types/superadmin.types';

interface Props {
  tenant?: Tenant | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  tenant: null,
  loading: false,
});

const emit = defineEmits<{
  submit: [data: CreateTenantData | UpdateTenantData];
  cancel: [];
}>();

// Tipus intern del formulari: email sempre és string (no undefined)
// perquè BaseInput requereix modelValue: string | number
interface FormState {
  name: string;
  domain: string;
  email: string;
  status: 'active' | 'inactive';
}

const isEditing = ref(false);
const formData = ref<FormState>({
  name: '',
  domain: '',
  email: '',
  status: 'active',
});

watch(
  () => props.tenant,
  (newTenant) => {
    if (newTenant) {
      isEditing.value = true;
      formData.value = {
        name: newTenant.name,
        domain: newTenant.domain,
        email: newTenant.email ?? '',
        status: newTenant.status ?? 'active',
      };
    } else {
      isEditing.value = false;
      formData.value = { name: '', domain: '', email: '', status: 'active' };
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  emit('submit', { ...formData.value });
};
</script>