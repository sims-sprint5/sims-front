<template>
    <AppLayout :title="$t('tenants.title')">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <!-- Header -->
            <div class="mb-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-main">{{ $t('tenants.title') }}</h2>
                        <p class="mt-2 text-sm text-muted">{{ $t('tenants.description') }}</p>
                    </div>
                    <BaseButton @click="openCreateModal" variant="primary">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {{ $t('tenants.actions.new') }}
                    </BaseButton>
                </div>
            </div>

            <!-- Taula de Tenants -->
            <div class="bg-surface shadow rounded-lg overflow-hidden">
                <!-- Loading -->
                <div v-if="loading" class="flex items-center justify-center py-16">
                    <svg class="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span class="ml-3 text-muted">{{ $t('common.loading') }}</span>
                </div>

                <!-- Empty -->
                <div v-else-if="tenants.length === 0" class="text-center py-16 text-muted">
                    <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p>{{ $t('tenants.empty') }}</p>
                </div>

                <!-- Taula -->
                <table v-else class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-surface">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                {{ $t('tenants.table.name') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                {{ $t('tenants.table.domain') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                {{ $t('tenants.table.createdAt') }}
                            </th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                                {{ $t('common.actions') }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-surface divide-y divide-gray-200">
                        <tr v-for="tenant in tenants" :key="tenant.id" class="hover:bg-base-dark transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div
                                        class="flex-shrink-0 h-9 w-9 rounded-full bg-[rgb(var(--color-bg-base-dark))] flex items-center justify-center">
                                        <span class="text-indigo-700 font-bold text-sm">{{
                                            tenant.name.charAt(0).toUpperCase() }}</span>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm font-medium text-main">{{ tenant.name }}</p>
                                        <p class="text-xs text-muted">{{ tenant.admin_email }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-muted">
                                {{ tenant.domain }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-muted">
                                {{ formatDate(tenant.created_at) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end gap-2">
                                    <BaseTooltip :text="$t('common.edit')">
                                        <button @click="openEditModal(tenant)"
                                            class="text-indigo-600 hover:text-indigo-900 transition-colors">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    </BaseTooltip>
                                    <BaseTooltip :text="$t('common.delete')">
                                        <button @click="openDeleteModal(tenant)"
                                            class="text-red-600 hover:text-red-900 transition-colors">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </BaseTooltip>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Create/Edit Modal -->
            <Teleport to="body">
                <Transition name="modal">
                    <div v-if="showFormModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeFormModal" aria-hidden="true"></div>
                            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div class="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                     <h3 id="modal-title" class="text-lg leading-6 font-medium text-main mb-4">
                                        {{ editingTenant ? $t('tenants.modal.editTitle') : $t('tenants.modal.createTitle') }}
                                    </h3>
                                    <TenantForm
                                        :tenant="editingTenant"
                                        :loading="submitting"
                                        @submit="handleFormSubmit"
                                        @cancel="closeFormModal"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </Teleport>

            <!-- Delete Confirmation Modal -->
            <BaseModal
                :show="showDeleteModal"
                :title="$t('tenants.modal.deleteTitle')"
                :message="$t('tenants.modal.deleteMessage', { name: tenantToDelete?.name ?? '' })"
                type="danger"
                :confirm-text="$t('common.delete')"
                :cancel-text="$t('common.cancel')"
                :loading="deleting"
                @confirm="handleDelete"
                @close="closeDeleteModal"
            />
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import { BaseButton, BaseModal, BaseTooltip } from '@/components/base';
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

// State
const tenants = ref<Tenant[]>([]);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);

const showFormModal = ref(false);
const showDeleteModal = ref(false);
const editingTenant = ref<Tenant | null>(null);
const tenantToDelete = ref<Tenant | null>(null);

// Methods
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

const openCreateModal = () => {
    editingTenant.value = null;
    showFormModal.value = true;
};

const openEditModal = (tenant: Tenant) => {
    editingTenant.value = tenant;
    showFormModal.value = true;
};

const closeFormModal = () => {
    showFormModal.value = false;
    editingTenant.value = null;
};

const handleFormSubmit = async (data: CreateTenantData | UpdateTenantData) => {
    submitting.value = true;
    try {
        if (editingTenant.value) {
            await superadminService.updateTenant(data as UpdateTenantData);
            toast.success(t('tenants.toast.updated'));
        } else {
            await superadminService.createTenant(data as CreateTenantData);
            toast.success(t('tenants.toast.created'));
        }
        closeFormModal();
        await loadTenants();
    } catch (error: any) {
        const contextKey = editingTenant.value 
            ? 'tenants.errors.update' 
            : 'tenants.errors.create';
        toast.error(translateErrorMessage(error?.message, t(contextKey)));
    } finally {
        submitting.value = false;
    }
};

const openDeleteModal = (tenant: Tenant) => {
    tenantToDelete.value = tenant;
    showDeleteModal.value = true;
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
    tenantToDelete.value = null;
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