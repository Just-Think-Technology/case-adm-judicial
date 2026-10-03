'use client';

import { useEffect, useRef, useState } from 'react';
import { dismissToast, subscribeToasts, type Toast } from '@/lib/toast';

const STYLES: Record<Toast['kind'], string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-navy-950/15 bg-white text-navy-950',
};

const LEAVE_MS = 250;

// Fixed host, top-right, above content and dialogs' shade but below nothing
// else. Errors announce assertively, the rest politely — toasts are the single
// home for action feedback across the whole app. A toast that leaves the store
// lingers briefly with the exit animation instead of vanishing mid-frame.
export function Toaster(): React.ReactNode {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [leaving, setLeaving] = useState<Toast[]>([]);
  const live = useRef<Map<number, Toast>>(new Map());
  useEffect(() => subscribeToasts(setToasts), []);

  useEffect(() => {
    const next = new Map(toasts.map((toast) => [toast.id, toast]));
    for (const [id, toast] of live.current) {
      if (!next.has(id)) {
        setLeaving((current) => (current.some((item) => item.id === id) ? current : [...current, toast]));
        window.setTimeout(() => {
          setLeaving((current) => current.filter((item) => item.id !== id));
        }, LEAVE_MS);
      }
    }
    live.current = next;
  }, [toasts]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed top-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          className={`toast-in pointer-events-auto relative flex items-start gap-2 overflow-hidden rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${STYLES[toast.kind]}`}
        >
          <span className="flex-1">{toast.text}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Fechar aviso"
            className="rounded p-0.5 opacity-60 hover:opacity-100"
          >
            ✕
          </button>
          <span aria-hidden="true" className="toast-bar absolute bottom-0 left-0 h-0.5 w-full origin-left bg-current opacity-40" />
        </div>
      ))}
      {leaving.map((toast) => (
        <div
          key={`leaving-${toast.id}`}
          aria-hidden="true"
          className={`toast-out pointer-events-auto relative flex items-start gap-2 overflow-hidden rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${STYLES[toast.kind]}`}
        >
          <span className="flex-1">{toast.text}</span>
        </div>
      ))}
    </div>
  );
}
