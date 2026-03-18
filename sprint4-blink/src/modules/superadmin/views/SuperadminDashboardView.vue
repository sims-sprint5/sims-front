<template>
    <AppLayout :title="$t('superadmin.title')">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ $t('nav.dashboard') }}</h2>

            <div class="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
                    <h4 class="text-gray-500 text-sm font-medium uppercase">{{ $t('tenants.title') }}</h4>
                    <p class="text-3xl font-bold text-indigo-600 mt-2">{{ totalTenants }}</p>
                </div>
            </div>

            <!-- Graphic -->
            <div class="bg-white p-6 rounded-lg shadow mb-8">
                <h3 class="text-lg font-medium text-gray-900 mb-6">Empreses creades per mes (Last 6 months)</h3>
                
                <div v-if="loading" class="flex justify-center py-12">
                     <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
                
                <div v-if="!loading && chartData.length > 0" class="h-64 flex items-end justify-between space-x-4 px-4 pb-2 border-b border-gray-200">
                    <div v-for="(item, index) in chartData" :key="index" class="flex flex-col items-center flex-1 h-full justify-end group">
                        <div class="w-full max-w-[4rem] bg-indigo-500 rounded-t transition-all duration-500 hover:bg-indigo-600 relative flex items-end justify-center" 
                             :style="{ height: getBarHeight(item.count) }">
                            <span class="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {{ item.count }}
                            </span>
                        </div>
                        <span class="text-xs text-gray-500 mt-3 font-medium">{{ item.label }}</span>
                    </div>
                </div>
                <div v-else-if="!loading" class="text-center py-12 text-gray-500">
                    No data available for chart.
                </div>
            </div>

        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import { superadminService } from '../services/superadmin.service';
import type { Tenant } from '../types/superadmin.types';
import { useToast } from '@/shared/composables/useToast';
import { useTranslateError } from '@/shared/composables/useTranslateError';

const { t } = useI18n();
const toast = useToast();
const { translateErrorMessage } = useTranslateError();

const tenants = ref<Tenant[]>([]);
const loading = ref(false);

const totalTenants = computed(() => tenants.value.length);

const chartData = computed(() => {
    if (tenants.value.length === 0) return [];

    const stats: Record<string, number> = {};
    const months: string[] = [];
    const now = new Date();

    // Init last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short' }); 
        stats[key] = 0;
        months.push(key);
    }

    tenants.value.forEach(t => {
        const d = new Date(t.created_at);
        // Simply increment the month counter if it exists in our range
        const key = d.toLocaleString('default', { month: 'short' });
        if (stats[key] !== undefined) {
            stats[key]++;
        }
    });

    return months.map(m => ({ label: m, count: stats[m] ?? 0 }));
});

const maxCount = computed(() => {
    if (chartData.value.length === 0) return 1;
    const max = Math.max(...chartData.value.map(d => d.count));
    return max > 0 ? max : 1; 
});

const getBarHeight = (count: number) => {
    const height = (count / maxCount.value) * 100;
    return height > 0 ? `${height}%` : '2px';
};

const loadData = async () => {
    loading.value = true;
    try {
        const response = await superadminService.getTenants();
        tenants.value = response.data;
    } catch (error: any) {
        toast.error(translateErrorMessage(error?.message, t('tenants.errors.load')));
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadData();
});
</script>