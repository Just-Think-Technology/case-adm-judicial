'use client';

import { useEffect, useState } from 'react';
import { dismissToast, subscribeToasts, type Toast } from '@/lib/toast';

const STYLES: Record<Toast['kind'], string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-navy-950/15 bg-white text-navy-950',
};

// Fixed host, top-right, above content and dialogs' shade but below nothing
// else. Errors announce assertively, the rest politely — toasts are the single
// home for action feedback across the whole app.
export function Toaster(): React.ReactNode {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed top-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          className={`toast-in pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${STYLES[toast.kind]}`}
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
        </div>
      ))}
    </div>
  );
}
