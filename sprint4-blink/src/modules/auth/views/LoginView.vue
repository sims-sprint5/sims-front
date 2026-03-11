<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/modules/auth/services/auth.service';
import type { LoginCredentials } from '@/modules/auth/types/auth.types';
import { validateLoginCredentials, type ValidationErrors } from '@/modules/auth/utils/authValidation';
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

const form = reactive<LoginCredentials>({
    email: '',
    password: '',
});

const loading = ref(false);
const fieldErrors = ref<Record<string, string[]>>({});
const validationErrors = ref<ValidationErrors>({});
const showPassword = ref(false);

const validateForm = (): boolean => {
    validationErrors.value = validateLoginCredentials(form.email, form.password);
    return Object.keys(validationErrors.value).length === 0;
};

const handleLogin = async () => {
    if (!validateForm()) {
        toast.error(t('validation.fixFormErrors'));
        return;
    }

    fieldErrors.value = {};
    validationErrors.value = {};
    loading.value = true;

    try {
        const response = await authService.login(form);

        toast.success(t('auth.login.welcome', { name: response.user.name }));

        router.push('/dashboard');
    } catch (err: any) {
        if (err.errors) {
            fieldErrors.value = err.errors;
            toast.error(t('validation.fixFormErrors'));
        } else {
            const msg = err?.message;
            const translated = typeof msg === 'string' && (msg.startsWith('errors.') || msg.startsWith('validation.'))
                ? t(msg)
                : msg;
            toast.error(translated || t('auth.login.genericError'));
        }
    } finally {
        loading.value = false;
    }
};

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

const getFieldError = (field: string): string => {
    return validationErrors.value[field as keyof ValidationErrors] || fieldErrors.value[field]?.[0] || '';
};
</script>

<template>
    <AuthBackground>
        <BaseCard>
            <AuthLogo />

            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    {{ $t('auth.login.header', { app: $t('app.name') }) }}
                </h1>
                <p class="text-gray-600">
                    {{ $t('auth.login.noAccount') }}
                    <router-link to="/register" class="text-green-600 hover:text-green-700 font-medium">
                        {{ $t('auth.login.goRegister') }}
                    </router-link>
                </p>
            </div>

            <form @submit.prevent="handleLogin" class="space-y-5">

                <BaseInput v-model="form.email" type="email" :label="$t('auth.login.emailLabel')" :placeholder="$t('auth.login.emailPlaceholder')"
                    icon="email" :required="true" :disabled="loading" :error="formatError(getFieldError('email'))" />

                <BaseInput v-model="form.password" :type="showPassword ? 'text' : 'password'" :label="$t('auth.login.passwordLabel')"
                    :placeholder="$t('auth.login.passwordPlaceholder')" icon="password" :required="true" :disabled="loading"
                    :error="formatError(getFieldError('password'))" :show-password-toggle="true"
                    @toggle-password="togglePasswordVisibility" />

                <div class="flex items-center justify-end">
                    <a href="#" class="text-sm text-green-600 hover:text-green-700 font-medium">
                        {{ $t('auth.login.forgotPassword') }}
                    </a>
                </div>

                <BaseButton type="submit" :disabled="loading" :loading="loading" full-width>
                    <span v-if="!loading">{{ $t('auth.login.cta') }}</span>
                    <span v-else>{{ $t('auth.login.loading') }}</span>
                </BaseButton>
            </form>
        </BaseCard>
    </AuthBackground>
</template>
