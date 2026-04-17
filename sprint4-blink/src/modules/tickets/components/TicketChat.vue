<template>
  <div class="flex flex-col h-[70vh] sm:h-[55vh] md:h-[480px] w-full">
    <!-- Header del ticket -->
    <div class="border-b pb-3 mb-3 px-4 sm:px-0">
      <div class="flex items-start justify-between gap-2 sm:gap-3">
        <div class="flex-1 min-w-0">
          <h4 class="text-base sm:text-lg font-semibold text-gray-900 truncate">{{ ticket.asunto }}</h4>
          <p class="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{{ ticket.usuario_nombre }} &lt;{{ ticket.usuario_email }}&gt;</p>
        </div>
        <span class="shrink-0 inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full whitespace-nowrap" :class="getEstadoClass(ticket.estado)">
          {{ ticket.estado ? t(`tickets.estados.${ticket.estado}`) : t('tickets.estados.pendiente') }}
        </span>
      </div>
      <p class="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2 sm:line-clamp-3">{{ ticket.descripcion }}</p>
    </div>

    <!-- Àrea de missatges -->
    <div class="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-3 sm:mb-4 px-2 sm:px-1" ref="messagesContainer">
      <div v-if="!messages || messages.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-8">
        <svg class="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-xs sm:text-sm">{{ $t('adminTickets.chat.noMessages') }}</p>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        :class="['flex items-end gap-1 sm:gap-2', isAdminMessage(message) ? 'justify-end' : 'justify-start']"
      >
        <!-- Avatar usuari (esquerra) -->
        <div v-if="!isAdminMessage(message)" class="shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center flex-shrink-0">
          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
        </div>

        <!-- Bombolla missatge -->
        <div :class="['w-full max-w-[92%] sm:max-w-[70%] md:max-w-[60%] flex flex-col', isAdminMessage(message) ? 'items-end' : 'items-start']">
          <span class="text-xs font-medium mb-0.5 sm:mb-1 px-1 line-clamp-1" :class="isAdminMessage(message) ? 'text-purple-700' : 'text-gray-600'">
            {{ isAdminMessage(message) ? $t('adminTickets.chat.admin') : (message.usuario_nombre || ticket.usuario_nombre || $t('tickets.table.usuario')) }}
          </span>
          <div
            :class="[
              'rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm text-sm overflow-hidden word-break',
              isAdminMessage(message)
                ? 'bg-purple-600 text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
            ]"
          >
            <p class="break-all sm:break-words whitespace-pre-wrap leading-relaxed">{{ message.mensaje }}</p>
          </div>
          <p class="text-xs mt-0.5 sm:mt-1 px-1 text-gray-400 line-clamp-1">
            {{ formatDate(message.created_at) }}
          </p>
        </div>

        <div v-if="isAdminMessage(message)" class="shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    <div class="border-t pt-3 sm:pt-4 px-4 sm:px-0">
      <form @submit.prevent="handleSubmit" class="space-y-2 sm:space-y-3">
        <textarea
          v-model="newMessage"
          rows="2"
          class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
          :placeholder="$t('adminTickets.chat.messagePlaceholder')"
          :disabled="loading"
        />
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p class="text-xs sm:text-sm text-gray-500">
            {{ $t('adminTickets.chat.replyAs') }}
            <span class="font-semibold text-purple-700">{{ $t('adminTickets.chat.admin') }}</span>
          </p>
          <div class="flex gap-2 w-full sm:w-auto">
            <BaseButton type="button" variant="secondary" @click="$emit('close')" :disabled="loading" class="flex-1 sm:flex-initial text-xs sm:text-sm py-2 sm:py-auto">
              {{ $t('common.close') }}
            </BaseButton>
            <BaseButton type="submit" :loading="loading" :disabled="!newMessage.trim()" class="flex-1 sm:flex-initial text-xs sm:text-sm py-2 sm:py-auto">
              {{ $t('adminTickets.chat.send') }}
            </BaseButton>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue';
import { BaseButton } from '@/components/base';
import type { AdminTicket } from '@/modules/tickets/types/adminTicket.types';
import { useI18n } from 'vue-i18n';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';
import { getEstadoClass } from '@/modules/tickets/utils/ticketHelpers';

interface Props {
  ticket: AdminTicket;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  send: [message: string];
  close: [];
}>();

const { t } = useI18n();

const newMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const messages = computed(() => props.ticket.mensajes || []);

const isAdminMessage = (msg: { is_admin: boolean }) => msg.is_admin;

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

watch(messages, () => {
  scrollToBottom();
}, { immediate: true });

const handleSubmit = () => {
  if (!newMessage.value.trim()) return;
  emit('send', newMessage.value.trim());
  newMessage.value = '';
};

const { formatDate } = useDateFormatter();
</script>
