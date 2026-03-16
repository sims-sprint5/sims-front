<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <BaseInput
          v-model="formData.name"
          :label="$t('users.form.name')"
          type="text"
          :placeholder="$t('users.form.namePlaceholder')"
          :error="formatError((errors as any).name)"
          required
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.email"
          :label="$t('users.form.email')"
          type="email"
          :placeholder="$t('users.form.emailPlaceholder')"
          :error="formatError((errors as any).email)"
          required
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.phone"
          :label="$t('users.form.phone')"
          type="tel"
          :placeholder="$t('users.form.phonePlaceholder')"
          :error="formatError((errors as any).phone)"
          @keydown="onPhoneKeydown"
          @paste="onPhonePaste"
          required
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          {{ $t('users.form.role') }}
        </label>
        <select
          v-model="formData.role"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="user">{{ $t('roles.user') }}</option>
          <option value="admin">{{ $t('roles.admin') }}</option>
        </select>
        <p v-if="(errors as any).role" class="text-sm text-red-600">{{ formatError((errors as any).role) }}</p>
      </div>

      <div>
        <BaseInput
          v-model="formData.password"
          :label="$t('users.form.password')"
          :placeholder="$t('users.form.passwordPlaceholder')"
          :error="formatError((errors as any).password)"
          :required="!isEditing"
          :type="showPassword ? 'text' : 'password'"
          :showPasswordToggle="true"
          @togglePassword="toggleShowPassword"
        />
      </div>

      <div>
        <BaseInput
          v-model="formData.password_confirmation"
          :label="$t('users.form.passwordConfirmation')"
          :placeholder="$t('users.form.passwordPlaceholder')"
          :error="formatError((errors as any).password_confirmation || passwordMismatchError)"
          :required="!isEditing && !!formData.password"
          :type="showPasswordConfirmation ? 'text' : 'password'"
          :showPasswordToggle="true"
          @togglePassword="toggleShowPasswordConfirmation"
        />
      </div>
    </div>

    <div class="flex justify-end space-x-3 pt-2">
      <BaseButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit" :loading="loading" :disabled="!!passwordMismatchError">
        {{ isEditing ? $t('users.actions.updateUser') : $t('users.actions.createUser') }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { BaseInput, BaseButton } from '@/components/base';
import type { User, CreateUserData, UpdateUserData } from '@/modules/users/types/user.types';
import { useUserForm } from '@/modules/users/composables/useUserForm';
import type { ValidationErrors } from '@/modules/users/utils/userValidation';
import { useFormatError } from '@/shared/composables/useFormatError';

interface Props {
  user?: User | null;
  loading?: boolean;
  errors?: ValidationErrors | Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  loading: false,
  errors: () => ({}),
});

const emit = defineEmits<{
  submit: [data: CreateUserData | UpdateUserData];
  cancel: [];
}>(); 

const { formatError } = useFormatError();

const isEditing = ref(false);
const formData = ref<CreateUserData>({
  name: '',
  email: '',
  phone: '',
  role: 'user',
  password: '',
  password_confirmation: '',
});

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      isEditing.value = true;
      formData.value = {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role as 'user' | 'admin',
        password: '',
        password_confirmation: '',
      } as CreateUserData;
    } else {
      isEditing.value = false;
      formData.value = {
        name: '',
        email: '',
        phone: '',
        role: 'user',
        password: '',
        password_confirmation: '',
      };
    }
  },
  { immediate: true }
);

const { passwordMismatchError, onPhoneKeydown, onPhonePaste } = useUserForm(formData);

const showPassword = ref(false);
const showPasswordConfirmation = ref(false);

const toggleShowPassword = () => {
  showPassword.value = !showPassword.value;
};

const toggleShowPasswordConfirmation = () => {
  showPasswordConfirmation.value = !showPasswordConfirmation.value;
};

const handleSubmit = () => {
  if (passwordMismatchError.value) return;
  
  if (isEditing.value) {
    const updateData: UpdateUserData = {
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      role: formData.value.role,
    };

    if (formData.value.password) {
      updateData.password = formData.value.password;
      updateData.password_confirmation = formData.value.password_confirmation;
    }

    emit('submit', updateData);
  } else {
    emit('submit', formData.value);
  }
};
</script>
