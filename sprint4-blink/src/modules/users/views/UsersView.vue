<template>
  <AppLayout :title="$t('users.title')">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <p class="mt-2 text-sm text-gray-600">
              {{ $t('users.description') }}
            </p>
          </div>
          <BaseButton @click="openCreateModal" variant="primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ $t('users.actions.newUser') }}
          </BaseButton>
        </div>
      </div>

      <!-- Búsqueda y filtros -->
      <div class="mb-6 bg-white p-4 rounded-lg shadow">
        <div class="flex gap-4">
          <div class="flex-1">
            <BaseInput v-model="searchQuery" type="text" :placeholder="$t('users.searchPlaceholder')"
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

      <!-- Alertas: se muestran como toasts -->

      <!-- Tabla de usuarios -->
      <UserTable :users="users" :loading="loading" @view="openViewModal" @edit="openEditModal"
        @delete="openDeleteModal" />

      <!-- Modal de Crear/Editar Usuario -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showUserModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title"
            role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <!-- Overlay -->
              <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeUserModal" />

              <!-- Center modal -->
              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <!-- Modal panel -->
              <div
                class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {{ editingUser ? $t('users.actions.editUser') : $t('users.actions.createNewUser') }}
                  </h3>
                  <UserForm :user="editingUser" :loading="submitting" :errors="formErrors" @submit="handleSubmit"
                    @cancel="closeUserModal" />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Modal de Confirmación de Eliminación -->
      <BaseModal :show="showDeleteModal" :title="$t('users.modal.deleteTitle')"
        :message="$t('users.modal.deleteMessage', { name: userToDelete?.name ?? '' })" type="danger"
        :confirm-text="$t('common.delete')" :cancel-text="$t('common.cancel')" :loading="deleting"
        @confirm="handleDelete" @close="closeDeleteModal" />

      <!-- Modal de Visualización de Usuario -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showViewModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title"
            role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <!-- Overlay -->
              <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeViewModal" />

              <!-- Center modal -->
              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <!-- Modal panel -->
              <div
                class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {{ $t('users.modal.detailsTitle') }}
                  </h3>
                  <div v-if="viewingUser" class="space-y-4">
                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-gray-500">{{ $t('dashboard.user.name') }}</p>
                      <p class="text-base text-gray-900">{{ viewingUser.name }}</p>
                    </div>
                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-gray-500">{{ $t('dashboard.user.email') }}</p>
                      <p class="text-base text-gray-900">{{ viewingUser.email }}</p>
                    </div>
                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-gray-500">{{ $t('dashboard.user.phone') }}</p>
                      <p class="text-base text-gray-900">{{ viewingUser.phone }}</p>
                    </div>
                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-gray-500">{{ $t('dashboard.user.role') }}</p>
                      <span class="inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full"
                        :class="viewingUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'">
                        {{ $t(`roles.${viewingUser.role}`) }}
                      </span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-500">{{ $t('users.table.createdAt') }}</p>
                      <p class="text-base text-gray-900">{{ formatDate(viewingUser.created_at) }}</p>
                    </div>
                  </div>
                  <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <BaseButton type="button" variant="secondary" @click="closeViewModal">
                      {{ $t('common.close') }}
                    </BaseButton>
                    <BaseButton type="button" variant="primary" @click="switchToEdit">
                      {{ $t('users.actions.editUser') }}
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BaseButton, BaseInput } from '@/components/base';
import BaseModal from '@/components/base/BaseModal.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import UserTable from '@/modules/users/components/UserTable.vue';
import UserForm from '@/modules/users/components/UserForm.vue';
import { userService } from '@/modules/users/services/user.service';
import type { User, CreateUserData, UpdateUserData } from '@/modules/users/types/user.types';
import { useToast } from '@/shared/composables/useToast';
import { validateUserForm, type ValidationErrors } from '@/modules/users/utils/userValidation';
import { useI18n } from 'vue-i18n';
import { useTranslateError } from '@/shared/composables/useTranslateError';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

const toast = useToast();
const { t } = useI18n();
const { translateErrorMessage } = useTranslateError();
const { formatDate } = useDateFormatter({ year: 'numeric', month: 'short', day: 'numeric' });

// Estado
const users = ref<User[]>([]);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const searchQuery = ref('');

// Modales
const showUserModal = ref(false);
const showDeleteModal = ref(false);
const showViewModal = ref(false);
const editingUser = ref<User | null>(null);
const viewingUser = ref<User | null>(null);
const userToDelete = ref<User | null>(null);

// Errores del formulario
const formErrors = ref<ValidationErrors>({});

// Cargar usuarios
const loadUsers = async () => {
  loading.value = true;
  try {
    const response = await userService.getUsers(1, 100);
    if (response && typeof response === 'object' && 'data' in response) {
      users.value = Array.isArray(response.data) ? response.data : [];
    } else if (Array.isArray(response)) {
      users.value = response;
    } else {
      users.value = [];
    }
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('users.errors.load')));
  } finally {
    loading.value = false;
  }
};

// Búsqueda
let searchTimeout: ReturnType<typeof setTimeout>;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (searchQuery.value.trim()) {
      loading.value = true;
      try {
        const results = await userService.searchUsers(searchQuery.value);
        users.value = results;
      } catch (error: any) {
        if (error.status === 404) {
          toast.error(t('users.errors.searchEndpointUnavailable'));
          loadUsers();
        } else {
          toast.error(translateErrorMessage(error?.message, t('users.errors.search')));
        }
      } finally {
        loading.value = false;
      }
    } else {
      loadUsers();
    }
  }, 300);
};

// Refrescar usuarios
const handleRefresh = () => {
  searchQuery.value = '';
  loadUsers();
};

// Abrir modal de crear
const openCreateModal = () => {
  editingUser.value = null;
  formErrors.value = {};
  showUserModal.value = true;
};

// Abrir modal de editar
const openEditModal = (user: User) => {
  editingUser.value = user;
  formErrors.value = {};
  showUserModal.value = true;
};

// Abrir modal de visualización
const openViewModal = (user: User) => {
  viewingUser.value = user;
  showViewModal.value = true;
};

// Cerrar modal de visualización
const closeViewModal = () => {
  showViewModal.value = false;
  viewingUser.value = null;
};

// Cambiar a edición desde visualización
const switchToEdit = () => {
  const user = viewingUser.value;
  if (!user) return;
  closeViewModal();
  openEditModal(user);
};

// Cerrar modal de usuario
const closeUserModal = () => {
  showUserModal.value = false;
  editingUser.value = null;
  formErrors.value = {};
};

// Abrir modal de eliminar
const openDeleteModal = (user: User) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

// Cerrar modal de eliminar
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  userToDelete.value = null;
};

// Manejar envío del formulario con validación
const handleSubmit = async (data: CreateUserData | UpdateUserData) => {
  submitting.value = true;
  formErrors.value = {};

  // Validar datos antes de enviar
  const validationErrors = validateUserForm(data, !!editingUser.value);
  if (Object.keys(validationErrors).length > 0) {
    formErrors.value = validationErrors;
    submitting.value = false;
    return;
  }

  try {
    if (editingUser.value) {
      const id = (editingUser.value.user_id ?? editingUser.value.id) as number | undefined;
      if (!id) throw { message: 'users.errors.invalidId' };
      await userService.updateUser(id, data as UpdateUserData);
      toast.success(t('users.toast.updated'));
    } else {
      await userService.createUser(data as CreateUserData);
      toast.success(t('users.toast.created'));
    }

    closeUserModal();
    await loadUsers();
  } catch (error: any) {
    if (error.errors) {
      formErrors.value = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key][0];
        return acc;
      }, {} as Record<string, string>);
    }
    toast.error(translateErrorMessage(error?.message, t('users.errors.save')));
  } finally {
    submitting.value = false;
  }
};

// Manejar eliminación
const handleDelete = async () => {
  if (!userToDelete.value) return;

  deleting.value = true;
  try {
    const id = (userToDelete.value.user_id ?? userToDelete.value.id) as number | undefined;
    if (!id) {
      toast.error(t('users.errors.invalidId'));
      deleting.value = false;
      return;
    }
    await userService.deleteUser(id);
    toast.success(t('users.toast.deleted'));
    closeDeleteModal();
    await loadUsers();
  } catch (error: any) {
    const errorMsg = error.status === 404
      ? t('users.errors.notFound')
      : (error.message || t('users.errors.delete'));
    toast.error(errorMsg);
    if (error.status === 404) {
      closeDeleteModal();
      await loadUsers();
    }
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  loadUsers();
});
</script>
