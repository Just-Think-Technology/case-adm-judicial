// Shared HTTP-suite harness — boot the built app, drive it, read its mail.
//
// The second suite that needs a booted app extracts this instead of copying it
// (second-use rule): one home for spawning dist/, parsing its stdout and
// speaking HTTP like a browser. Suites run with --runInBand, so the single
// fixed port is never contended.

import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { Pool } from 'pg';

export const PORT = Number(process.env.AUTH_E2E_PORT ?? 3399);
export const BASE = `http://localhost:${PORT}`;
const ORIGIN = 'http://localhost:3399';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set to run the e2e suite`);
  return value;
}

/** Owner connection: assertions and setup that the app role cannot do. */
export const db = new Pool({ connectionString: requireEnv('DIRECT_URL') });

export interface ApiResponse {
  status: number;
  body: unknown;
  cookies: Record<string, string>;
}

function parseCookies(setCookie: string[] | null): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const header of setCookie ?? []) {
    const [pair] = header.split(';');
    const index = pair.indexOf('=');
    if (index > 0) jar[pair.slice(0, index).trim()] = pair.slice(index + 1);
  }
  return jar;
}

export async function api(
  method: string,
  path: string,
  options: {
    body?: unknown;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
    ip?: string;
  } = {},
): Promise<ApiResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.ip ? { 'X-Forwarded-For': options.ip } : {}),
    ...options.headers,
  };
  // State-changing requests always carry an Origin, like a browser would.
  if (method !== 'GET' && !headers.Origin) headers.Origin = ORIGIN;
  if (options.cookies && Object.keys(options.cookies).length > 0) {
    headers.Cookie = Object.entries(options.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null),
    cookies: parseCookies(response.headers.getSetCookie()),
  };
}

export async function csrf(ip: string): Promise<{ token: string; cookies: Record<string, string> }> {
  const response = await api('GET', '/auth/csrf-token', { ip });
  expect(response.status).toBe(200);
  const token = (response.body as { token: string }).token;
  expect(token).toMatch(/^[0-9a-f]{64}$/);
  return { token, cookies: response.cookies };
}

export async function postWithCsrf(
  path: string,
  body: unknown,
  ip: string,
  cookies: Record<string, string> = {},
): Promise<ApiResponse> {
  const { token, cookies: csrfCookies } = await csrf(ip);
  return api('POST', path, {
    body,
    ip,
    cookies: { ...cookies, ...csrfCookies },
    headers: { 'x-csrf-token': token },
  });
}

export interface TestMail {
  to: string;
  link: string;
}

export const mailQueue: TestMail[] = [];

export async function findMail(to: string, timeoutMs = 8000): Promise<TestMail> {
  const started = Date.now();
  for (;;) {
    const found = mailQueue.find((m) => m.to === to);
    if (found) return found;
    if (Date.now() - started > timeoutMs) throw new Error(`no e-mail captured for ${to}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export function tokenFromLink(link: string): string {
  return new URL(link).searchParams.get('token') ?? '';
}

async function waitForHealth(): Promise<void> {
  const started = Date.now();
  for (;;) {
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() - started > 30000) throw new Error('backend did not boot in time');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

/** Boots dist/main.js with the suite's env and returns the child process. */
export async function bootTestApp(): Promise<ChildProcess> {
  const app = spawn('node', [join(__dirname, '..', 'dist', 'main.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  app.stdout?.on('data', (chunk: Buffer) => {
    // Nest prefixes every line ([Nest] pid — timestamp LOG [context]) with ANSI
    // colors, which have no whitespace — a (\S+) capture would swallow the
    // trailing reset code into the token and break its hash. Stripping first
    // keeps the capture plain. The control escape below is deliberate, which
    // is why the rule is disabled on this line only.
    // eslint-disable-next-line no-control-regex
    const ansiEscape = /\x1b\[[0-9;]*m/g;
    for (const raw of chunk.toString().split('\n')) {
      const line = raw.replace(ansiEscape, '');
      const match = /test-mail: to=(\S+) link=(\S+)/.exec(line);
      if (match) mailQueue.push({ to: match[1], link: match[2] });
    }
  });
  await waitForHealth();
  return app;
}

/** Stops the booted app and releases the owner pool. */
export async function stopTestApp(app: ChildProcess | undefined): Promise<void> {
  app?.kill('SIGTERM');
  await db.end();
}
