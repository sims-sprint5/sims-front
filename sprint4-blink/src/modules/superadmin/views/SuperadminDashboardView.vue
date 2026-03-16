<template>
    <AppLayout :title="$t('superadmin.title')">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <!-- Header -->
            <div class="mb-8">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="mt-2 text-sm text-gray-600">{{ $t('tenants.description') }}</p>
                    </div>
                    <BaseButton @click="openCreateModal" variant="primary">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {{ $t('tenants.actions.new') }}
                    </BaseButton>
                </div>
            </div>

            <!-- Cerca -->
            <div class="mb-6 bg-white p-4 rounded-lg shadow">
                <div class="flex gap-4">
                    <div class="flex-1">
                        <BaseInput v-model="searchQuery" type="text" :placeholder="$t('tenants.searchPlaceholder')"
                            @input="handleSearch" />
                    </div>
                    <BaseButton @click="handleRefresh" variant="secondary">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {{ $t('filters.clear') }}
                    </BaseButton>
                </div>
            </div>

            <!-- Taula de tenants -->
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <!-- Loading -->
                <div v-if="loading" class="flex items-center justify-center py-16">
                    <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span class="ml-3 text-gray-600">{{ $t('tenants.loading') }}</span>
                </div>

                <!-- Empty -->
                <div v-else-if="filteredTenants.length === 0" class="text-center py-16 text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p>{{ $t('tenants.empty') }}</p>
                </div>

                <!-- Taula -->
                <table v-else class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ $t('tenants.table.name') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ $t('tenants.table.domain') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ $t('tenants.table.admin_email') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ $t('tenants.table.status') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ $t('tenants.table.createdAt') }}
                            </th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ $t('tenants.table.actions') }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="tenant in filteredTenants" :key="tenant.id"
                            class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div
                                        class="flex-shrink-0 h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span class="text-indigo-700 font-bold text-sm">{{
                                            tenant.name.charAt(0).toUpperCase() }}</span>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm font-medium text-gray-900">{{ tenant.name }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {{ tenant.domain }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {{ tenant.admin_email ?? '—' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full" :class="tenant.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'">
                                    {{ tenant.status === 'active' ? $t('tenants.status.active') :
                                    $t('tenants.status.inactive') }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ formatDate(tenant.created_at) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end gap-2">
                                    <button @click="openEditModal(tenant)"
                                        class="text-indigo-600 hover:text-indigo-900 transition-colors"
                                        :title="$t('common.edit')">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button @click="openDeleteModal(tenant)"
                                        class="text-red-600 hover:text-red-900 transition-colors"
                                        :title="$t('common.delete')">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Modal Crear / Editar -->
            <Teleport to="body">
                <Transition name="modal">
                    <div v-if="showTenantModal" class="fixed inset-0 z-50 overflow-y-auto"
                        aria-labelledby="tenant-modal-title" role="dialog" aria-modal="true">
                        <div
                            class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                @click="closeTenantModal" />
                            <span class="hidden sm:inline-block sm:align-middle sm:h-screen"
                                aria-hidden="true">&#8203;</span>
                            <div
                                class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 id="tenant-modal-title"
                                        class="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        {{ editingTenant ? $t('tenants.modal.editTitle') :
                                        $t('tenants.modal.createTitle') }}
                                    </h3>
                                    <TenantForm :tenant="editingTenant" :loading="submitting" @submit="handleSubmit"
                                        @cancel="closeTenantModal" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </Teleport>

            <!-- Modal Confirmació Eliminació -->
            <BaseModal :show="showDeleteModal" :title="$t('tenants.modal.deleteTitle')"
                :message="$t('tenants.modal.deleteMessage', { name: tenantToDelete?.name ?? '' })" type="danger"
                :confirm-text="$t('common.delete')" :cancel-text="$t('common.cancel')" :loading="deleting"
                @confirm="handleDelete" @close="closeDeleteModal" />

        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import { BaseButton, BaseInput, BaseModal } from '@/components/base';
import TenantForm from '../components/TenantForm.vue';
import { superadminService } from '../services/superadmin.service';
import type { Tenant, CreateTenantData, UpdateTenantData } from '../types/superadmin.types';
import { useToast } from '@/shared/composables/useToast';
import { useTranslateError } from '@/shared/composables/useTranslateError';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

const { t } = useI18n();
const toast = useToast();
const { translateErrorMessage } = useTranslateError();
const { formatDate } = useDateFormatter({ year: 'numeric', month: 'short', day: 'numeric' });

// Estat
const tenants = ref<Tenant[]>([]);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const searchQuery = ref('');

// Modals
const showTenantModal = ref(false);
const showDeleteModal = ref(false);
const editingTenant = ref<Tenant | null>(null);
const tenantToDelete = ref<Tenant | null>(null);

// Tenants filtrats per la cerca local
const filteredTenants = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return tenants.value;
    return tenants.value.filter(
        (t) =>
            t.name.toLowerCase().includes(q) ||
            t.domain.toLowerCase().includes(q) ||
            (t.admin_email ?? '').toLowerCase().includes(q)
    );
});

// ─── Càrrega ─────────────────────────────────────────────────────────────────

const loadTenants = async () => {
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

// ─── Cerca ───────────────────────────────────────────────────────────────────

let searchTimeout: ReturnType<typeof setTimeout>;
const handleSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // La cerca és local (filteredTenants computed). Si vols cerca remota, crida l'API aquí.
    }, 300);
};

const handleRefresh = () => {
    searchQuery.value = '';
    loadTenants();
};

// ─── Modals Crear / Editar ────────────────────────────────────────────────────

const openCreateModal = () => {
    editingTenant.value = null;
    showTenantModal.value = true;
};

const openEditModal = (tenant: Tenant) => {
    editingTenant.value = tenant;
    showTenantModal.value = true;
};

const closeTenantModal = () => {
    showTenantModal.value = false;
    editingTenant.value = null;
};

// ─── Modal Eliminar ───────────────────────────────────────────────────────────

const openDeleteModal = (tenant: Tenant) => {
    tenantToDelete.value = tenant;
    showDeleteModal.value = true;
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
    tenantToDelete.value = null;
};

// ─── Handlers ────────────────────────────────────────────────────────────────

const handleSubmit = async (data: CreateTenantData | UpdateTenantData) => {
    submitting.value = true;
    try {
        if (editingTenant.value) {
            await superadminService.updateTenant(data as UpdateTenantData);
            toast.success(t('tenants.toast.updated'));
        } else {
            await superadminService.createTenant(data as CreateTenantData);
            toast.success(t('tenants.toast.created'));
        }
        closeTenantModal();
        await loadTenants();
    } catch (error: any) {
        toast.error(translateErrorMessage(error?.message, t('tenants.errors.save')));
    } finally {
        submitting.value = false;
    }
};

const handleDelete = async () => {
    if (!tenantToDelete.value) return;
    deleting.value = true;
    try {
        await superadminService.deleteTenant(tenantToDelete.value.id);
        toast.success(t('tenants.toast.deleted'));
        closeDeleteModal();
        await loadTenants();
    } catch (error: any) {
        toast.error(translateErrorMessage(error?.message, t('tenants.errors.delete')));
    } finally {
        deleting.value = false;
    }
};

onMounted(() => {
    loadTenants();
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
</style>
