<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/modules/auth/services/auth.service';
import type { RegisterData } from '@/modules/auth/types/auth.types';
import { validateRegisterData, type ValidationErrors } from '@/modules/auth/utils/authValidation';
import BaseInput from '@/components/base/BaseInput.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseCard from '@/components/base/BaseCard.vue';
import AuthBackground from '@/modules/auth/components/AuthBackground.vue';
import AuthLogo from '@/modules/auth/components/AuthLogo.vue';
import { useToast } from '@/shared/composables/useToast';
import { useI18n } from 'vue-i18n';
import { useFormatError } from '@/shared/composables/useFormatError';

const router = useRouter();
const toast = useToast();
const { t } = useI18n();
const { formatError } = useFormatError();

const form = reactive<RegisterData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role: 'user',
});

const loading = ref(false);
const fieldErrors = ref<Record<string, string[]>>({});
const validationErrors = ref<ValidationErrors>({});
const showPassword = ref(false);
const showPasswordConfirmation = ref(false);

const validateForm = (): boolean => {
    validationErrors.value = validateRegisterData(
        form.name,
        form.email,
        form.phone,
        form.password,
        form.password_confirmation
    );
    return Object.keys(validationErrors.value).length === 0;
};

const handleRegister = async () => {
    if (!validateForm()) {
        toast.error(t('validation.fixFormErrors'));
        return;
    }

    fieldErrors.value = {};
    validationErrors.value = {};
    loading.value = true;

    try {
        const response = await authService.register(form);

        toast.success(t('auth.register.success', { name: response.user?.name ?? t('app.name') }));

     
        authService.clearAuth();
        router.push({ name: 'Login' });
    } catch (err: any) {
        if (err.errors) {
            fieldErrors.value = err.errors;
            toast.error(t('validation.fixFormErrors'));
        } else {
            const msg = err?.message;
            const translated = typeof msg === 'string' && (msg.startsWith('errors.') || msg.startsWith('validation.'))
                ? t(msg)
                : msg;
            toast.error(translated || t('auth.register.genericError'));
        }
    } finally {
        loading.value = false;
    }
};

const getFieldError = (field: string): string => {
    return validationErrors.value[field as keyof ValidationErrors] || fieldErrors.value[field]?.[0] || '';
};

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

const togglePasswordConfirmationVisibility = () => {
    showPasswordConfirmation.value = !showPasswordConfirmation.value;
};
</script>

<template>
    <AuthBackground container-class="max-w-3xl">
        <BaseCard>
            <AuthLogo />

            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    {{ $t('auth.register.title') }}
                </h1>
                <p class="text-gray-600">
                    {{ $t('auth.register.haveAccount') }}
                    <router-link to="/login" class="text-green-600 hover:text-green-700 font-medium">
                        {{ $t('auth.register.goLogin') }}
                    </router-link>
                </p>
            </div>

            <form @submit.prevent="handleRegister" class="space-y-5">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <BaseInput v-model="form.name" type="text" :label="$t('auth.register.nameLabel')" :placeholder="$t('auth.register.namePlaceholder')" icon="user"
                        :required="true" :disabled="loading" :error="formatError(getFieldError('name'))" />

                    <BaseInput v-model="form.phone" type="tel" :label="$t('auth.register.phoneLabel')" :placeholder="$t('auth.register.phonePlaceholder')" icon="phone"
                        :required="true" :disabled="loading" :error="formatError(getFieldError('phone'))" />

                    <div class="md:col-span-2">
                        <BaseInput v-model="form.email" type="email" :label="$t('auth.register.emailLabel')" :placeholder="$t('auth.register.emailPlaceholder')"
                            icon="email" :required="true" :disabled="loading" :error="formatError(getFieldError('email'))" />
                    </div>

                    <BaseInput v-model="form.password" :type="showPassword ? 'text' : 'password'" :label="$t('auth.register.passwordLabel')"
                        :placeholder="$t('auth.register.passwordPlaceholder')" icon="password" :required="true" :disabled="loading"
                        :error="formatError(getFieldError('password'))" :show-password-toggle="true"
                        @toggle-password="togglePasswordVisibility" />

                    <BaseInput v-model="form.password_confirmation"
                        :type="showPasswordConfirmation ? 'text' : 'password'" :label="$t('auth.register.passwordConfirmationLabel')"
                        :placeholder="$t('auth.register.passwordPlaceholder')" icon="password" :required="true" :disabled="loading"
                        :error="formatError(getFieldError('password_confirmation'))" :show-password-toggle="true"
                        @toggle-password="togglePasswordConfirmationVisibility" />

                    <div class="md:col-span-2">
                        <BaseButton type="submit" :disabled="loading" :loading="loading" full-width>
                            <span v-if="!loading">{{ $t('auth.register.cta') }}</span>
                            <span v-else>{{ $t('auth.register.loading') }}</span>
                        </BaseButton>
                    </div>
                </div>
            </form>
        </BaseCard>
    </AuthBackground>
</template>
