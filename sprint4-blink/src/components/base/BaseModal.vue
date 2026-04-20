<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Overlay -->
          <Transition
            name="modal-overlay"
            enter-active-class="ease-out duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="ease-in duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div
              v-if="show"
              class="fixed inset-0 bg-base-dark0 bg-opacity-75 transition-opacity"
              @click="$emit('close')"
            />
          </Transition>

          <!-- Center modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <!-- Modal panel -->
          <Transition
            name="modal-content"
            enter-active-class="ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              v-if="show"
              class="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <div class="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div
                    class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10"
                    :class="iconBgColor"
                  >
                    <svg
                      class="h-6 w-6"
                      :class="iconColor"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        v-if="type === 'danger'"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                      <path
                        v-else-if="type === 'success'"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        v-else
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 class="text-lg leading-6 font-medium color-text-inverse" id="modal-title">
                      {{ title }}
                    </h3>
                    <div class="mt-2">
                      <p class="text-sm text-muted">
                        {{ message }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-base-dark px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <BaseButton
                  type="button"
                  :variant="confirmVariant"
                  @click="$emit('confirm')"
                  :loading="loading"
                  class="w-full sm:w-auto sm:ml-3"
                >
                  {{ resolvedConfirmText }}
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="secondary"
                  @click="$emit('close')"
                  :disabled="loading"
                  class="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  {{ resolvedCancelText }}
                </BaseButton>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseButton } from '../base';

interface Props {
  show: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  loading: false,
});

const { t } = useI18n();

const resolvedConfirmText = computed(() => props.confirmText ?? t('common.confirm'));
const resolvedCancelText = computed(() => props.cancelText ?? t('common.cancel'));

defineEmits<{
  confirm: [];
  close: [];
}>();

const iconBgColor = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-modal-danger-bg';
    case 'success':
      return 'bg-modal-success-bg';
    default:
      return 'bg-modal-info-bg';
  }
});

const iconColor = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'text-modal-danger-text';
    case 'success':
      return 'text-modal-success-text';
    default:
      return 'text-modal-info-text';
  }
});

const confirmVariant = computed(() => {
  return props.type === 'danger' ? 'tertiary' : 'primary';
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
