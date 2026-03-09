<template>
  <AppLayout :title="$t('reservations.title')">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <p class="mt-2 text-sm text-gray-600">
              {{ $t('reservations.description') }}
            </p>
          </div>
          <BaseButton @click="openCreateModal" variant="primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ $t('reservations.actions.newReservation') }}
          </BaseButton>
        </div>
      </div>

      <!-- Búsqueda y filtros -->
      <div class="mb-6 bg-white p-4 rounded-lg shadow">
        <div class="flex gap-4">
          <div class="flex-1">
            <BaseInput
              v-model="searchQuery"
              type="text"
              :placeholder="$t('reservations.searchPlaceholder')"
              @input="handleSearch"
            />
          </div>
          <BaseButton @click="handleRefresh" variant="secondary">
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

      <!-- Tabla de reservas -->
      <ReservationTable
        :reservations="reservations"
        :loading="loading"
        @view="openViewModal"
        @edit="openEditModal"
        @delete="openDeleteModal"
      />

      <!-- Modal de Crear/Editar Reserva -->
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="showReservationModal"
            class="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <!-- Overlay -->
              <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeReservationModal" />

              <!-- Center modal -->
              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <!-- Modal panel -->
              <div
                class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
              >
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {{ editingReservation ? $t('reservations.actions.editReservation') : $t('reservations.actions.createNewReservation') }}
                  </h3>
                  <ReservationForm
                    :reservation="editingReservation"
                    :loading="submitting"
                    :errors="formErrors"
                    @submit="handleSubmit"
                    @cancel="closeReservationModal"
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
        :title="$t('reservations.modal.deleteTitle')"
        :message="$t('reservations.modal.deleteMessage', { id: reservationToDelete?.id ?? '' })"
        type="danger"
        :confirm-text="$t('common.delete')"
        :cancel-text="$t('common.cancel')"
        :loading="deleting"
        @confirm="handleDelete"
        @close="closeDeleteModal"
      />

      <!-- Modal de Visualización -->
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
              <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeViewModal" />

              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div
                class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
              >
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {{ $t('reservations.modal.detailsTitle') }}
                  </h3>

                  <div v-if="viewingReservation" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="rounded-lg border border-gray-200 p-3">
                      <p class="text-sm font-medium text-gray-500">{{ $t('reservations.table.id') }}</p>
                      <p class="text-base text-gray-900">{{ viewingReservation.id }}</p>
                    </div>

                    <div class="rounded-lg border border-gray-200 p-3">
                      <p class="text-sm font-medium text-gray-500">{{ $t('reservations.table.status') }}</p>
                      <p class="text-base text-gray-900">{{ viewingReservation.status || '-' }}</p>
                    </div>

                    <div class="rounded-lg border border-gray-200 p-3">
                      <p class="text-sm font-medium text-gray-500">{{ $t('reservations.table.userId') }}</p>
                      <p class="text-base text-gray-900">{{ viewingReservation.user_id ?? '-' }}</p>
                    </div>

                    <div class="rounded-lg border border-gray-200 p-3">
                      <p class="text-sm font-medium text-gray-500">{{ $t('reservations.table.vehicleId') }}</p>
                      <p class="text-base text-gray-900">{{ viewingReservation.vehicle_id ?? '-' }}</p>
                    </div>

                    <div class="rounded-lg border border-gray-200 p-3">
                      <p class="text-sm font-medium text-gray-500">{{ $t('reservations.table.startAt') }}</p>
                      <p class="text-base text-gray-900">{{ viewingReservation.start_at || '-' }}</p>
                    </div>

                    <div class="rounded-lg border border-gray-200 p-3">
                      <p class="text-sm font-medium text-gray-500">{{ $t('reservations.table.endAt') }}</p>
                      <p class="text-base text-gray-900">{{ viewingReservation.end_at || '-' }}</p>
                    </div>

                    <div class="rounded-lg border border-gray-200 p-3 sm:col-span-2">
                      <p class="text-sm font-medium text-gray-500">{{ $t('reservations.table.createdAt') }}</p>
                      <p class="text-base text-gray-900">{{ formatDate(viewingReservation.created_at) }}</p>
                    </div>
                  </div>

                  <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <BaseButton type="button" variant="secondary" @click="closeViewModal">
                      {{ $t('common.close') }}
                    </BaseButton>
                    <BaseButton type="button" variant="primary" @click="switchToEdit">
                      {{ $t('reservations.actions.editReservation') }}
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
import ReservationTable from '@/modules/reservations/components/ReservationTable.vue';
import ReservationForm from '@/modules/reservations/components/ReservationForm.vue';
import { reservationService } from '@/modules/reservations/services/reservation.service';
import type {
  Reservation,
  CreateReservationData,
  UpdateReservationData,
} from '@/modules/reservations/types/reservation.types';
import { useToast } from '@/shared/composables/useToast';
import { validateReservationForm, type ValidationErrors } from '@/modules/reservations/utils/reservationValidation';
import { useI18n } from 'vue-i18n';
import { useTranslateError } from '@/shared/composables/useTranslateError';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

const toast = useToast();
const { t } = useI18n();
const { translateErrorMessage } = useTranslateError();
const { formatDate } = useDateFormatter({ year: 'numeric', month: 'short', day: 'numeric' });

// Estado
const reservations = ref<Reservation[]>([]);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const searchQuery = ref('');

// Modales
const showReservationModal = ref(false);
const showDeleteModal = ref(false);
const showViewModal = ref(false);
const editingReservation = ref<Reservation | null>(null);
const viewingReservation = ref<Reservation | null>(null);
const reservationToDelete = ref<Reservation | null>(null);

// Errores del formulario
const formErrors = ref<ValidationErrors>({});

const loadReservations = async () => {
  loading.value = true;
  try {
    const response = await reservationService.getReservations(1, 100);
    if (response && typeof response === 'object' && 'data' in response) {
      reservations.value = Array.isArray(response.data) ? response.data : [];
    } else if (Array.isArray(response as any)) {
      reservations.value = response as any;
    } else {
      reservations.value = [];
    }
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('reservations.errors.load')));
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
        const results = await reservationService.searchReservations(searchQuery.value);
        reservations.value = results;
      } catch (error: any) {
        if (error.status === 404) {
          toast.error(t('reservations.errors.searchEndpointUnavailable'));
          loadReservations();
        } else {
          toast.error(translateErrorMessage(error?.message, t('reservations.errors.search')));
        }
      } finally {
        loading.value = false;
      }
    } else {
      loadReservations();
    }
  }, 300);
};

const handleRefresh = () => {
  searchQuery.value = '';
  loadReservations();
};

const openCreateModal = () => {
  editingReservation.value = null;
  formErrors.value = {};
  showReservationModal.value = true;
};

const openEditModal = (reservation: Reservation) => {
  editingReservation.value = reservation;
  formErrors.value = {};
  showReservationModal.value = true;
};

const openViewModal = (reservation: Reservation) => {
  viewingReservation.value = reservation;
  showViewModal.value = true;
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewingReservation.value = null;
};

const switchToEdit = () => {
  const reservation = viewingReservation.value;
  if (!reservation) return;
  closeViewModal();
  openEditModal(reservation);
};

const closeReservationModal = () => {
  showReservationModal.value = false;
  editingReservation.value = null;
  formErrors.value = {};
};

const openDeleteModal = (reservation: Reservation) => {
  reservationToDelete.value = reservation;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  reservationToDelete.value = null;
};

const handleSubmit = async (data: CreateReservationData | UpdateReservationData) => {
  submitting.value = true;
  formErrors.value = {};

  const validationErrors = validateReservationForm(data, !!editingReservation.value);
  if (Object.keys(validationErrors).length > 0) {
    formErrors.value = validationErrors;
    submitting.value = false;
    return;
  }

  try {
    if (editingReservation.value) {
      const id = (editingReservation.value.reservation_id ?? editingReservation.value.id) as number | undefined;
      if (!id) throw { message: 'reservations.errors.invalidId' };
      await reservationService.updateReservation(id, data as UpdateReservationData);
      toast.success(t('reservations.toast.updated'));
    } else {
      await reservationService.createReservation(data as CreateReservationData);
      toast.success(t('reservations.toast.created'));
    }

    closeReservationModal();
    await loadReservations();
  } catch (error: any) {
    if (error.errors) {
      formErrors.value = Object.keys(error.errors).reduce((acc, key) => {
        (acc as any)[key] = error.errors[key][0];
        return acc;
      }, {} as Record<string, string>) as any;
    }
    toast.error(translateErrorMessage(error?.message, t('reservations.errors.save')));
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async () => {
  if (!reservationToDelete.value) return;

  deleting.value = true;
  try {
    const id = (reservationToDelete.value.reservation_id ?? reservationToDelete.value.id) as number | undefined;
    if (!id) {
      toast.error(t('reservations.errors.invalidId'));
      deleting.value = false;
      return;
    }
    await reservationService.deleteReservation(id);
    toast.success(t('reservations.toast.deleted'));
    closeDeleteModal();
    await loadReservations();
  } catch (error: any) {
    const errorMsg =
      error.status === 404
        ? t('reservations.errors.notFound')
        : (error.message || t('reservations.errors.delete'));
    toast.error(errorMsg);
    if (error.status === 404) {
      closeDeleteModal();
      await loadReservations();
    }
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  loadReservations();
});
</script>
