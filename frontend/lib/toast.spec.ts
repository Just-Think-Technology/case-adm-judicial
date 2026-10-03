import { describe, expect, it, vi } from 'vitest';
import { dismissToast, notifyToast, subscribeToasts } from './toast';

describe('toast bus', () => {
  it('publishes and dismisses through subscribers', () => {
    vi.useFakeTimers();
    try {
      const seen: string[][] = [];
      const unsubscribe = subscribeToasts((toasts) => seen.push(toasts.map((toast) => toast.text)));
      const id = notifyToast('success', 'Feito!');
      expect(seen.at(-1)).toEqual(['Feito!']);
      dismissToast(id);
      expect(seen.at(-1)).toEqual([]);
      unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });

  it('auto-dismisses after the timeout', () => {
    vi.useFakeTimers();
    try {
      const seen: string[][] = [];
      const unsubscribe = subscribeToasts((toasts) => seen.push(toasts.map((toast) => toast.text)));
      notifyToast('error', 'Falhou.');
      expect(seen.at(-1)).toEqual(['Falhou.']);
      vi.advanceTimersByTime(6000);
      expect(seen.at(-1)).toEqual([]);
      unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });
});
