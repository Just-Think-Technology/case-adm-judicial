// Tiny toast bus: any component reports user-facing feedback with one call,
// and the <Toaster/> host in the layout renders it top-right. No context, so
// unit tests never need a provider — unrendered toasts simply sit in the store.
export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

type Listener = (toasts: Toast[]) => void;

const DISMISS_AFTER_MS = 8000;

let sequence = 0;
let current: Toast[] = [];
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener([...current]);
}

export function notifyToast(kind: ToastKind, text: string): number {
  sequence += 1;
  const toast: Toast = { id: sequence, kind, text };
  current = [...current.slice(-3), toast];
  emit();
  const id = toast.id;
  setTimeout(() => dismissToast(id), DISMISS_AFTER_MS);
  return id;
}

export function dismissToast(id: number): void {
  if (!current.some((toast) => toast.id === id)) return;
  current = current.filter((toast) => toast.id !== id);
  emit();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener([...current]);
  return () => {
    listeners.delete(listener);
  };
}
