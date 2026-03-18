import { onBeforeUnmount } from 'vue';

export function useDebouncedSearch(delay = 300) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const run = (callback: () => void | Promise<void>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      void callback();
    }, delay);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  onBeforeUnmount(cancel);

  return {
    run,
    cancel,
  };
}
