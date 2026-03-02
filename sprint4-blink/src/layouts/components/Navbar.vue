<script setup lang="ts">
import { BaseButton } from '@/components/base';
import { computed } from 'vue';
import { useUser } from '@/modules/auth/composables/useUser';
import { useI18n } from 'vue-i18n';
import LanguageSelector from '@/components/LanguageSelector.vue';

interface Props {
    title?: string;
    showMenuButton?: boolean;
    showLogoutButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    showMenuButton: true,
    showLogoutButton: true,
});

const emit = defineEmits<{
    toggleMenu: [];
    logout: [];
}>();

const { user, avatarUrl, clearAvatar } = useUser();
const { t } = useI18n();

const handleMenuClick = () => {
    emit('toggleMenu');
};

const handleLogoutClick = () => {
    clearAvatar();
    emit('logout');
};

// Iniciales del nombre del usuario
const userInitials = computed(() => {
    if (!user.value?.name) return '';
    return user.value.name
        .split(' ')
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('');
});


</script>

<template>
    <nav class="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 px-4 py-3 sm:px-6">
        <div class="flex items-center justify-between">
            <!-- Menu button & Title -->
            <div class="flex items-center gap-4">
                <button v-if="showMenuButton" @click="handleMenuClick"
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    :aria-label="t('nav.menu')">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <h1 class="text-xl font-medium text-gray-900">
                    {{ title }}
                </h1>
            </div>

            <!-- User name and Logout button -->
            <div class="flex items-center gap-6">
                <div v-if="user?.name" class="flex items-center gap-3 pr-4 border-r border-gray-200">
                    <!-- Avatar con gradiente o imagen -->
                    <div v-if="avatarUrl" class="w-10 h-10 rounded-full overflow-hidden shadow-md flex-shrink-0">
                        <img :src="avatarUrl" :alt="t('common.avatar')" class="w-full h-full object-cover" />
                    </div>
                    <div v-else class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <span class="text-sm font-bold text-white">{{ userInitials }}</span>
                    </div>
                    <!-- User name -->
                    <div class="flex flex-col">
                        <span class="text-base font-bold text-gray-900">
                            {{ user?.name }}
                        </span>
                    </div>
                </div>

                <LanguageSelector />

                <BaseButton v-if="showLogoutButton" @click="handleLogoutClick" variant="tertiary" size="sm">
                    {{ t('common.logout') }}
                </BaseButton>
            </div>
        </div>
    </nav>
</template>
