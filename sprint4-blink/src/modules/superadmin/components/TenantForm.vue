<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- CREATION MODE -->
    <template v-if="!isEditing">
      <div class="space-y-4 border-b pb-4 mb-4">
        <p class="text-sm text-gray-600">{{ $t('tenants.form.creationInfo') }}</p>
        
        <BaseInput
          v-model="formData.id"
          :label="$t('tenants.form.id')"
          type="text"
          :placeholder="$t('tenants.form.idPlaceholder')"
          required
        />
        
        <BaseInput
          v-model="formData.name"
          :label="$t('tenants.form.name')"
          type="text"
          :placeholder="$t('tenants.form.namePlaceholder')"
          required
        />
        
        <BaseInput
          v-model="formData.admin_email"
          :label="$t('tenants.form.admin_email')"
          type="email"
          :placeholder="$t('tenants.form.admin_emailPlaceholder')"
          required
        />
        
        <BaseInput
          v-model="formData.admin_password"
          :label="$t('tenants.form.admin_password')"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="$t('tenants.form.admin_passwordPlaceholder')"
          required
        />

        <!-- Password Cofirmation -->
        <BaseInput
          v-model="formData.admin_password_confirmation"
          :label="$t('tenants.form.admin_passwordConfirmation')"
          :type="showPasswordConfirmation ? 'text' : 'password'"
          :placeholder="$t('tenants.form.changePasswordConfirmationPlaceholder')"
          :error="passwordMismatchError"
          required
        />

      </div>
    </template>

    <!-- EDIT MODE -->
    <template v-else>
      <div class="space-y-4">
        <!-- Company ID (read-only) -->
        <div class="bg-gray-50 px-3 py-2 border border-gray-300 rounded-lg">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('tenants.form.id') }}
          </label>
          <p class="text-gray-900 font-mono">{{ formData.id }}</p>
        </div>

        <!-- Name -->
        <BaseInput
          v-model="formData.name"
          :label="$t('tenants.form.name')"
          type="text"
          :placeholder="$t('tenants.form.namePlaceholder')"
          required
        />

        <!-- Admin Email -->
        <BaseInput
          v-model="formData.admin_email"
          :label="$t('tenants.form.admin_email')"
          type="email"
          :placeholder="$t('tenants.form.admin_emailPlaceholder')"
        />

        <!-- Change Password -->
        <div class="pt-2 border-t">
          <p class="text-sm font-medium text-gray-700 mb-3">
            {{ $t('tenants.form.changePasswordLabel') }}
          </p>

          <BaseInput
            v-model="formData.admin_password"
            :label="$t('tenants.form.admin_password')"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="$t('tenants.form.changePasswordPlaceholder')"
          />

          <!-- Password Confirmation -->
          <BaseInput
            v-model="formData.admin_password_confirmation"
            :label="$t('tenants.form.admin_passwordConfirmation')"
            :type="showPasswordConfirmation ? 'text' : 'password'"
            :placeholder="$t('tenants.form.changePasswordConfirmationPlaceholder')"
            :error="passwordMismatchError"
            class="mt-3"
          />

          <p class="text-xs text-gray-500 mt-2">
            {{ $t('tenants.form.changePasswordHint') }}
          </p>

        </div>
      </div>
    </template>

    <div class="flex justify-end space-x-3 pt-4">
      <BaseButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="loading" :disabled="!!passwordMismatchError">
        {{ isEditing ? $t('tenants.actions.update') : $t('tenants.actions.create') }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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

interface FormState {
  id: string;
  name: string;
  admin_email: string;
  admin_password: string;
  admin_password_confirmation: string;
}

const isEditing = ref(false);
const showPassword = ref(false);
const showPasswordConfirmation = ref(false);

// Toggling password method
const toggleShowpassword = () => {
  showPassword.value = !showPassword.value;
};

const toggleShowPasswordConfirmation = () => {
  showPasswordConfirmation.value = !showPasswordConfirmation.value;
};


const formData = ref<FormState>({
  id: '',
  name: '',
  admin_email: '',
  admin_password: '',
  admin_password_confirmation: '',
});

watch(
  () => props.tenant,
  (newTenant) => {
    if (newTenant) {
      isEditing.value = true;
      formData.value = {
        id: newTenant.id,
        name: newTenant.name,
        admin_email: newTenant.admin_email ?? '',
        admin_password: '',
        admin_password_confirmation: '',
      };
    } else {
      isEditing.value = false;
      formData.value = {
        id: '',
        name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirmation: '',
      };
    }
  },
  { immediate: true }
);

const passwordMismatchError = computed(() => {
  if (!formData.value.admin_password && !formData.value.admin_password_confirmation) {
    return '';
  }
  if (formData.value.admin_password !== formData.value.admin_password_confirmation) {
    return 'validation.passwordMismatch';
  }
  return '';
});


const handleSubmit = () => {

  if (passwordMismatchError.value) {
    return;
  }

  if (isEditing.value) {
    const payload: UpdateTenantData = {
      id: formData.value.id,
      name: formData.value.name,
      admin_email: formData.value.admin_email,
      admin_password: formData.value.admin_password || undefined,
    };
    emit('submit', payload);
  } else {
    const payload: CreateTenantData = {
      id: formData.value.id,
      name: formData.value.name,
      admin_email: formData.value.admin_email,
      admin_password: formData.value.admin_password,
    };
    emit('submit', payload);
  }
};
</script>