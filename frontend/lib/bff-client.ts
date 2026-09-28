import { ensureCsrfToken } from './csrf';

export interface BffResult {
  status: number;
  message: string;
}

// POSTs through the BFF with the double-submit CSRF header. Backend messages
// are shown verbatim — they are already written for users in pt-BR.
export async function bffPost(path: string, body: unknown): Promise<BffResult> {
  return bffWrite('POST', path, body);
}

// PATCH through the BFF with the double-submit CSRF header (account, password).
export async function bffPatch(path: string, body: unknown): Promise<BffResult> {
  return bffWrite('PATCH', path, body);
}

async function bffWrite(method: 'POST' | 'PATCH', path: string, body: unknown): Promise<BffResult> {
  let response: Response;
  try {
    const csrf = await ensureCsrfToken();
    response = await fetch(path, {
      method,
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
      body: JSON.stringify(body),
    });
  } catch {
    return { status: 0, message: 'Serviço indisponível. Tente novamente.' };
  }
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { status: response.status, message: readMessage(payload) };
}

export function readMessage(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (typeof message === 'string' && message !== '') return message;
    if (Array.isArray(message)) {
      const lines = message.filter((line): line is string => typeof line === 'string');
      if (lines.length > 0) return lines.join(' ');
    }
  }
  return 'Algo não saiu como esperado. Tente novamente.';
}
