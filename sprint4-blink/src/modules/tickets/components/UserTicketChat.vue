<template>
  <div class="flex flex-col h-[min(70vh,560px)] sm:h-[560px]">
    <!-- Header del ticket -->
    <div class="border-b pb-4 mb-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <h4 class="text-lg font-semibold text-gray-900 truncate">{{ ticket.asunto }}</h4>
          <p class="text-sm text-gray-500 mt-0.5">{{ formatDate(ticket.created_at) }}</p>
        </div>
        <span class="shrink-0 inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full" :class="getEstadoClass(ticket.estado)">
          {{ ticket.estado ? t(`tickets.estados.${ticket.estado}`) : t('tickets.estados.pendiente') }}
        </span>
      </div>
      <p class="text-sm text-gray-600 mt-2 leading-relaxed">{{ ticket.descripcion }}</p>
    </div>

    <!-- Àrea de missatges -->
    <div class="flex-1 overflow-y-auto space-y-4 mb-4 px-1" ref="messagesContainer">
      <div v-if="!messages || messages.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-sm">{{ $t('tickets.chat.noMessages') }}</p>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        :class="['flex items-end gap-2', isOwnMessage(message) ? 'justify-end' : 'justify-start']"
      >
        <div v-if="!isOwnMessage(message)" class="shrink-0 w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center">
          <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
          </svg>
        </div>

        <div :class="['max-w-[85%] sm:max-w-[72%] flex flex-col', isOwnMessage(message) ? 'items-end' : 'items-start']">
          <span class="text-xs font-medium mb-1 px-1" :class="isOwnMessage(message) ? 'text-blue-700' : 'text-purple-700'">
            {{ isOwnMessage(message) ? currentUserName : $t('tickets.chat.admin') }}
          </span>
          <div
            :class="[
              'rounded-2xl px-4 py-2.5 shadow-sm',
              isOwnMessage(message)
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-white border border-purple-200 text-gray-900 rounded-tl-sm'
            ]"
          >
            <p class="text-sm whitespace-pre-wrap leading-relaxed">{{ message.mensaje }}</p>
          </div>
          <p class="text-xs mt-1 px-1 text-gray-400">
            {{ formatDate(message.created_at) }}
          </p>
        </div>

        <!-- Avatar usuari (dreta) -->
        <div v-if="isOwnMessage(message)" class="shrink-0 w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
          <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Input de resposta -->
    <div class="border-t pt-4">
      <form @submit.prevent="handleSubmit" class="space-y-3">
        <textarea
          v-model="newMessage"
          rows="3"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          :placeholder="$t('tickets.chat.messagePlaceholder')"
          :disabled="loading"
        />
        <div class="flex justify-end items-center gap-2">
          <BaseButton type="button" variant="secondary" @click="$emit('close')" :disabled="loading">
            {{ $t('common.close') }}
          </BaseButton>
          <BaseButton type="submit" :loading="loading" :disabled="!newMessage.trim()">
            {{ $t('tickets.chat.send') }}
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue';
import { BaseButton } from '@/components/base';
import type { Ticket } from '@/modules/tickets/types/ticket.types';
import { authService } from '@/modules/auth/services/auth.service';
import { useI18n } from 'vue-i18n';
import { useDateFormatter } from '@/shared/composables/useDateFormatter';
import { getEstadoClass } from '@/modules/tickets/utils/ticketHelpers';

interface Props {
  ticket: Ticket;
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

const currentUser = authService.getUser();
const currentUserName = currentUser?.name ?? t('tickets.chat.you');

const newMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const messages = computed(() => props.ticket.mensajes || []);

const isOwnMessage = (msg: { is_admin: boolean }) => !msg.is_admin;

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
