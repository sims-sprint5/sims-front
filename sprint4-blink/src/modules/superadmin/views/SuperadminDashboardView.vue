<template>
    <AppLayout :title="$t('superadmin.title')">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 class="text-2xl font-bold text-main mb-6">{{ $t('nav.dashboard') }}</h2>
            
            <!-- Key Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <!-- Total Companies -->
                <div class="bg-surface p-6 rounded-lg shadow border-l-4 border-primary hover:shadow-md transition">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-[rgb(var(--color-bg-base-dark))] text-primary mr-4">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-muted text-sm font-medium uppercase">{{ $t('tenants.title') }} Total</h4>
                            <p class="text-3xl font-bold text-primary mt-1">{{ totalTenants }}</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Companies (Aquest mes) -->
                <div class="bg-surface p-6 rounded-lg shadow border-l-4 border-success hover:shadow-md transition">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-muted text-sm font-medium uppercase">{{ $t('superadmin.dashboard.newThisMonth') }}</h4>
                            <p class="text-3xl font-bold text-emerald-600 mt-1">{{ newTenantsThisMonth }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Graphic: Line Chart -->
                <div class="bg-surface p-6 rounded-lg shadow lg:col-span-2 flex flex-col">
                    <h3 class="text-lg font-medium text-main mb-6 font-semibold">{{ $t('superadmin.dashboard.companySignups') }}</h3>
                    
                    <div v-if="loading" class="flex-grow flex items-center justify-center py-12">
                         <svg class="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>

                    <!-- Line Chart SVG & HTML -->
                    <div v-else-if="!loading && chartData.length > 0" class="relative w-full h-64 mt-4">
                        <!-- Grid Lines Y -->
                        <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            <div class="border-t border-default border-dashed w-full h-0 relative"><span class="absolute -top-3 -left-6 text-xs text-muted">{{ maxCount + 1 }}</span></div>
                            <div class="border-t border-default border-dashed w-full h-0 relative"><span class="absolute -top-3 -left-6 text-xs text-muted">{{ Math.round((maxCount + 1) * 0.75) }}</span></div>
                            <div class="border-t border-default border-dashed w-full h-0 relative"><span class="absolute -top-3 -left-6 text-xs text-muted">{{ Math.round((maxCount + 1) * 0.5) }}</span></div>
                            <div class="border-t border-default border-dashed w-full h-0 relative"><span class="absolute -top-3 -left-6 text-xs text-muted">{{ Math.round((maxCount + 1) * 0.25) }}</span></div>
                            <div class="border-t border-default border-solid w-full h-0 relative"><span class="absolute -top-3 -left-4 text-xs text-muted">0</span></div>
                        </div>

                        <!-- Vector Line -->
                        <svg class="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <!-- Fill Area under the line (Gradient) -->
                            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.2" />
                                <stop offset="100%" stop-color="#4f46e5" stop-opacity="0" />
                            </linearGradient>
                            <polygon 
                                :points="`0,100 ${svgPoints} 100,100`" 
                                fill="url(#chartGradient)"
                            />
                            
                            <!-- Stroke Line -->
                            <polyline 
                                :points="svgPoints" 
                                fill="none" 
                                stroke="#4f46e5" 
                                stroke-width="2" 
                                vector-effect="non-scaling-stroke"
                                stroke-linecap="round" 
                                stroke-linejoin="round"
                                class="transition-all duration-1000 ease-out"
                            />
                        </svg>

                        <!-- Interactive Dots -->
                        <div v-for="(point, idx) in pointCoordinates" :key="idx" 
                             class="absolute w-3 h-3 bg-indigo-600 border-2 border-white rounded-full shadow transform -translate-x-1/2 -translate-y-1/2 group hover:scale-125 cursor-pointer transition-transform duration-200"
                             :style="{ left: point.x + '%', top: point.y + '%' }">
                            
                            <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-inverse text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {{ $t('superadmin.dashboard.companies', { count: chartData[idx]?.count ?? 0 }) }}
                            </div>
                        </div>

                        <!-- Labels X -->
                        <div class="absolute w-full top-full mt-4 h-6 flex justify-between text-xs text-muted font-medium">
                            <div v-for="(item, idx) in chartData" :key="idx" 
                                class="absolute transform -translate-x-1/2 whitespace-nowrap capitalize"
                                :style="{ left: (idx * (100 / (chartData.length - 1))) + '%' }">
                                {{ item.label }}
                            </div>
                        </div>
                    </div>
                    
                    <div v-else-if="!loading" class="flex-grow flex items-center justify-center text-muted bg-base-dark rounded-lg mt-4">
                        {{ $t('superadmin.dashboard.noData') }}
                    </div>
                </div>

                <!-- Latest Companies List -->
                <div class="bg-surface p-6 rounded-lg shadow lg:col-span-1">
                    <h3 class="text-lg font-medium text-main mb-6 font-semibold border-b pb-2">{{ $t('superadmin.dashboard.recentCompanies') }}</h3>
                    
                    <div v-if="loading" class="flex justify-center py-6">
                         <svg class="animate-spin h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                    
                    <ul class="divide-y divide-gray-100" v-else-if="recentCompanies.length > 0">
                        <li v-for="company in recentCompanies" :key="company.id" class="py-3 flex hover:bg-base-dark -mx-4 px-4 rounded transition">
                            <div class="flex items-center w-full justify-between">
                                <div class="flex items-center">
                                    <div class="bg-indigo-50 p-2 rounded-lg text-primary mr-3 shadow-sm">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-sm font-semibold text-main">{{ company.name }}</span>
                                        <span class="text-xs text-muted">{{ formatDate(company.created_at) }}</span>
                                    </div>
                                </div>
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">{{ $t('superadmin.dashboard.new') }}</span>
                            </div>
                        </li>
                    </ul>
                    
                    <div v-else-if="!loading" class="text-sm text-muted italic text-center py-8">
                        {{ $t('superadmin.dashboard.noCompaniesToShow') }}
                    </div>
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

const { t, locale } = useI18n();
const toast = useToast();
const { translateErrorMessage } = useTranslateError();

const tenants = ref<Tenant[]>([]);
const loading = ref(false);

const totalTenants = computed(() => tenants.value.length);

const newTenantsThisMonth = computed(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return tenants.value.filter(t => new Date(t.created_at) >= startOfMonth).length;
});

const recentCompanies = computed(() => {
    return [...tenants.value]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5); // Pick the newest 5
});

const chartData = computed(() => {
    const stats: Record<string, number> = {};
    const months: string[] = [];
    const now = new Date();
    
    // We want short names in current locale. Ensure we have the short months
    const getMonthName = (date: Date) => {
        return date.toLocaleString(locale.value === 'ca' ? 'ca-ES' : (locale.value === 'es' ? 'es-ES' : 'en-US'), { month: 'short' });
    };

    // Initialize the last 6 months (chronological order)
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mKey = getMonthName(d) + " '" + d.getFullYear().toString().slice(-2);
        stats[mKey] = 0;
        months.push(mKey);
    }

    if (tenants.value.length > 0) {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        
        tenants.value.forEach(t => {
            const d = new Date(t.created_at);
            if (d >= sixMonthsAgo) {
                const mKey = getMonthName(d) + " '" + d.getFullYear().toString().slice(-2);
                if (stats[mKey] !== undefined) {
                    stats[mKey]++;
                }
            }
        });
    }

    return months.map(m => ({ label: m, count: stats[m] ?? 0 }));
});

const maxCount = computed(() => {
    if (chartData.value.length === 0) return 0;
    const max = Math.max(...chartData.value.map(d => d.count));
    return max; 
});

const pointCoordinates = computed(() => {
    if (chartData.value.length === 0) return [];
    
    const count = chartData.value.length;
    // adding a ceiling factor (+1) so the max value doesn't touch the very top edge.
    const maxAllowed = maxCount.value + 1; 
    
    return chartData.value.map((d, idx) => {
        const x = (idx / (count - 1)) * 100;
        const y = 100 - ((d.count / maxAllowed) * 100);
        return { x, y };
    });
});

const svgPoints = computed(() => {
    return pointCoordinates.value.map(p => `${p.x},${p.y}`).join(' ');
});

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale.value === 'ca' ? 'ca-ES' : (locale.value === 'es' ? 'es-ES' : 'en-US'), {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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
