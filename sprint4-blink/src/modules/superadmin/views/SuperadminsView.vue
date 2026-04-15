<template>
    <AppLayout :title="$t('superadmin.title')">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <!-- Header -->
            <div class="mb-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-main">{{ $t('superadmin.admins.title') }}</h2>
                        <p class="mt-2 text-sm text-muted">{{ $t('superadmin.admins.description') }}</p>
                    </div>
                    <BaseButton @click="openCreateModal" variant="primary">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {{ $t('superadmin.admins.actions.new') }}
                    </BaseButton>
                </div>
            </div>

            <!-- Taula d'admins -->
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
                <div v-else-if="admins.length === 0" class="text-center py-16 text-muted">
                    <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p>{{ $t('superadmin.admins.empty') }}</p>
                </div>

                <!-- Taula -->
                <table v-else class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-base-dark">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                {{ $t('superadmin.admins.table.name') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                {{ $t('superadmin.admins.table.email') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                {{ $t('superadmin.admins.table.createdAt') }}
                            </th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                                {{ $t('common.actions') }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-surface divide-y divide-gray-200">
                        <tr v-for="admin in admins" :key="admin.id" class="hover:bg-base-dark transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div
                                        class="flex-shrink-0 h-9 w-9 rounded-full bg-[rgb(var(--color-bg-base-dark))] flex items-center justify-center">
                                        <span class="text-indigo-700 font-bold text-sm">{{
                                            admin.name?.charAt(0)?.toUpperCase() ?? 'U' }}</span>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm font-medium text-main">{{ admin.name }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-muted">
                                {{ admin.email }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-muted">
                                {{ formatDate(admin.created_at) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex justify-end gap-2">
                                    <button @click="openEditModal(admin)"
                                        class="text-primary hover:text-indigo-900 transition-colors"
                                        :title="$t('common.edit')">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button @click="openDeleteModal(admin)"
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

            <!-- Modal Form (Create/Edit) -->
            <Teleport to="body">
                <Transition name="modal">
                    <div v-if="showFormModal" class="fixed inset-0 z-50 overflow-y-auto"
                        aria-labelledby="create-admin-modal-title" role="dialog" aria-modal="true">
                        <div
                            class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div class="fixed inset-0 bg-base-dark0 bg-opacity-75 transition-opacity"
                                @click="closeFormModal" />
                            <span class="hidden sm:inline-block sm:align-middle sm:h-screen"
                                aria-hidden="true">&#8203;</span>
                            <div
                                class="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 id="create-admin-modal-title"
                                        class="text-lg leading-6 font-medium text-main mb-4">
                                        {{ editingAdmin ? $t('superadmin.admins.modal.editTitle') : $t('superadmin.admins.modal.createTitle') }}
                                    </h3>
                                    
                                    <form @submit.prevent="handleSubmit" class="space-y-4">
                                        <BaseInput
                                            v-model="formData.name"
                                            :label="$t('superadmin.admins.form.name')"
                                            type="text"
                                            required
                                        />
                                        <BaseInput
                                            v-model="formData.email"
                                            :label="$t('superadmin.admins.form.email')"
                                            type="email"
                                            required
                                        />
                                        
                                        <div class="border-t pt-4 mt-4" v-if="editingAdmin">
                                             <p class="text-sm text-muted mb-2">{{ $t('superadmin.admins.form.changePasswordHint') }}</p>
                                        </div>

                                        <BaseInput
                                            v-model="formData.password"
                                            :label="$t('superadmin.admins.form.password')"
                                            type="password"
                                            :required="!editingAdmin"
                                        />
                                        <BaseInput
                                            v-model="formData.password_confirmation"
                                            :label="$t('superadmin.admins.form.passwordConfirmation')"
                                            type="password"
                                            :required="!editingAdmin"
                                        />

                                        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                            <BaseButton
                                                type="submit"
                                                variant="primary"
                                                class="w-full sm:col-start-2"
                                                :loading="submitting"
                                            >
                                                {{ editingAdmin ? $t('common.save') : $t('common.create') }}
                                            </BaseButton>
                                            <BaseButton
                                                type="button"
                                                variant="secondary"
                                                class="w-full sm:col-start-1 mt-3 sm:mt-0"
                                                @click="closeFormModal"
                                            >
                                                {{ $t('common.cancel') }}
                                            </BaseButton>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </Teleport>

            <!-- Modal Confirmació Eliminació -->
            <BaseModal :show="showDeleteModal" :title="$t('superadmin.admins.modal.deleteTitle')"
                :message="$t('superadmin.admins.modal.deleteMessage', { name: adminToDelete?.name ?? '' })" type="danger"
                :confirm-text="$t('common.delete')" :cancel-text="$t('common.cancel')" :loading="deleting"
                @confirm="handleDelete" @close="closeDeleteModal" />

        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import { BaseButton, BaseInput, BaseModal } from '@/components/base';
import { superadminService } from '../services/superadmin.service';
import type { Superadmin, CreateSuperadminData, UpdateSuperadminData } from '../types/superadmin.types';
import { useToast } from '@/shared/composables/useToast';
import { useTranslateError } from '@/shared/composables/useTranslateError';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

const { t } = useI18n();
const toast = useToast();
const { translateErrorMessage } = useTranslateError();
const { formatDate } = useDateFormatter({ year: 'numeric', month: 'short', day: 'numeric' });

// Estat
const admins = ref<Superadmin[]>([]);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);

// Modals
const showFormModal = ref(false);
const showDeleteModal = ref(false);
const adminToDelete = ref<Superadmin | null>(null);
const editingAdmin = ref<Superadmin | null>(null);

const formData = reactive({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
});

// ─── Càrrega ─────────────────────────────────────────────────────────────────

const loadAdmins = async () => {
    loading.value = true;
    try {
        const response: any = await superadminService.getAdmins();
        admins.value = response.data || response;
    } catch (error: any) {
        toast.error(translateErrorMessage(error?.message, t('superadmin.admins.errors.load')));
    } finally {
        loading.value = false;
    }
};

// ─── Modals ──────────────────────────────────────────────────────────────────

const openCreateModal = () => {
    editingAdmin.value = null;
    formData.name = '';
    formData.email = '';
    formData.password = '';
    formData.password_confirmation = '';
    showFormModal.value = true;
};

const openEditModal = (admin: Superadmin) => {
    editingAdmin.value = admin;
    formData.name = admin.name;
    formData.email = admin.email;
    formData.password = '';
    formData.password_confirmation = '';
    showFormModal.value = true;
};

const closeFormModal = () => {
    showFormModal.value = false;
    editingAdmin.value = null;
};

const openDeleteModal = (admin: Superadmin) => {
    adminToDelete.value = admin;
    showDeleteModal.value = true;
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
    adminToDelete.value = null;
};

// ─── Handlers ────────────────────────────────────────────────────────────────

const handleSubmit = async () => {
    if (formData.password && formData.password !== formData.password_confirmation) {
        toast.error(t('common.passwordMismatch') || 'Les contrasenyes no coincideixen');
        return;
    }

    submitting.value = true;
    try {
        if (editingAdmin.value) {
            const updateData: UpdateSuperadminData = {
                id: editingAdmin.value.id,
                name: formData.name,
                email: formData.email,
            };
            if (formData.password) {
                updateData.password = formData.password;
                updateData.password_confirmation = formData.password_confirmation;
            }

            
            await superadminService.updateAdmin(updateData);
            toast.success(t('superadmin.admins.toast.updated'));
        } else {
            await superadminService.createAdmin(formData as CreateSuperadminData);
            toast.success(t('superadmin.admins.toast.created'));
        }
        closeFormModal();
        await loadAdmins();
    } catch (error: any) {
         // Determine context for error message
        const contextKey = editingAdmin.value 
            ? 'superadmin.admins.errors.update' 
            : 'superadmin.admins.errors.create';
            
        toast.error(translateErrorMessage(error?.message, t(contextKey)));
    } finally {
        submitting.value = false;
    }
};

const handleDelete = async () => {
    if (!adminToDelete.value) return;
    deleting.value = true;
    try {
        await superadminService.deleteAdmin(adminToDelete.value.id);
        toast.success(t('superadmin.admins.toast.deleted'));
        closeDeleteModal();
        await loadAdmins();
    } catch (error: any) {
        toast.error(translateErrorMessage(error?.message, t('superadmin.admins.errors.delete')));
    } finally {
        deleting.value = false;
    }
};

onMounted(() => {
    loadAdmins();
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