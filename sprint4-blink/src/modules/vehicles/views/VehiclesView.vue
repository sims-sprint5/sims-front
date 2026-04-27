<template>
  <AppLayout :title="$t('vehicles.title')">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <p class="mt-2 text-sm text-muted">
              {{ $t('vehicles.description') }}
            </p>
          </div>
          <BaseButton @click="openCreateModal" variant="primary" class="w-full sm:w-auto">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ $t('vehicles.actions.newVehicle') }}
          </BaseButton>
        </div>
      </div>

      <!-- Búsqueda y filtros -->
      <div class="mb-6 bg-surface p-4 rounded-lg shadow">
        <div class="flex flex-col gap-4 sm:flex-row">
          <div class="flex-1">
            <BaseInput
              v-model="searchQuery"
              type="text"
              :placeholder="$t('vehicles.searchPlaceholder')"
              @input="handleSearch"
            />
          </div>
          <BaseButton @click="handleRefresh" variant="secondary" class="w-full sm:w-auto">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {{ $t('filters.clear') }}
          </BaseButton>
        </div>
      </div>

      <!-- Tabla de vehículos -->
      <VehicleTable
        :vehicles="vehicles"
        :loading="loading"
        @view="openViewModal"
        @edit="openEditModal"
        @delete="openDeleteModal"
      />

      <!-- Modal de Crear/Editar Vehículo -->
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="showVehicleModal"
            class="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <!-- Overlay -->
              <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeVehicleModal" />

              <!-- Center modal -->
              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <!-- Modal panel -->
              <div
                class="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
              >
                <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-main mb-4">
                    {{ editingVehicle ? $t('vehicles.actions.editVehicle') : $t('vehicles.actions.createNewVehicle') }}
                  </h3>
                  <VehicleForm
                    :vehicle="editingVehicle"
                    :status-options="statusOptions"
                    :loading="submitting"
                    :errors="formErrors"
                    @submit="handleSubmit"
                    @cancel="closeVehicleModal"
                  />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Modal de Confirmación de Eliminación -->
      <BaseModal
        :show="showDeleteModal"
        :title="$t('vehicles.modal.deleteTitle')"
        :message="$t('vehicles.modal.deleteMessage', { license_plate: vehicleToDelete?.license_plate ?? '' })"
        type="danger"
        :confirm-text="$t('common.delete')"
        :cancel-text="$t('common.cancel')"
        :loading="deleting"
        @confirm="handleDelete"
        @close="closeDeleteModal"
      />

      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="showViewModal"
            class="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeViewModal" />

              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div
                class="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
              >
                <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-main mb-4">
                    {{ $t('vehicles.modal.detailsTitle') }}
                  </h3> 

                  <div v-if="viewingVehicle" class="space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="rounded-lg border border-default p-3">
                      <p class="text-sm font-medium text-muted">{{ $t('vehicles.form.licensePlate') }}</p>
                      <p class="text-base text-main">{{ viewingVehicle.license_plate }}</p>
                    </div>

                    <div class="rounded-lg border border-default p-3">
                      <p class="text-sm font-medium text-muted">{{ $t('vehicles.form.status') }}</p>
                      <p class="text-base text-main">{{ statusLabel(viewingVehicle.status) }}</p>
                    </div>

                    <div class="rounded-lg border border-default p-3">
                      <p class="text-sm font-medium text-muted">{{ $t('vehicles.form.brand') }}</p>
                      <p class="text-base text-main">{{ viewingVehicle.brand }}</p>
                    </div>

                    <div class="rounded-lg border border-default p-3">
                      <p class="text-sm font-medium text-muted">{{ $t('vehicles.form.model') }}</p>
                      <p class="text-base text-main">{{ viewingVehicle.model }}</p>
                    </div>

                    <div class="rounded-lg border border-default p-3">
                      <p class="text-sm font-medium text-muted">{{ $t('vehicles.form.year') }}</p>
                      <p class="text-base text-main">{{ viewingVehicle.year ?? '-' }}</p>
                    </div>

                    <div class="rounded-lg border border-default p-3">
                      <p class="text-sm font-medium text-muted">{{ $t('vehicles.form.color') }}</p>
                      <p class="text-base text-main">{{ viewingVehicle.color }}</p>
                    </div>

                    <div class="rounded-lg border border-default p-3">
                      <p class="text-sm font-medium text-muted">{{ $t('vehicles.form.currentLatitude') }}</p>
                      <p class="text-base text-main">{{ viewingVehicle.current_latitude ?? '-' }}</p>
                    </div>

                    <div class="rounded-lg border border-default p-3">
                      <p class="text-sm font-medium text-muted">{{ $t('vehicles.form.currentLongitude') }}</p>
                      <p class="text-base text-main">{{ viewingVehicle.current_longitude ?? '-' }}</p>
                    </div>
                    </div>
                  </div>

                  <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <BaseButton type="button" variant="secondary" @click="closeViewModal">
                      {{ $t('common.close') }}
                    </BaseButton>
                    <BaseButton type="button" variant="primary" @click="switchToEdit">
                      {{ $t('vehicles.actions.editVehicle') }}
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
import { computed, ref, onMounted } from 'vue';
import { BaseButton, BaseInput, BaseModal } from '@/components/base';
import AppLayout from '@/layouts/AppLayout.vue';
import VehicleTable from '@/modules/vehicles/components/VehicleTable.vue';
import VehicleForm from '@/modules/vehicles/components/VehicleForm.vue';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle, CreateVehicleData, UpdateVehicleData } from '@/modules/vehicles/types/vehicle.types';
import { useToast } from '@/shared/composables/useToast';
import { validateVehicleForm, type ValidationErrors } from '@/modules/vehicles/utils/vehicleValidation';
import { useI18n } from 'vue-i18n';
import { useTranslateError } from '@/shared/composables/useTranslateError';
import { getVehicleStatusLabel, VEHICLE_STATUS_OPTIONS } from '@/modules/vehicles/utils/vehicleStatus';
import { useDebouncedSearch } from '@/shared/composables/useDebouncedSearch';

const toast = useToast();
const { t } = useI18n();
const { translateErrorMessage } = useTranslateError();
const { run: runDebouncedSearch } = useDebouncedSearch(300);

const statusLabel = (status: unknown) => {
  return getVehicleStatusLabel(t, status);
};

// Estado
const vehicles = ref<Vehicle[]>([]);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const searchQuery = ref('');

// Modales
const showVehicleModal = ref(false);
const showDeleteModal = ref(false);
const showViewModal = ref(false);
const editingVehicle = ref<Vehicle | null>(null);
const viewingVehicle = ref<Vehicle | null>(null);
const vehicleToDelete = ref<Vehicle | null>(null);

const statusOptions = computed<string[]>(() => {
  const base = [...VEHICLE_STATUS_OPTIONS];
  const baseLower = new Set(base.map((s) => s.toLowerCase()));

  // Si el backend devolviese algún estado nuevo, lo mostramos también
  // sin romper el formulario.
  const extras = vehicles.value
    .map((v) => String(v.status ?? '').trim())
    .filter((s) => s.length > 0)
    .filter((s) => !baseLower.has(s.toLowerCase()));

  const extraUnique = Array.from(new Set(extras));
  return [...base, ...extraUnique];
});

// Errores del formulario
const formErrors = ref<ValidationErrors>({});

// Cargar vehículos
const loadVehicles = async () => {
  loading.value = true;
  try {
    const response = await vehicleService.getVehicles(1, 500);
    if (response && typeof response === 'object' && 'data' in response) {
      vehicles.value = Array.isArray(response.data) ? response.data : [];
    } else if (Array.isArray(response as any)) {
      vehicles.value = response as any;
    } else {
      vehicles.value = [];
    }
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('vehicles.errors.load')));
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  runDebouncedSearch(async () => {
    if (searchQuery.value.trim()) {
      loading.value = true;
      try {
        const results = await vehicleService.searchVehicles(searchQuery.value);
        vehicles.value = results;
      } catch (error: any) {
        if (error.status === 404) {
          toast.error(t('vehicles.errors.searchEndpointUnavailable'));
          loadVehicles();
        } else {
          toast.error(translateErrorMessage(error?.message, t('vehicles.errors.search')));
        }
      } finally {
        loading.value = false;
      }
    } else {
      loadVehicles();
    }
  });
};

// Refrescar
const handleRefresh = () => {
  searchQuery.value = '';
  loadVehicles();
};

// Abrir modal de crear
const openCreateModal = () => {
  editingVehicle.value = null;
  formErrors.value = {};
  showVehicleModal.value = true;
};

// Abrir modal de editar
const openEditModal = (vehicle: Vehicle) => {
  editingVehicle.value = vehicle;
  formErrors.value = {};
  showVehicleModal.value = true;
};

// Abrir modal de visualización
const openViewModal = (vehicle: Vehicle) => {
  viewingVehicle.value = vehicle;
  showViewModal.value = true;
};

// Cerrar modal de visualización
const closeViewModal = () => {
  showViewModal.value = false;
  viewingVehicle.value = null;
};

const switchToEdit = () => {
  const vehicle = viewingVehicle.value;
  if (!vehicle) return;
  closeViewModal();
  openEditModal(vehicle);
};

// Cerrar modal
const closeVehicleModal = () => {
  showVehicleModal.value = false;
  editingVehicle.value = null;
  formErrors.value = {};
};

// Abrir modal de eliminar
const openDeleteModal = (vehicle: Vehicle) => {
  vehicleToDelete.value = vehicle;
  showDeleteModal.value = true;
};

// Cerrar modal de eliminar
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  vehicleToDelete.value = null;
};

// Manejar envío del formulario con validación
const handleSubmit = async (data: CreateVehicleData | UpdateVehicleData) => {
  submitting.value = true;
  formErrors.value = {};

  const validationErrors = validateVehicleForm(data, !!editingVehicle.value);
  if (Object.keys(validationErrors).length > 0) {
    formErrors.value = validationErrors;
    submitting.value = false;
    return;
  }

  try {
    if (editingVehicle.value) {
      const id = (editingVehicle.value.vehicle_id ?? editingVehicle.value.id) as number | undefined;
      if (!id) throw { message: 'vehicles.errors.invalidId' };
      await vehicleService.updateVehicle(id, data as UpdateVehicleData);
      toast.success(t('vehicles.toast.updated'));
    } else {
      await vehicleService.createVehicle(data as CreateVehicleData);
      toast.success(t('vehicles.toast.created'));
    }

    closeVehicleModal();
    await loadVehicles();
  } catch (error: any) {
    if (error.errors) {
      formErrors.value = Object.keys(error.errors).reduce((acc, key) => {
        (acc as any)[key] = error.errors[key][0];
        return acc;
      }, {} as Record<string, string>) as any;
    }
    toast.error(translateErrorMessage(error?.message, t('vehicles.errors.save')));
  } finally {
    submitting.value = false;
  }
};

// Manejar eliminación
const handleDelete = async () => {
  if (!vehicleToDelete.value) return;

  deleting.value = true;
  try {
    const id = (vehicleToDelete.value.vehicle_id ?? vehicleToDelete.value.id) as number | undefined;
    if (!id) {
      toast.error(t('vehicles.errors.invalidId'));
      deleting.value = false;
      return;
    }
    await vehicleService.deleteVehicle(id);
    toast.success(t('vehicles.toast.deleted'));
    closeDeleteModal();
    await loadVehicles();
  } catch (error: any) {
    const errorMsg =
      error.status === 404
        ? t('vehicles.errors.notFound')
        : (error.message || t('vehicles.errors.delete'));
    toast.error(errorMsg);
    if (error.status === 404) {
      closeDeleteModal();
      await loadVehicles();
    }
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  loadVehicles();
});
</script>
