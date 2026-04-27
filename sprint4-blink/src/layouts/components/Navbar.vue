<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useUser } from '@/modules/auth/composables/useUser';
import { useI18n } from 'vue-i18n';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import { BaseTooltip } from '@/components/base';

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
const maintenanceVehicles = ref(0);
const inactiveVehicles = ref(0);
const isAdminUser = ref(false);

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
        const isAdmin = user.value?.role === 'admin' || user.value?.role === 'superadmin';
        isAdminUser.value = isAdmin;

        if (isAdmin) {
            // Admin: obtener TODOS los vehículos
            const allVehicles = await vehicleService.getVehiclesList();
            totalVehicles.value = allVehicles.length;
            
            // Disponibles: solo available o active
            availableVehicles.value = allVehicles.filter((v) => {
                const statusKey = (v.status ?? '').trim().toLowerCase();
                return statusKey === 'available' || statusKey === 'active';
            }).length;

            // En mantenimiento: solo maintenance
            maintenanceVehicles.value = allVehicles.filter((v) => {
                const statusKey = (v.status ?? '').trim().toLowerCase();
                return statusKey === 'maintenance';
            }).length;

            // Inactivos: solo inactive
            inactiveVehicles.value = allVehicles.filter((v) => {
                const statusKey = (v.status ?? '').trim().toLowerCase();
                return statusKey === 'inactive';
            }).length;
        } else {
            // Usuario normal: solo ver vehículos disponibles + reservados
            const response = await vehicleService.getVehiclesCalendar(1, 200);
            const vehicles = Array.isArray(response?.data) ? response.data : [];
            
            // Total: solo available y reserved (excluye maintenance, inactive, out_of_service, rented)
            const validStatuses = vehicles.filter((v) => {
                const statusKey = (v.status ?? '').trim().toLowerCase();
                return statusKey === 'available' || statusKey === 'reserved' || statusKey === 'active';
            });
            totalVehicles.value = validStatuses.length;
            
            // Disponibles: solo available o active
            availableVehicles.value = validStatuses.filter((v) => {
                const statusKey = (v.status ?? '').trim().toLowerCase();
                return statusKey === 'available' || statusKey === 'active';
            }).length;
            
            maintenanceVehicles.value = 0;
            inactiveVehicles.value = 0;
        }
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
        <div class="flex items-center justify-between gap-2 sm:gap-3">
            <!-- Menu button & Title -->
            <div class="flex min-w-0 items-center gap-2 sm:gap-4">
                <BaseTooltip :text="t('nav.menu')" :disabled="!showMenuButton">
                    <button v-if="showMenuButton" @click="handleMenuClick"
                        class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        :aria-label="t('nav.menu')">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </BaseTooltip>

                <h1 class="truncate text-base font-medium text-gray-900 sm:text-xl">
                    {{ title }}
                </h1>
            </div>

            <!-- User info & Statistics -->
            <div v-if="user?.name" class="flex items-center gap-2 sm:gap-6">
                <!-- Vehicle Statistics -->
                <div class="flex items-center gap-1 sm:gap-4 px-2 sm:px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <!-- Total Vehicles -->
                    <div class="flex items-center gap-1 sm:flex-col sm:text-center">
                        <div class="text-xs font-medium text-gray-600">Vehículos:</div>
                        <div class="text-xs sm:text-sm font-bold text-gray-900">{{ totalVehicles }}</div>
                    </div>
                    <div class="w-px h-6 sm:h-8 bg-gray-300"></div>
                    
                    <!-- Available Vehicles -->
                    <div class="flex items-center gap-1 sm:flex-col sm:text-center">
                        <div class="text-xs font-medium text-gray-600">Disponibles:</div>
                        <div class="text-xs sm:text-sm font-bold text-green-600">{{ availableVehicles }}</div>
                    </div>

                    <!-- Maintenance Vehicles (admin only) -->
                    <template v-if="isAdminUser">
                        <div class="w-px h-6 sm:h-8 bg-gray-300"></div>
                        <div class="flex items-center gap-1 sm:flex-col sm:text-center">
                            <div class="text-xs font-medium text-gray-600">Mantenimiento:</div>
                            <div class="text-xs sm:text-sm font-bold text-yellow-600">{{ maintenanceVehicles }}</div>
                        </div>
                        
                        <!-- Inactive Vehicles (admin only) -->
                        <div class="w-px h-6 sm:h-8 bg-gray-300"></div>
                        <div class="flex items-center gap-1 sm:flex-col sm:text-center">
                            <div class="text-xs font-medium text-gray-600">Inactivos:</div>
                            <div class="text-xs sm:text-sm font-bold text-red-600">{{ inactiveVehicles }}</div>
                        </div>
                    </template>
                </div>

                <!-- User Info -->
                <div class="hidden sm:flex items-center gap-3">
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
