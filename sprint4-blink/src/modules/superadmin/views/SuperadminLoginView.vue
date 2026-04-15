<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { superadminAuthService } from '../services/superadmin-auth.service';
import BaseInput from '@/components/base/BaseInput.vue';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseCard from '@/components/base/BaseCard.vue';
import AuthBackground from '@/modules/auth/components/AuthBackground.vue';
import AuthLogo from '@/modules/auth/components/AuthLogo.vue';
import { useToast } from '@/shared/composables/useToast';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const toast = useToast();
const { t } = useI18n();

const form = reactive({ email: '', password: '' });
const loading = ref(false);
const showPassword = ref(false);

const handleLogin = async () => {
    if (!form.email || !form.password) {
        toast.error(t('validation.fixFormErrors'));
        return;
    }

    loading.value = true;
    try {
        const response = await superadminAuthService.login(form);
        toast.success(t('auth.login.welcome', { name: response.user.name ?? 'Superadmin' }));
        router.push('/superadmin/dashboard');
    } catch (err: any) {
        const msg = err?.response?.data?.message ?? err?.message;
        const translated =
            typeof msg === 'string' && (msg.startsWith('errors.') || msg.startsWith('validation.'))
                ? t(msg)
                : msg;
        toast.error(translated || t('auth.login.genericError'));
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <AuthBackground>
        <BaseCard>
            <AuthLogo />

            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold mb-2 color-text-inverse">
                    Superadmin
                </h1>
                <p>{{ $t('superadmin.description') }}</p>
            </div>

            <form @submit.prevent="handleLogin" class="space-y-5">
                <BaseInput v-model="form.email" type="email" :label="$t('auth.login.emailLabel')"
                    :placeholder="$t('auth.login.emailPlaceholder')" icon="email" :required="true"
                    :disabled="loading" />

                <BaseInput v-model="form.password" :type="showPassword ? 'text' : 'password'"
                    :label="$t('auth.login.passwordLabel')" :placeholder="$t('auth.login.passwordPlaceholder')"
                    icon="password" :required="true" :disabled="loading" :show-password-toggle="true"
                    @toggle-password="showPassword = !showPassword" />

                <BaseButton type="submit" :disabled="loading" :loading="loading" full-width>
                    <span v-if="!loading">{{ $t('auth.login.cta') }}</span>
                    <span v-else>{{ $t('auth.login.loading') }}</span>
                </BaseButton>
            </form>
        </BaseCard>
    </AuthBackground>
</template>
