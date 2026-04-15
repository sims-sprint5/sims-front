<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useUser } from '@/modules/auth/composables/useUser';
import { useI18n } from 'vue-i18n';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';

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

// Vehicle statistics
const totalVehicles = ref(0);
const availableVehicles = ref(0);

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

async function loadVehicleStats() {
    try {
        const vehicles = await vehicleService.getVehiclesList();
        totalVehicles.value = vehicles.length;
        availableVehicles.value = vehicles.filter((v) => {
            const statusKey = (v.status ?? '').trim().toLowerCase();
            return statusKey === 'available' || statusKey === 'active';
        }).length;
    } catch (err) {
        console.error('Error loading vehicle stats:', err);
    }
}

onMounted(() => {
    loadVehicleStats();
});

</script>

<template>
    <nav class="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 px-3 py-3 sm:px-6">
        <div class="flex items-center justify-between gap-3">
            <!-- Menu button & Title -->
            <div class="flex min-w-0 items-center gap-2 sm:gap-4">
                <button v-if="showMenuButton" @click="handleMenuClick"
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    :aria-label="t('nav.menu')">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <h1 class="truncate text-base font-medium text-gray-900 sm:text-xl">
                    {{ title }}
                </h1>
            </div>

            <!-- User name -->
            <div v-if="user?.name" class="hidden md:flex items-center gap-6">
                <!-- Vehicle Statistics -->
                <div class="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="text-center">
                        <div class="text-xs font-medium text-gray-600">{{ $t('admin.stats.totalVehicles') }}</div>
                        <div class="text-sm font-bold text-gray-900">{{ totalVehicles }}</div>
                    </div>
                    <div class="w-px h-8 bg-gray-300"></div>
                    <div class="text-center">
                        <div class="text-xs font-medium text-gray-600">{{ $t('admin.stats.availableVehicles') }}</div>
                        <div class="text-sm font-bold text-green-600">{{ availableVehicles }}</div>
                    </div>
                </div>

                <!-- User Info -->
                <div class="flex items-center gap-3">
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
            </div>
        </div>
    </nav>
</template>
