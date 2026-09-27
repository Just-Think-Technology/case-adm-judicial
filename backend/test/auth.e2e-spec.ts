// Auth journeys over HTTP — the built app, a real database, no mocks.
//
// The app boots from dist/ (pnpm --filter backend build first) with NODE_ENV=test:
// storage bootstrap is skipped and the mailer logs links to stdout instead of
// sending, so the suite extracts verification tokens the way a user would click
// them. Each group uses its own source IP because throttle budgets key by address.

import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { Pool } from 'pg';

const PORT = Number(process.env.AUTH_E2E_PORT ?? 3399);
const BASE = `http://localhost:${PORT}`;
const ORIGIN = 'http://localhost:3399';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set to run the auth e2e suite`);
  return value;
}

const db = new Pool({ connectionString: requireEnv('DIRECT_URL') });

interface ApiResponse {
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

async function api(
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
  if (options.cookies && Object.keys(options.cookies).length > 0) {
    headers.Cookie = Object.entries(options.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
  // State-changing requests always carry an Origin, like a browser would.
  if (method !== 'GET' && !headers.Origin) headers.Origin = ORIGIN;

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

async function csrf(ip: string): Promise<{ token: string; cookies: Record<string, string> }> {
  const response = await api('GET', '/auth/csrf-token', { ip });
  expect(response.status).toBe(200);
  const token = (response.body as { token: string }).token;
  expect(token).toMatch(/^[0-9a-f]{64}$/);
  return { token, cookies: response.cookies };
}

async function postWithCsrf(
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

interface TestMail {
  to: string;
  link: string;
}

const mailQueue: TestMail[] = [];

async function findMail(to: string, timeoutMs = 8000): Promise<TestMail> {
  const started = Date.now();
  for (;;) {
    const found = mailQueue.find((m) => m.to === to);
    if (found) return found;
    if (Date.now() - started > timeoutMs) throw new Error(`no e-mail captured for ${to}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function tokenFromLink(link: string): string {
  return new URL(link).searchParams.get('token') ?? '';
}

let app: ChildProcess | undefined;

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

beforeAll(async () => {
  app = spawn('node', [join(__dirname, '..', 'dist', 'main.js')], {
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
}, 60000);

afterAll(async () => {
  app?.kill('SIGTERM');
  await db.end();
});

beforeEach(async () => {
  // documents references users but auth never writes there — listing it keeps
  // the truncate valid without CASCADE wiping anything else.
  await db.query('TRUNCATE TABLE email_tokens, sessions, documents, users');
  mailQueue.length = 0;
});

const REGISTER = {
  name: 'Maria da Silva',
  email: 'maria@case.com',
  password: 'Segura@123',
  passwordConfirmation: 'Segura@123',
};

describe('POST /auth/register', () => {
  it('creates an unverified creditor without logging in', async () => {
    const response = await postWithCsrf('/auth/register', REGISTER, '203.0.113.101');

    expect(response.status).toBe(201);
    expect(response.cookies.access_token).toBeUndefined();
    const { rows } = await db.query('SELECT email, role, email_verified, registration_ip, password_hash FROM users');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email: 'maria@case.com',
      role: 'CREDITOR',
      email_verified: false,
      registration_ip: '203.0.113.101',
    });
    expect(rows[0].password_hash).not.toContain('Segura@123');
    expect(rows[0].password_hash).toMatch(/^\$argon2id\$/);
  });

  it('sends the verification e-mail', async () => {
    await postWithCsrf('/auth/register', REGISTER, '203.0.113.102');

    const mail = await findMail('maria@case.com');
    expect(mail.link).toContain('token=');
  });

  it('refuses a duplicate e-mail with the specific message', async () => {
    await postWithCsrf('/auth/register', REGISTER, '203.0.113.103');
    const response = await postWithCsrf('/auth/register', REGISTER, '203.0.113.104');

    expect(response.status).toBe(409);
    expect(JSON.stringify(response.body)).toMatch(/já está cadastrado/);
  });

  it('refuses the third account from the same address', async () => {
    await postWithCsrf('/auth/register', { ...REGISTER, email: 'a@case.com' }, '203.0.113.105');
    await postWithCsrf('/auth/register', { ...REGISTER, email: 'b@case.com' }, '203.0.113.105');
    const response = await postWithCsrf('/auth/register', { ...REGISTER, email: 'c@case.com' }, '203.0.113.105');

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.body)).toMatch(/número máximo/);
  });

  it('rejects invalid input with PT-BR messages', async () => {
    const response = await postWithCsrf(
      '/auth/register',
      { name: 'Ana', email: 'not-an-email', password: 'weak', passwordConfirmation: 'diff' },
      '203.0.113.106',
    );

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).not.toMatch(/internal|Internal|stack/i);
  });

  it('throttles the sixth attempt from one address', async () => {
    for (let i = 0; i < 5; i += 1) {
      await postWithCsrf('/auth/register', REGISTER, '203.0.113.107');
    }
    const response = await postWithCsrf('/auth/register', REGISTER, '203.0.113.107');

    expect(response.status).toBe(429);
  });
});

describe('GET /auth/verify-email', () => {
  it('verifies the account through the mailed link', async () => {
    await postWithCsrf('/auth/register', REGISTER, '203.0.113.111');
    const { link } = await findMail('maria@case.com');

    const response = await api('GET', `/auth/verify-email?token=${tokenFromLink(link)}`, {
      ip: '203.0.113.111',
    });

    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).toMatch(/verificado com sucesso/);
    const { rows } = await db.query('SELECT email_verified FROM users');
    expect(rows[0].email_verified).toBe(true);
  });

  it('rejects a tampered link', async () => {
    const response = await api('GET', '/auth/verify-email?token=not-a-real-token', {
      ip: '203.0.113.112',
    });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toMatch(/não é válido/);
  });

  it('rejects a reused link', async () => {
    await postWithCsrf('/auth/register', REGISTER, '203.0.113.113');
    const { link } = await findMail('maria@case.com');
    const token = tokenFromLink(link);
    await api('GET', `/auth/verify-email?token=${token}`, { ip: '203.0.113.113' });

    const response = await api('GET', `/auth/verify-email?token=${token}`, { ip: '203.0.113.113' });

    expect(response.status).toBe(400);
  });
});

describe('POST /auth/verification-notification', () => {
  it('resends to an unverified address', async () => {
    await postWithCsrf('/auth/register', REGISTER, '203.0.113.121');
    await findMail('maria@case.com');
    // The registration mail counts as a send: age it past the cooldown to
    // simulate the user waiting, instead of weakening the rule for the test.
    await db.query(
      "UPDATE email_tokens SET created_at = NOW() - INTERVAL '6 minutes' WHERE type = 'VERIFICATION'",
    );
    mailQueue.length = 0;

    const response = await postWithCsrf(
      '/auth/verification-notification',
      { email: 'maria@case.com' },
      '203.0.113.121',
    );

    expect(response.status).toBe(200);
    await findMail('maria@case.com');
  });

  it('enforces the five-minute cooldown per user', async () => {
    await postWithCsrf('/auth/register', REGISTER, '203.0.113.122');
    await postWithCsrf('/auth/verification-notification', { email: 'maria@case.com' }, '203.0.113.122');

    const response = await postWithCsrf(
      '/auth/verification-notification',
      { email: 'maria@case.com' },
      '203.0.113.122',
    );

    expect(response.status).toBe(429);
  });

  it('never reveals whether an address exists or is verified', async () => {
    await postWithCsrf('/auth/register', REGISTER, '203.0.113.123');
    const { link } = await findMail('maria@case.com');
    await api('GET', `/auth/verify-email?token=${tokenFromLink(link)}`, { ip: '203.0.113.123' });

    const unknown = await postWithCsrf(
      '/auth/verification-notification',
      { email: 'nobody@case.com' },
      '203.0.113.123',
    );
    const verified = await postWithCsrf(
      '/auth/verification-notification',
      { email: 'maria@case.com' },
      '203.0.113.124',
    );

    expect(unknown.status).toBe(verified.status);
    expect(JSON.stringify(unknown.body)).toBe(JSON.stringify(verified.body));
  });
});

describe('POST /auth/login', () => {
  async function registeredVerified(ip: string, email = 'maria@case.com'): Promise<void> {
    await postWithCsrf('/auth/register', { ...REGISTER, email }, ip);
    const { link } = await findMail(email);
    await api('GET', `/auth/verify-email?token=${tokenFromLink(link)}`, { ip });
    mailQueue.length = 0;
  }

  it('logs a verified creditor in and sets both cookies', async () => {
    await registeredVerified('203.0.113.131');
    const response = await postWithCsrf(
      '/auth/login',
      { email: 'maria@case.com', password: 'Segura@123' },
      '203.0.113.131',
    );

    expect(response.status).toBe(200);
    expect(response.cookies.access_token).toBeDefined();
    expect(response.cookies.refresh_token).toBeDefined();
  });

  it('blocks an unverified account with the resend hint', async () => {
    await postWithCsrf('/auth/register', REGISTER, '203.0.113.132');
    const response = await postWithCsrf(
      '/auth/login',
      { email: 'maria@case.com', password: 'Segura@123' },
      '203.0.113.132',
    );

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.body)).toMatch(/validar o e-mail/);
    expect(response.cookies.access_token).toBeUndefined();
  });

  it('answers wrong password and unknown e-mail identically', async () => {
    await registeredVerified('203.0.113.133');
    const wrongPassword = await postWithCsrf(
      '/auth/login',
      { email: 'maria@case.com', password: 'Errada@123' },
      '203.0.113.133',
    );
    const unknownEmail = await postWithCsrf(
      '/auth/login',
      { email: 'fantasma@case.com', password: 'Errada@123' },
      '203.0.113.134',
    );

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(JSON.stringify(wrongPassword.body)).toBe(JSON.stringify(unknownEmail.body));
    expect(JSON.stringify(wrongPassword.body)).toMatch(/Credenciais inválidas/);
  });

  it('throttles the eleventh attempt for one IP and e-mail', async () => {
    await registeredVerified('203.0.113.135');
    for (let i = 0; i < 10; i += 1) {
      await postWithCsrf(
        '/auth/login',
        { email: 'maria@case.com', password: 'Errada@123' },
        '203.0.113.135',
      );
    }
    const response = await postWithCsrf(
      '/auth/login',
      { email: 'maria@case.com', password: 'Errada@123' },
      '203.0.113.135',
    );

    expect(response.status).toBe(429);
  });

  it('keeps a separate budget per e-mail on the same address', async () => {
    await registeredVerified('203.0.113.136');
    await registeredVerified('203.0.113.136', 'outra@case.com');
    for (let i = 0; i < 10; i += 1) {
      await postWithCsrf(
        '/auth/login',
        { email: 'maria@case.com', password: 'Errada@123' },
        '203.0.113.136',
      );
    }
    const response = await postWithCsrf(
      '/auth/login',
      { email: 'outra@case.com', password: 'Segura@123' },
      '203.0.113.136',
    );

    expect(response.status).toBe(200);
  });
});

describe('POST /auth/forgot-password + /auth/reset-password', () => {
  async function registeredVerified(ip: string): Promise<void> {
    await postWithCsrf('/auth/register', REGISTER, ip);
    const { link } = await findMail('maria@case.com');
    await api('GET', `/auth/verify-email?token=${tokenFromLink(link)}`, { ip });
    mailQueue.length = 0;
  }

  it('sends the reset link to a known address', async () => {
    await registeredVerified('203.0.113.141');
    const response = await postWithCsrf(
      '/auth/forgot-password',
      { email: 'maria@case.com' },
      '203.0.113.141',
    );

    expect(response.status).toBe(200);
    const mail = await findMail('maria@case.com');
    expect(mail.link).toContain('token=');
  });

  it('resets through the mailed link and invalidates the old password', async () => {
    await registeredVerified('203.0.113.142');
    await postWithCsrf('/auth/forgot-password', { email: 'maria@case.com' }, '203.0.113.142');
    const { link } = await findMail('maria@case.com');

    const reset = await postWithCsrf(
      '/auth/reset-password',
      { token: tokenFromLink(link), password: 'Nova@456', passwordConfirmation: 'Nova@456' },
      '203.0.113.142',
    );
    expect(reset.status).toBe(200);

    const oldLogin = await postWithCsrf(
      '/auth/login',
      { email: 'maria@case.com', password: 'Segura@123' },
      '203.0.113.142',
    );
    const newLogin = await postWithCsrf(
      '/auth/login',
      { email: 'maria@case.com', password: 'Nova@456' },
      '203.0.113.142',
    );
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  // Racing resets are the dangerous version of a double click: two requests that
  // both read the link as valid, where the loser's write must not survive.
  // Hashing the new password runs before the transaction, which is what makes
  // the window real here — without the conditional consume this test returns
  // two 200s instead of failing, so it is not a tautology.
  it('lets only one of two simultaneous resets through', async () => {
    await registeredVerified('203.0.113.150');
    await postWithCsrf('/auth/forgot-password', { email: 'maria@case.com' }, '203.0.113.150');
    const { link } = await findMail('maria@case.com');
    const token = tokenFromLink(link);
    const body = { token, password: 'Nova@456', passwordConfirmation: 'Nova@456' };

    const [first, second] = await Promise.all([
      postWithCsrf('/auth/reset-password', body, '203.0.113.150'),
      postWithCsrf('/auth/reset-password', body, '203.0.113.150'),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 400]);
  });

  it('rejects a reused reset link', async () => {
    await registeredVerified('203.0.113.143');
    await postWithCsrf('/auth/forgot-password', { email: 'maria@case.com' }, '203.0.113.143');
    const { link } = await findMail('maria@case.com');
    const token = tokenFromLink(link);
    await postWithCsrf(
      '/auth/reset-password',
      { token, password: 'Nova@456', passwordConfirmation: 'Nova@456' },
      '203.0.113.143',
    );

    const response = await postWithCsrf(
      '/auth/reset-password',
      { token, password: 'Outra@789', passwordConfirmation: 'Outra@789' },
      '203.0.113.143',
    );

    expect(response.status).toBe(400);
  });

  it('rejects a weak replacement password', async () => {
    await registeredVerified('203.0.113.144');
    await postWithCsrf('/auth/forgot-password', { email: 'maria@case.com' }, '203.0.113.144');
    const { link } = await findMail('maria@case.com');

    const response = await postWithCsrf(
      '/auth/reset-password',
      { token: tokenFromLink(link), password: 'weak', passwordConfirmation: 'weak' },
      '203.0.113.144',
    );

    expect(response.status).toBe(400);
  });
});

describe('POST /auth/refresh + /auth/logout', () => {
  async function loggedIn(ip: string): Promise<Record<string, string>> {
    await postWithCsrf('/auth/register', REGISTER, ip);
    const { link } = await findMail('maria@case.com');
    await api('GET', `/auth/verify-email?token=${tokenFromLink(link)}`, { ip });
    const login = await postWithCsrf(
      '/auth/login',
      { email: 'maria@case.com', password: 'Segura@123' },
      ip,
    );
    return login.cookies;
  }

  it('rotates the refresh token and revokes the used row', async () => {
    const cookies = await loggedIn('203.0.113.151');
    const response = await api('POST', '/auth/refresh', {
      ip: '203.0.113.151',
      cookies: { refresh_token: cookies.refresh_token },
    });

    expect(response.status).toBe(200);
    expect(response.cookies.refresh_token).toBeDefined();
    expect(response.cookies.refresh_token).not.toBe(cookies.refresh_token);
    const { rows } = await db.query('SELECT COUNT(*)::int AS revoked FROM sessions WHERE revoked_at IS NOT NULL');
    expect(rows[0].revoked).toBe(1);
  });

  it('treats a reused refresh token as theft and revokes everything', async () => {
    const cookies = await loggedIn('203.0.113.152');
    const rotated = await api('POST', '/auth/refresh', {
      ip: '203.0.113.152',
      cookies: { refresh_token: cookies.refresh_token },
    });
    expect(rotated.status).toBe(200);

    const replay = await api('POST', '/auth/refresh', {
      ip: '203.0.113.152',
      cookies: { refresh_token: cookies.refresh_token },
    });
    expect(replay.status).toBe(401);

    const afterTheft = await api('POST', '/auth/refresh', {
      ip: '203.0.113.152',
      cookies: { refresh_token: rotated.cookies.refresh_token },
    });
    expect(afterTheft.status).toBe(401);
  });

  it('logs out by revoking the current session', async () => {
    const cookies = await loggedIn('203.0.113.153');
    const logout = await api('POST', '/auth/logout', {
      ip: '203.0.113.153',
      cookies: { access_token: cookies.access_token },
    });
    expect(logout.status).toBe(200);

    const refresh = await api('POST', '/auth/refresh', {
      ip: '203.0.113.153',
      cookies: { refresh_token: cookies.refresh_token },
    });
    expect(refresh.status).toBe(401);
  });
});

describe('request guards', () => {
  it('refuses a login without the CSRF pair', async () => {
    const response = await api(
      'POST',
      '/auth/login',
      { body: { email: 'maria@case.com', password: 'Segura@123' }, ip: '203.0.113.161' },
    );

    expect(response.status).toBe(403);
  });

  it('refuses a login from a foreign origin', async () => {
    const { token, cookies } = await csrf('203.0.113.162');
    const response = await api('POST', '/auth/login', {
      body: { email: 'maria@case.com', password: 'Segura@123' },
      ip: '203.0.113.162',
      cookies,
      headers: { Origin: 'https://evil.example', 'x-csrf-token': token },
    });

    expect(response.status).toBe(403);
  });

  it('refuses a state-changing request with no origin at all', async () => {
    const { token, cookies } = await csrf('203.0.113.163');
    const headers: Record<string, string> = { 'x-csrf-token': token };
    const response = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '203.0.113.163',
        Cookie: Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
        ...headers,
      },
      body: JSON.stringify({ email: 'maria@case.com', password: 'Segura@123' }),
    });

    expect(response.status).toBe(403);
  });
});

describe('throttle keying', () => {
  async function sessionFor(ip: string, email: string): Promise<Record<string, string>> {
    await postWithCsrf('/auth/register', { ...REGISTER, email }, ip);
    const { link } = await findMail(email);
    await api('GET', `/auth/verify-email?token=${tokenFromLink(link)}`, { ip });
    mailQueue.length = 0;
    const login = await postWithCsrf('/auth/login', { email, password: 'Segura@123' }, ip);
    expect(login.status).toBe(200);
    return login.cookies;
  }

  // The decision keys by account when a session exists and by IP otherwise. The
  // global budget is the instrument: burning it as account A from one address
  // must still block account A from another address, while a second account on
  // the original address keeps its own budget. Without the identity resolver
  // ahead of the throttler, the 101st request from the new address would pass.
  it('follows the account across addresses instead of the address', async () => {
    const accountA = await sessionFor('203.0.113.171', 'conta-a@case.com');
    const accountB = await sessionFor('203.0.113.172', 'conta-b@case.com');

    for (let i = 0; i < 100; i++) {
      await api('GET', '/health', { cookies: accountA, ip: '203.0.113.171' });
    }

    const blockedElsewhere = await api('GET', '/health', {
      cookies: accountA,
      ip: '203.0.113.179',
    });
    expect(blockedElsewhere.status).toBe(429);

    const otherAccount = await api('GET', '/health', {
      cookies: accountB,
      ip: '203.0.113.171',
    });
    expect(otherAccount.status).toBe(200);
  }, 60000);
});
