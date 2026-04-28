<template>
  <AppLayout :title="$t('tickets.title')">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <p class="mt-2 text-sm text-muted">
              {{ $t('tickets.description') }}
            </p>
          </div>
          <BaseButton @click="openCreateModal" variant="primary" class="w-full sm:w-auto">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ $t('tickets.actions.newTicket') }}
          </BaseButton>
        </div>
      </div>

      <!-- Búsqueda y filtros -->
      <div class="mb-6 bg-surface p-4 rounded-lg shadow">
        <div class="flex flex-col gap-4 sm:flex-row">
          <div class="flex-1">
            <BaseInput v-model="searchQuery" type="text" :placeholder="$t('tickets.searchPlaceholder')"
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

      <TicketTable :tickets="tickets" :loading="loading" @view="openViewModal" />

      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showTicketModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title"
            role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeTicketModal" />
              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div
                class="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-main mb-4">
                    {{ $t('tickets.actions.createNewTicket') }}
                  </h3>
                  <TicketForm
                    :loading="submitting"
                    :errors="formErrors"
                    :type-options="typeOptions"
                    @submit="handleSubmit"
                    @cancel="closeTicketModal" />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showViewModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title"
            role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeViewModal" />
              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div
                class="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <UserTicketChat v-if="viewingTicket" :ticket="viewingTicket" :loading="submitting" @send="handleSendMessage"
                    @close="closeViewModal" />
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
import { BaseButton, BaseInput } from '@/components/base';
import AppLayout from '@/layouts/AppLayout.vue';
import TicketTable from '@/modules/tickets/components/TicketTable.vue';
import TicketForm from '@/modules/tickets/components/TicketForm.vue';
import UserTicketChat from '@/modules/tickets/components/UserTicketChat.vue';
import { ticketService } from '@/modules/tickets/services/ticket.service';
import type { Ticket, CreateTicketData } from '@/modules/tickets/types/ticket.types';
import { useToast } from '@/shared/composables/useToast';
import { validateTicketForm, type ValidationErrors } from '@/modules/tickets/utils/ticketValidation';
import { useI18n } from 'vue-i18n';
import { useTranslateError } from '@/shared/composables/useTranslateError';
import { useDebouncedSearch } from '@/shared/composables/useDebouncedSearch';

const toast = useToast();
const { t } = useI18n();
const { translateErrorMessage } = useTranslateError();
const { run: runDebouncedSearch } = useDebouncedSearch(300);

type SelectOption = { label: string; value: string };

// Estado
const tickets = ref<Ticket[]>([]);
const loading = ref(false);
const submitting = ref(false);
const searchQuery = ref('');

const showTicketModal = ref(false);
const showViewModal = ref(false);
const viewingTicket = ref<Ticket | null>(null);

const formErrors = ref<ValidationErrors>({});

const ALL_TICKET_TYPES = ['technical', 'billing', 'complaint', 'inquiry'] as const;
function labelType(value: string): string {
  const v = value.toLowerCase();
  if (v === 'technical') return t('tickets.form.typeTechnical');
  if (v === 'billing') return t('tickets.form.typeBilling');
  if (v === 'complaint') return t('tickets.form.typeComplaint');
  if (v === 'inquiry') return t('tickets.form.typeInquiry');
  return value;
}

const typeOptions = computed<SelectOption[]>(() =>
  ALL_TICKET_TYPES.map((v) => ({ value: v, label: labelType(v) }))
);

// Cargar tickets
const loadTickets = async () => {
  loading.value = true;
  try {
    const response = await ticketService.getUserTickets(1, 500);
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
      const results = await ticketService.searchTickets(searchQuery.value);
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

// Modales
const openCreateModal = () => {
  formErrors.value = {};
  showTicketModal.value = true;
};

const closeTicketModal = () => {
  showTicketModal.value = false;
  formErrors.value = {};
};

const openViewModal = async (ticket: Ticket) => {
  // Recargar el ticket para obtener los mensajes más recientes
  try {
    const id = (ticket.id ?? ticket.ticket_id) as number;
    if (!id) throw { message: 'tickets.errors.invalidId' };
    const fullTicket = await ticketService.getTicketById(id);
    viewingTicket.value = fullTicket;
    showViewModal.value = true;
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('tickets.errors.load')));
  }
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewingTicket.value = null;
};

const handleSubmit = async (data: CreateTicketData) => {
  formErrors.value = validateTicketForm(data);
  if (Object.keys(formErrors.value).length > 0) {
    toast.error(t('validation.fixFormErrors'));
    return;
  }

  submitting.value = true;
  try {
    await ticketService.createTicket(data);
    toast.success(t('tickets.toast.created'));
    closeTicketModal();
    await loadTickets();
  } catch (error: any) {
    if (error?.errors) {
      formErrors.value = Object.fromEntries(
        Object.entries(error.errors).map(([key, val]) => [key, Array.isArray(val) ? val[0] : val])
      );
    }
    toast.error(translateErrorMessage(error?.message, t('tickets.errors.save')));
  } finally {
    submitting.value = false;
  }
};

const handleSendMessage = async (mensaje: string) => {
  if (!viewingTicket.value) return;

  submitting.value = true;
  try {
    const id = (viewingTicket.value?.id ?? viewingTicket.value?.ticket_id) as number | undefined;
    if (!id) throw { message: 'tickets.errors.invalidId' };
    await ticketService.sendMessage(id, { mensaje });
    toast.success(t('tickets.toast.messageSent'));
    
    const updatedTicket = await ticketService.getTicketById(id!);
    viewingTicket.value = updatedTicket;
    
    await loadTickets();
  } catch (error: any) {
    toast.error(translateErrorMessage(error?.message, t('tickets.errors.save')));
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadTickets();
});
</script>
