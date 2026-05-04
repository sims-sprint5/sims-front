<template>
  <div class="chatbot-wrapper">
    <!-- Toggle Button -->
    <BaseTooltip :text="t('chatbot.openChat')" v-if="!isOpen">
      <BaseButton
        type="button"
        variant="primary"
        size="sm"
        class="chatbot-toggle !p-0 !rounded-full !shadow-none"
        @click="isOpen = !isOpen"
      >
        Chat
      </BaseButton>
    </BaseTooltip>

    <!-- Chat Window -->
    <div v-if="isOpen" class="chatbot-window">
      <div class="chat-header">
        <h3>{{ t('chatbot.title') }}</h3>
        <BaseTooltip :text="t('common.close')">
          <BaseButton
            type="button"
            variant="muted"
            size="sm"
            class="close-btn !p-0 bg-transparent hover:bg-transparent !shadow-none"
            @click="isOpen = false"
          >
            ✕
          </BaseButton>
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
          class="chat-input text-main bg-surface focus:ring-primary focus:border-primary"
        />
        <BaseButton
          type="button"
          variant="primary"
          size="sm"
          class="send-btn !p-0 !rounded-full !shadow-none"
          :disabled="loading || !userMessage.trim()"
          @click="sendMessage"
        >
          Send
        </BaseButton>
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
import { BaseButton, BaseTooltip } from '@/components/base';

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
PROJECT: Fleetly - Vehicle Reservation Management System
USER: ${user.value?.name || 'User'}
LANGUAGE: ${t('_lang')}
CURRENT PAGE: ${routeName}
EMAIL: ${user.value?.email || 'not available'}
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
    const enrichedMessage = `${context}\n\nUSER QUESTION:\n${msg}`;

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
  font-family: var(--font-main, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
  z-index: 1000;
}

.chatbot-toggle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgb(var(--color-primary));
  color: white;
  border: none;
  font-size: 18px;
  font-weight: 600;
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
  background: rgb(var(--color-primary-hover));
}

.chatbot-toggle:active {
  transform: scale(0.95);
}

.chatbot-window {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 420px;
  height: 700px;
  background: rgb(var(--color-surface));
  border: 1px solid rgb(var(--color-border-default));
  border-radius: 16px;
  box-shadow: 0 5px 40px rgba(0, 0, 0, 0.2);
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
    height: calc(100% - 120px);
    right: 10px;
    bottom: 15px;
    border-radius: 12px;
  }

  .chatbot-toggle {
    position: fixed;
    bottom: 30px;
    right: 30px;
  }
}

.chat-header {
  background: rgb(var(--color-primary));
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: rgb(var(--color-text-inverse));
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgb(var(--color-bg-base));
}

.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgb(var(--color-surface));
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgb(var(--color-border-default));
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-text-ps));
}

.message {
  display: flex;
  margin-bottom: 6px;
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
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 85%;
  word-wrap: break-word;
  font-size: 15px;
  line-height: 1.4;
}

.message.user {
  justify-content: flex-end;
}

.message.user p {
  background: rgb(var(--color-primary));
  color: rgb(var(--color-text-inverse));
  border-radius: 18px 18px 4px 18px;
}

.message.assistant {
  justify-content: flex-start;
}

.message.assistant p {
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text-main));
  border: 1px solid rgb(var(--color-border-default));
  border-radius: 18px 18px 18px 4px;
}

.message.error p {
  background: rgb(var(--color-danger));
  color: rgb(var(--color-text-inverse));
  border-radius: 18px 18px 18px 4px;
}

.message.loading p {
  font-style: italic;
  opacity: 0.7;
}

.error-text {
  color: rgb(var(--color-danger));
}

.chat-input-area {
  display: flex;
  gap: 10px;
  padding: 16px;
  background: rgb(var(--color-surface));
  border-top: 1px solid rgb(var(--color-border-default));
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgb(var(--color-input-border));
  border-radius: 24px;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.chat-input:focus {
  border-color: rgb(var(--color-input-focus));
  box-shadow: 0 0 0 3px rgb(var(--color-input-focus) / 20%);
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgb(var(--color-primary));
  border: none;
  color: rgb(var(--color-text-inverse));
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgb(var(--color-primary) / 40%);
  background: rgb(var(--color-primary-hover));
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgb(var(--color-border-default));
}

.chat-footer {
  text-align: center;
  padding: 10px;
  font-size: 12px;
  color: rgb(var(--color-text-muted));
  border-top: 1px solid rgb(var(--color-border-default));
  background: rgb(var(--color-surface-muted));
}
</style>
