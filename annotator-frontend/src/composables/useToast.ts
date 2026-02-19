/**
 * Toast notification composable using event emitter
 *
 * Usage:
 * ```ts
 * import { useToast } from '@/composables/useToast';
 *
 * const toast = useToast();
 * toast.success('Operation completed!');
 * toast.error('Something went wrong!');
 * toast.warning('Please check your data');
 * toast.info('Processing...');
 * ```
 */

import emitter from '@/plugins/custom-emitter';

export interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useToast() {
  const show = (options: ToastOptions) => {
    emitter.emit('toast:show', options);
  };

  const success = (message: string, duration = 3000) => {
    show({ message, type: 'success', duration });
  };

  const error = (message: string, duration = 5000) => {
    show({ message, type: 'error', duration });
  };

  const warning = (message: string, duration = 4000) => {
    show({ message, type: 'warning', duration });
  };

  const info = (message: string, duration = 3000) => {
    show({ message, type: 'info', duration });
  };

  return {
    show,
    success,
    error,
    warning,
    info,
  };
}
