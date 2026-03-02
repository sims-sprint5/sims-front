import { computed, type Ref } from 'vue';
import type { CreateUserData } from '../types/user.types';

export function useUserForm(formData: Ref<CreateUserData>) {
  const passwordMismatchError = computed(() => {
    if (!formData.value.password && !formData.value.password_confirmation) return '';
    if (formData.value.password !== formData.value.password_confirmation) {
      return 'validation.passwordMismatch';
    }
    return '';
  });

  const onPhoneKeydown = (event: KeyboardEvent) => {
    const key = event.key;
    const allowed = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab', 'Enter'
    ];
    if (allowed.includes(key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (/^\d$/.test(key)) return;
    event.preventDefault();
  };

  const onPhonePaste = (event: ClipboardEvent) => {
    const paste = event.clipboardData?.getData('text') || '';
    const onlyDigits = paste.replace(/\D/g, '');
    if (paste !== onlyDigits) {
      event.preventDefault();
      const input = event.target as HTMLInputElement | null;
      if (!input) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const newValue = input.value.slice(0, start) + onlyDigits + input.value.slice(end);
      formData.value.phone = newValue.replace(/\D/g, '');
    }
  };

  return { passwordMismatchError, onPhoneKeydown, onPhonePaste };
}
