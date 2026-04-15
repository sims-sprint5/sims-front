<template>
  <AppLayout :title="$t('adminTickets.title')">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <p class="mt-2 text-sm text-muted">
              {{ $t('adminTickets.description') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Búsqueda y filtros -->
      <div class="mb-6 bg-surface p-4 rounded-lg shadow">
        <div class="flex flex-col gap-4 sm:flex-row">
          <div class="flex-1">
            <BaseInput v-model="searchQuery" type="text" :placeholder="$t('adminTickets.searchPlaceholder')"
              @input="handleSearch" />
          </div>
          <BaseButton @click="handleRefresh" variant="secondary" class="w-full sm:w-auto">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ $t('filters.clear') }}
          </BaseButton>
        </div>
      </div>

      <AdminTicketTable :tickets="tickets" :loading="loading" @view="openViewModal" @chat="openChatModal"
        @delete="openDeleteModal" />

      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showChatModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title"
            role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div class="fixed inset-0 bg-base-dark0 bg-opacity-75 transition-opacity" @click="closeChatModal" />
              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div
                class="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <TicketChat v-if="chattingTicket" :ticket="chattingTicket" :loading="submitting" @send="handleSendMessage"
                    @close="closeChatModal" />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <BaseModal :show="showDeleteModal" :title="$t('adminTickets.modal.deleteTitle')"
        :message="$t('adminTickets.modal.deleteMessage', { asunto: ticketToDelete?.asunto ?? '' })" type="danger"
        :confirm-text="$t('common.delete')" :cancel-text="$t('common.cancel')" :loading="deleting"
        @confirm="handleDelete" @close="closeDeleteModal" />

      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showViewModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title"
            role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div class="fixed inset-0 bg-base-dark0 bg-opacity-75 transition-opacity" @click="closeViewModal" />
              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div
                class="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-main mb-4">
                    {{ $t('adminTickets.modal.detailsTitle') }}
                  </h3>
                  <div v-if="viewingTicket" class="space-y-4">
                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-muted">{{ $t('tickets.table.usuario') }}</p>
                      <p class="text-base text-main">{{ viewingTicket.usuario_nombre }}</p>
                      <p class="text-sm text-muted">{{ viewingTicket.usuario_email }}</p>
                    </div>
                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-muted">{{ $t('tickets.table.asunto') }}</p>
                      <p class="text-base text-main">{{ viewingTicket.asunto }}</p>
                    </div>

                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-muted">{{ $t('tickets.table.descripcion') }}</p>
                      <p class="text-base text-main">{{ viewingTicket.descripcion }}</p>
                    </div>

                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-muted mb-2">{{ $t('tickets.table.estado') }}</p>
                      <select
                        v-model="editingEstado"
                        class="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                          {{ option.label }}
                        </option>
                      </select>
                      <p class="text-xs text-muted mt-2">
                        {{ $t('adminTickets.permissions.statusEditableByAdmin') }}
                      </p>
                    </div>

                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-muted mb-2">{{ $t('tickets.table.priority') }}</p>
                      <select
                        v-model="editingPriority"
                        class="w-full px-3 py-2 border border-default rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
                          {{ option.label }}
                        </option>
                      </select>
                      <p class="text-xs text-muted mt-2">
                        {{ $t('adminTickets.permissions.priorityVisibleByAdmin') }}
                      </p>
                    </div>

                    <div>
                      <p class="text-sm font-medium text-muted">{{ $t('tickets.table.createdAt') }}</p>
                      <p class="text-base text-main">{{ formatDate(viewingTicket.created_at) }}</p>
                    </div>
                  </div>
                  <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <BaseButton type="button" variant="secondary" @click="closeViewModal">
                      {{ $t('common.close') }}
                    </BaseButton>
                    <BaseButton
                      type="button"
                      variant="primary"
                      :loading="updatingMetadata"
                      :disabled="!hasMetadataChanges"
                      @click="handleUpdateMetadata"
                    >
                      {{ $t('common.save') }}
                    </BaseButton>
                    <BaseButton type="button" variant="primary" @click="switchToChat">
                      {{ $t('adminTickets.actions.reply') }}
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
import { ref, onMounted, computed } from 'vue';
import { BaseButton, BaseInput, BaseModal } from '@/components/base';
import AppLayout from '@/layouts/AppLayout.vue';
import AdminTicketTable from '@/modules/tickets/components/AdminTicketTable.vue';
import TicketChat from '@/modules/tickets/components/TicketChat.vue';
import { adminTicketService } from '@/modules/tickets/services/adminTicket.service';
import type { AdminTicket } from '@/modules/tickets/types/adminTicket.types';
import { useToast } from '@/shared/composables/useToast';
import { useI18n } from 'vue-i18n';
import { useTranslateError } from '@/shared/composables/useTranslateError';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';
import { useDebouncedSearch } from '@/shared/composables/useDebouncedSearch';
import { useRouter } from 'vue-router';

const toast = useToast();
const { t } = useI18n();
const router = useRouter();
const { translateErrorMessage } = useTranslateError();
const { formatDate } = useDateFormatter();
const { run: runDebouncedSearch } = useDebouncedSearch(300);

const tickets = ref<AdminTicket[]>([]);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const updatingMetadata = ref(false);
const searchQuery = ref('');

const showChatModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewingTicket = ref<AdminTicket | null>(null);
const chattingTicket = ref<AdminTicket | null>(null);
const ticketToDelete = ref<AdminTicket | null>(null);
const editingEstado = ref('open');
const editingPriority = ref('medium');

type SelectOption = { value: string; label: string };

const statusOptions = computed<SelectOption[]>(() => [
  { value: 'open', label: t('tickets.estados.open') },
  { value: 'in_progress', label: t('tickets.estados.in_progress') },
  { value: 'finalitzat', label: t('tickets.estados.finalitzat') },
]);

const priorityOptions = computed<SelectOption[]>(() => [
  { value: 'high', label: t('tickets.form.priorityHigh') },
  { value: 'medium', label: t('tickets.form.priorityMedium') },
  { value: 'low', label: t('tickets.form.priorityLow') },
]);

const hasMetadataChanges = computed(() => {
  if (!viewingTicket.value) return false;
  return (
    normalizeStatusValue(viewingTicket.value.estado) !== editingEstado.value ||
    normalizePriorityValue(viewingTicket.value.priority) !== editingPriority.value
  );
});

const loadTickets = async () => {
  loading.value = true;
  try {
    const response = await adminTicketService.getTickets(1, 500);
    if (response && typeof response === 'object' && 'data' in response) {
      tickets.value = Array.isArray(response.data) ? response.data : [];
    } else if (Array.isArray(response)) {
      tickets.value = response;
    } else {
      tickets.value = [];
    }
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('tickets.errors.load')));
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  runDebouncedSearch(async () => {
    if (!searchQuery.value.trim()) {
      await loadTickets();
      return;
    }

    loading.value = true;
    try {
      const results = await adminTicketService.searchTickets(searchQuery.value);
      tickets.value = results;
    } catch (error: any) {
      if (error?.status === 404) {
        toast.info(t('tickets.errors.searchEndpointUnavailable'));
        await loadTickets();
      } else {
        toast.error(translateErrorMessage(error?.message, t('tickets.errors.search')));
      }
    } finally {
      loading.value = false;
    }
  });
};

const handleRefresh = async () => {
  searchQuery.value = '';
  await loadTickets();
};

const openViewModal = (ticket: AdminTicket) => {
  viewingTicket.value = ticket;
  editingEstado.value = normalizeStatusValue(ticket.estado);
  editingPriority.value = normalizePriorityValue(ticket.priority);
  showViewModal.value = true;
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewingTicket.value = null;
  editingEstado.value = 'open';
  editingPriority.value = 'medium';
};

function normalizeStatusValue(value: string | undefined): string {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'obert') return 'open';
  if (normalized === 'en_progres') return 'in_progress';
  if (normalized === 'finalitzat') return 'finalitzat';
  if (normalized === 'closed') return 'finalitzat';
  if (normalized === 'in_progress') return 'in_progress';
  return 'open';
}

function normalizePriorityValue(value: string | undefined): string {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'alta' || normalized === 'high') return 'high';
  if (normalized === 'mitjana' || normalized === 'media' || normalized === 'medium') return 'medium';
  if (normalized === 'baixa' || normalized === 'baja' || normalized === 'low') return 'low';
  return 'medium';
}

const handleUpdateMetadata = async () => {
  if (!viewingTicket.value) return;

  updatingMetadata.value = true;
  try {
    const id = (viewingTicket.value.id ?? viewingTicket.value.ticket_id) as number | undefined;
    if (!id) throw { message: 'tickets.errors.invalidId' };

    const updated = await adminTicketService.updateTicket(id, {
      estado: editingEstado.value,
      priority: editingPriority.value,
    });

    viewingTicket.value = updated;

    if (chattingTicket.value && (chattingTicket.value.id ?? chattingTicket.value.ticket_id) === id) {
      chattingTicket.value = updated;
    }

    tickets.value = tickets.value.map((ticket) =>
      (ticket.id ?? ticket.ticket_id) === id ? { ...ticket, ...updated } : ticket,
    );

    toast.success(t('adminTickets.toast.updated'));
    closeViewModal();
    await router.push({ name: 'AdminTickets' });

  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('tickets.errors.save')));
  } finally {
    updatingMetadata.value = false;
  }
};

const switchToChat = () => {
  chattingTicket.value = viewingTicket.value;
  closeViewModal();
  showChatModal.value = true;
};

const openChatModal = async (ticket: AdminTicket) => {
  try {
    const id = (ticket.id ?? ticket.ticket_id) as number;
    if (!id) throw { message: 'tickets.errors.invalidId' };
    const fullTicket = await adminTicketService.getTicketById(id);
    chattingTicket.value = fullTicket;
    showChatModal.value = true;
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('tickets.errors.load')));
  }
};

const closeChatModal = () => {
  showChatModal.value = false;
  chattingTicket.value = null;
};

const handleSendMessage = async (mensaje: string) => {
  if (!chattingTicket.value) return;

  submitting.value = true;
  try {
    const id = (chattingTicket.value.id ?? chattingTicket.value.ticket_id) as number | undefined;
    if (!id) throw { message: 'tickets.errors.invalidId' };
    await adminTicketService.sendMessage(id, { mensaje });
    toast.success(t('adminTickets.toast.messageSent'));
    
    // Reload the ticket to show the newly sent message
    const updatedTicket = await adminTicketService.getTicketById(id!);
    chattingTicket.value = updatedTicket;
    
    // Reload the ticket list
    await loadTickets();
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('tickets.errors.save')));
  } finally {
    submitting.value = false;
  }
};

const openDeleteModal = (ticket: AdminTicket) => {
  ticketToDelete.value = ticket;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  ticketToDelete.value = null;
};

// Eliminar ticket
const handleDelete = async () => {
  if (!ticketToDelete.value) return;

  deleting.value = true;
  try {
    await adminTicketService.deleteTicket(ticketToDelete.value.id);
    toast.success(t('adminTickets.toast.deleted'));
    closeDeleteModal();
    await loadTickets();
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('tickets.errors.delete')));
  } finally {
    deleting.value = false;
  }
};

// Cargar datos al montar el componente
onMounted(() => {
  loadTickets();
});
</script>
