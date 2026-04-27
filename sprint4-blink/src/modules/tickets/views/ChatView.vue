<template>
  <AppLayout :title="t('nav.chat')">
    <div class="h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] flex flex-col overflow-hidden bg-surface">
      <!-- Header -->
      <div class="chat-header-bg text-inverse px-4 py-3 shadow-md flex-shrink-0">
        <h1 class="text-lg font-bold text-white">{{ t('nav.chat') }}</h1>
      </div>

      <!-- Chat Container -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-base">
          <!-- Initial Message -->
          <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center px-4">
              <h2 class="text-xl font-bold text-main mb-2">
                {{ t('chatbot.greeting', { name: userFirstName }) }}
              </h2>
              <p class="text-muted text-base-reverse max-w-md mx-auto">
                {{ t('chatbot.welcomeMessage') }}
              </p>
            </div>
          </div>

          <!-- Messages -->
          <div v-for="msg in messages" :key="msg.id" :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']">
            <div :class="['px-4 py-3 rounded-xl text-base break-words max-w-[85%]', msg.role === 'user' ? 'chat-msg-user rounded-br-sm' : msg.role === 'error' ? 'chat-msg-error rounded-bl-sm' : 'bg-surface text-main border border-default rounded-bl-sm']">
              <p class="whitespace-pre-wrap m-0">{{ msg.content }}</p>
              <span :class="['text-xs block opacity-70 mt-1', msg.role === 'user' ? 'text-white' : msg.role === 'error' ? 'text-white' : 'text-muted']">
                {{ formatTime(msg.timestamp) }}
              </span>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex justify-start">
            <div class="bg-surface border border-default px-4 py-3 rounded-xl rounded-bl-sm">
              <div class="flex gap-1.5 items-center h-full py-1">
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
              </div>
            </div>
          </div>

          <!-- Auto-scroll anchor -->
          <div ref="messagesEnd"></div>
        </div>

        <!-- Input Area -->
        <div class="bg-surface border-t border-default p-4 shadow-md flex-shrink-0">
          <div class="flex gap-3">
            <input
              v-model="userMessage"
              @keyup.enter="sendMessage"
              type="text"
              :placeholder="getPlaceholder()"
              :disabled="loading"
              class="flex-1 rounded-full border border-default px-4 py-3 text-base focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed bg-[rgb(var(--color-input-bg))] text-[rgb(var(--color-text-main))] chat-input-focus transition-all"
            />
            <button
              @click="sendMessage"
              :disabled="loading || !userMessage.trim()"
              class="chat-btn-send text-white rounded-full px-6 py-3 font-semibold text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 whitespace-nowrap"
            >
              {{ t('common.send') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUser } from '@/modules/auth/composables/useUser';
import AppLayout from '@/layouts/AppLayout.vue';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

const { t } = useI18n();
const { user } = useUser();
const route = useRoute();

const messages = ref<Message[]>([]);
const userMessage = ref('');
const loading = ref(false);
const messagesEnd = ref<HTMLElement | null>(null);

const userFirstName = computed(() => user.value?.name?.split(' ')[0] || t('chatbot.defaultGreeting'));

const getPlaceholder = () => {
  const routeName = route.name?.toString() || '';
  if (routeName === 'UserMap') return t('chatbot.placeholderMap');
  if (routeName === 'MyReservations') return t('chatbot.placeholderReservations');
  if (routeName === 'UserTickets') return t('chatbot.placeholderTickets');
  return t('chatbot.placeholderDefault');
};

const buildContext = () => {
  const baseContext = `
PROYECTO: SIMS - Sistema de Gestión de Reserva de Vehículos
USUARIO: ${user.value?.name || 'Usuario'}
IDIOMA: ${t('_lang')}
EMAIL: ${user.value?.email || 'no disponible'}
PÁGINA: chat
  `.trim();
  return baseContext;
};

const scrollToBottom = async () => {
  await nextTick();
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const sendMessage = async () => {
  if (!userMessage.value.trim() || loading.value) return;

  const timestamp = new Date();
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: userMessage.value,
    timestamp,
  });

  const msg = userMessage.value;
  userMessage.value = '';
  loading.value = true;

  await scrollToBottom();

  try {
    const context = buildContext();
    const enrichedMessage = `${context}\n\nPREGUNTA DEL USUARIO:\n${msg}`;

    const response = await fetch('/api/v1/chat/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        message: enrichedMessage,
        original_message: msg,
        page: 'chat',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message || data.response || t('chatbot.errorProcessing'),
        timestamp: new Date(),
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      messages.value.push({
        id: Date.now() + 1,
        role: 'error',
        content: errorData.message || errorData.error || `Error: ${response.status} ${response.statusText}`,
        timestamp: new Date(),
      });
    }
  } catch (err) {
    console.error('Chat error:', err);
    messages.value.push({
      id: Date.now() + 1,
      role: 'error',
      content: t('chatbot.errorConnection'),
      timestamp: new Date(),
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};
</script>

<style scoped>
.chat-header-bg {
  background: rgb(var(--color-primary));
}
.chat-msg-user, .chat-msg-user p {
  background: rgb(var(--color-primary));
  color: white !important;
}
.chat-msg-error, .chat-msg-error p {
  background: rgb(var(--color-danger));
  color: white !important;
}
.chat-btn-send {
  background: rgb(var(--color-primary));
}
.chat-btn-send:hover:not(:disabled) {
  background: rgb(var(--color-primary-hover));
}
.chat-input-focus:focus {
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 2px rgba(var(--color-primary), 0.2);
}
</style>
