<template>
  <div class="chatbot-wrapper">
    <!-- Toggle Button -->
    <BaseTooltip :text="t('chatbot.openChat')" v-if="!isOpen">
      <button
        class="chatbot-toggle"
        @click="isOpen = !isOpen"
      >
        Chat
      </button>
    </BaseTooltip>

    <!-- Chat Window -->
    <div v-if="isOpen" class="chatbot-window">
      <div class="chat-header">
        <h3>{{ t('chatbot.title') }}</h3>
        <BaseTooltip :text="t('common.close')">
          <button class="close-btn" @click="isOpen = false">✕</button>
        </BaseTooltip>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div class="message bot" v-if="messages.length === 0">
          <p>{{ t('chatbot.greeting', { name: currentUserFirstName }) }}</p>
        </div>

        <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role]">
          <p v-if="msg.role === 'user'">{{ msg.content }}</p>
          <p v-else-if="msg.role === 'assistant'">{{ msg.content }}</p>
          <p v-else class="error-text">{{ msg.content }}</p>
        </div>

        <div v-if="loading" class="message bot loading">
          <p>{{ t('chatbot.typing') }}</p>
        </div>
      </div>

      <div class="chat-input-area">
        <input
          v-model="userMessage"
          @keyup.enter="sendMessage"
          type="text"
          :placeholder="getPlaceholder()"
          :disabled="loading"
          class="chat-input"
        />
        <button
          @click="sendMessage"
          :disabled="loading || !userMessage.trim()"
          class="send-btn"
        >
          Send
        </button>
      </div>

      <div class="chat-footer">
        <small>{{ t('chatbot.footer', { context: contextSummary }) }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUser } from '@/modules/auth/composables/useUser';
import { BaseTooltip } from '@/components/base';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'error';
  content: string;
}

const { t } = useI18n();
const { user } = useUser();
const route = useRoute();

const isOpen = ref(false);
const messages = ref<Message[]>([]);
const userMessage = ref('');
const loading = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

// Get current user info
const currentUserFirstName = computed(() => {
  return user.value?.name?.split(' ')[0] || t('chatbot.defaultGreeting');
});

// Context summary for footer
const contextSummary = computed(() => {
  const routeName = route.name?.toString() || 'inicio';
  
  switch (routeName) {
    case 'UserMap':
      return t('chatbot.contextMap');
    case 'MyReservations':
      return t('chatbot.contextReservations');
    case 'UserTickets':
      return t('chatbot.contextTickets');
    default:
      return t('chatbot.contextDefault');
  }
});

// Get placeholder based on current page
const getPlaceholder = () => {
  const routeName = route.name?.toString() || '';
  
  if (routeName === 'UserMap') {
    return t('chatbot.placeholderMap');
  }
  if (routeName === 'MyReservations') {
    return t('chatbot.placeholderReservations');
  }
  if (routeName === 'UserTickets') {
    return t('chatbot.placeholderTickets');
  }
  return t('chatbot.placeholderDefault');
};

// Build context for AI
const buildContext = () => {
  const routeName = route.name?.toString() || 'inicio';
  
  const baseContext = `
PROYECTO: SIMS - Sistema de Gestión de Reserva de Vehículos
USUARIO: ${user.value?.name || 'Usuario'}
IDIOMA: ${t('_lang')}
PÁGINA ACTUAL: ${routeName}
EMAIL: ${user.value?.email || 'no disponible'}
  `.trim();

  return baseContext;
};

// Scroll to latest message
const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// Send message to backend
const sendMessage = async () => {
  if (!userMessage.value.trim() || loading.value) return;

  // Add user message to chat
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: userMessage.value,
  });

  const msg = userMessage.value;
  userMessage.value = '';
  loading.value = true;

  await scrollToBottom();

  try {
    // Build enriched message with context
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
        page: route.name?.toString() || 'inicio',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message || data.response || t('chatbot.errorProcessing'),
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      messages.value.push({
        id: Date.now() + 1,
        role: 'error',
        content: errorData.message || errorData.error || `Error: ${response.status} ${response.statusText}`,
      });
    }
  } catch (err) {
    console.error('Chat error:', err);
    messages.value.push({
      id: Date.now() + 1,
      role: 'error',
      content: t('chatbot.errorConnection'),
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

// Initialize on mount
onMounted(() => {
  // Initial greeting (optional)
});

// Watch for route changes to clear context
watch(() => route.path, () => {
  // Keep messages, just update context for next question
});
</script>

<style scoped>
.chatbot-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  z-index: 1000;
}

.chatbot-toggle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chatbot-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.chatbot-toggle:active {
  transform: scale(0.95);
}

.chatbot-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 380px;
  height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .chatbot-window {
    width: calc(100% - 20px);
    height: 100%;
    right: 10px;
    bottom: 10px;
    border-radius: 0;
  }

  .chatbot-toggle {
    position: fixed;
    bottom: 30px;
    right: 30px;
  }
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.chat-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 0.8;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #f8f9fa;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.message {
  display: flex;
  margin-bottom: 4px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message p {
  margin: 0;
  padding: 6px 10px;
  border-radius: 8px;
  max-width: 85%;
  word-wrap: break-word;
  font-size: 12px;
  line-height: 1.3;
}

.message.user {
  justify-content: flex-end;
}

.message.user p {
  background: #667eea;
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.message.assistant {
  justify-content: flex-start;
}

.message.assistant p {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 18px 18px 18px 4px;
}

.message.error p {
  background: #ffebee;
  color: #c62828;
  border-radius: 18px 18px 18px 4px;
}

.message.loading p {
  font-style: italic;
  opacity: 0.7;
}

.error-text {
  color: #d32f2f;
}

.chat-input-area {
  display: flex;
  gap: 6px;
  padding: 8px;
  background: white;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.chat-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-footer {
  text-align: center;
  padding: 4px;
  font-size: 10px;
  color: #999;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  flex-shrink: 0;
}
</style>
