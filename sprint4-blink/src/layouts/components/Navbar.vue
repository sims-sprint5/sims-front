<script setup lang="ts">
import { computed } from 'vue';
import { useUser } from '@/modules/auth/composables/useUser';
import { useI18n } from 'vue-i18n';

interface Props {
    title?: string;
    showMenuButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    showMenuButton: true,
});

const emit = defineEmits<{
    toggleMenu: [];
}>();

const { user, avatarUrl } = useUser();
const { t } = useI18n();

const handleMenuClick = () => {
    emit('toggleMenu');
};

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
    <nav class="sticky top-0 z-10 bg-navbar-bg shadow-sm border-b border-nav px-3 py-3 sm:px-6">
        <div class="flex items-center justify-between gap-3">
            <!-- Menu button & Title -->
            <div class="flex min-w-0 items-center gap-2 sm:gap-4">
                <button v-if="showMenuButton" @click="handleMenuClick"
                    class="p-2 text-muted hover:text-main hover:bg-surface-muted rounded-md transition-colors"
                    :aria-label="t('nav.menu')">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <h1 class="truncate text-base font-medium text-main sm:text-xl">
                    {{ title }}
                </h1>
            </div>

            <!-- User name -->
            <div v-if="user?.name" class="hidden md:flex items-center gap-3">
                <!-- Avatar con gradiente o imagen -->
                <div v-if="avatarUrl" class="w-10 h-10 rounded-full overflow-hidden shadow-md flex-shrink-0">
                    <img :src="avatarUrl" :alt="t('common.avatar')" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-surface-inverse flex items-center justify-center shadow-md flex-shrink-0">
                    <span class="text-sm font-bold text-inverse">{{ userInitials }}</span>
                </div>
                <!-- User name -->
                <div class="flex flex-col">
                    <span class="text-base font-bold text-main">
                        {{ user?.name }}
                    </span>
                </div>
            </div>
        </div>
    </nav>
</template>
