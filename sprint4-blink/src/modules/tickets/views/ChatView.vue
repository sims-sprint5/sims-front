<template>
  <AppLayout :title="t('nav.chat')">
    <div class="h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] flex flex-col overflow-hidden bg-white">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-2 py-1 shadow-sm flex-shrink-0">
        <h1 class="text-sm font-bold">{{ t('nav.chat') }}</h1>
      </div>

      <!-- Chat Container -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1 bg-gray-50">
          <!-- Initial Message -->
          <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center px-2">
              <h2 class="text-sm font-bold text-gray-900 mb-0.5">
                {{ t('chatbot.greeting', { name: userFirstName }) }}
              </h2>
              <p class="text-gray-600 text-xs max-w-sm">
                {{ t('chatbot.welcomeMessage') }}
              </p>
            </div>
          </div>

          <!-- Messages -->
          <div v-for="msg in messages" :key="msg.id" :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']">
            <div :class="['px-2 py-1 rounded text-xs break-words', msg.role === 'user' ? 'bg-purple-500 text-white rounded-br-none max-w-xs' : msg.role === 'error' ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none max-w-xs' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none max-w-xs']">
              <p class="whitespace-pre-wrap m-0">{{ msg.content }}</p>
              <span :class="['text-xs block opacity-60', msg.role === 'user' ? 'text-purple-100' : msg.role === 'error' ? 'text-red-600' : 'text-gray-400']">
                {{ formatTime(msg.timestamp) }}
              </span>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex justify-start">
            <div class="bg-white border border-gray-200 px-2 py-1 rounded rounded-bl-none">
              <div class="flex gap-0.5">
                <div class="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div class="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                <div class="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
              </div>
            </div>
          </div>

          <!-- Auto-scroll anchor -->
          <div ref="messagesEnd"></div>
        </div>

        <!-- Input Area -->
        <div class="bg-white border-t border-gray-200 p-1 shadow-sm flex-shrink-0">
          <div class="flex gap-1">
            <input
              v-model="userMessage"
              @keyup.enter="sendMessage"
              type="text"
              :placeholder="getPlaceholder()"
              :disabled="loading"
              class="flex-1 rounded-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              @click="sendMessage"
              :disabled="loading || !userMessage.trim()"
              class="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full px-3 py-1 font-semibold text-xs hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 whitespace-nowrap"
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
