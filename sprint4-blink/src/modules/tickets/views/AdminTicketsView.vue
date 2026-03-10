<template>
  <AppLayout :title="$t('adminTickets.title')">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <p class="mt-2 text-sm text-gray-600">
              {{ $t('adminTickets.description') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Búsqueda y filtros -->
      <div class="mb-6 bg-white p-4 rounded-lg shadow">
        <div class="flex gap-4">
          <div class="flex-1">
            <BaseInput v-model="searchQuery" type="text" :placeholder="$t('adminTickets.searchPlaceholder')"
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

      <!-- Tabla de tickets admin -->
      <AdminTicketTable :tickets="tickets" :loading="loading" @view="openViewModal" @chat="openChatModal"
        @delete="openDeleteModal" />

      <!-- Modal de Chat de Ticket -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showChatModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title"
            role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <!-- Overlay -->
              <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeChatModal" />

              <!-- Center modal -->
              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <!-- Modal panel -->
              <div
                class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <TicketChat v-if="chattingTicket" :ticket="chattingTicket" :loading="submitting" @send="handleSendMessage"
                    @close="closeChatModal" />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Modal de Confirmación de Eliminación -->
      <BaseModal :show="showDeleteModal" :title="$t('adminTickets.modal.deleteTitle')"
        :message="$t('adminTickets.modal.deleteMessage', { asunto: ticketToDelete?.asunto ?? '' })" type="danger"
        :confirm-text="$t('common.delete')" :cancel-text="$t('common.cancel')" :loading="deleting"
        @confirm="handleDelete" @close="closeDeleteModal" />

      <!-- Modal de Visualización de Ticket -->
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
                    {{ $t('adminTickets.modal.detailsTitle') }}
                  </h3>
                  <div v-if="viewingTicket" class="space-y-4">
                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-gray-500">{{ $t('tickets.table.usuario') }}</p>
                      <p class="text-base text-gray-900">{{ viewingTicket.usuario_nombre }}</p>
                      <p class="text-sm text-gray-500">{{ viewingTicket.usuario_email }}</p>
                    </div>
                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-gray-500">{{ $t('tickets.table.asunto') }}</p>
                      <p class="text-base text-gray-900">{{ viewingTicket.asunto }}</p>
                    </div>

                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-gray-500">{{ $t('tickets.table.descripcion') }}</p>
                      <p class="text-base text-gray-900">{{ viewingTicket.descripcion }}</p>
                    </div>

                    <div class="border-b pb-4">
                      <p class="text-sm font-medium text-gray-500">{{ $t('tickets.table.estado') }}</p>
                      <span class="inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full" :class="getEstadoClass(viewingTicket.estado)">
                        {{ viewingTicket.estado ? t(`tickets.estados.${viewingTicket.estado}`) : t('tickets.estados.pendiente') }}
                      </span>
                    </div>

                    <!-- fecha removed: show created_at below -->

                    <div>
                      <p class="text-sm font-medium text-gray-500">{{ $t('tickets.table.createdAt') }}</p>
                      <p class="text-base text-gray-900">{{ formatDate(viewingTicket.created_at) }}</p>
                    </div>
                  </div>
                  <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
                    <BaseButton type="button" variant="secondary" @click="closeViewModal">
                      {{ $t('common.close') }}
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
import { ref, onMounted } from 'vue';
import { BaseButton, BaseInput, BaseModal } from '@/components/base';
import AppLayout from '@/layouts/AppLayout.vue';
import AdminTicketTable from '@/modules/tickets/components/AdminTicketTable.vue';
import TicketChat from '@/modules/tickets/components/TicketChat.vue';
import { adminTicketService } from '@/modules/tickets/services/adminTicket.service';
import type { AdminTicket } from '@/modules/tickets/types/adminTicket.types';
import { useToast } from '@/shared/composables/useToast';
import { useI18n } from 'vue-i18n';
import { useTranslateError } from '@/shared/composables/useTranslateError';
import { getEstadoClass } from '@/modules/tickets/utils/ticketHelpers';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';

const toast = useToast();
const { t } = useI18n();
const { translateErrorMessage } = useTranslateError();
const { formatDate } = useDateFormatter();

// Estado
const tickets = ref<AdminTicket[]>([]);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const searchQuery = ref('');

// Modales
const showChatModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewingTicket = ref<AdminTicket | null>(null);
const chattingTicket = ref<AdminTicket | null>(null);
const ticketToDelete = ref<AdminTicket | null>(null);

// Cargar tickets
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

// Búsqueda
let searchTimeout: ReturnType<typeof setTimeout>;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
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
  }, 300);
};

const handleRefresh = async () => {
  searchQuery.value = '';
  await loadTickets();
};

// Modales - Ver
const openViewModal = (ticket: AdminTicket) => {
  viewingTicket.value = ticket;
  showViewModal.value = true;
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewingTicket.value = null;
};

const switchToChat = () => {
  chattingTicket.value = viewingTicket.value;
  closeViewModal();
  showChatModal.value = true;
};

// Modales - Chat
const openChatModal = async (ticket: AdminTicket) => {
  // Recargar el ticket para obtener los mensajes más recientes
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

// Enviar mensaje
const handleSendMessage = async (mensaje: string) => {
  if (!chattingTicket.value) return;

  submitting.value = true;
  try {
    const id = (chattingTicket.value.id ?? chattingTicket.value.ticket_id) as number | undefined;
    if (!id) throw { message: 'tickets.errors.invalidId' };
    await adminTicketService.sendMessage(id, { mensaje });
    toast.success(t('adminTickets.toast.messageSent'));
    
    // Recargar el ticket para obtener el mensaje recién enviado
    const updatedTicket = await adminTicketService.getTicketById(id!);
    chattingTicket.value = updatedTicket;
    
    // Recargar la lista de tickets
    await loadTickets();
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('tickets.errors.save')));
  } finally {
    submitting.value = false;
  }
};

// Modales - Eliminar
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
