// Account journeys over HTTP — profile and password change.
//
// The last backend slice: everything here assumes a session, both roles.
// Password change keeps the current session alive while ending every other
// one, so the suite holds two sessions and watches exactly one survive.

import type { ChildProcess } from 'node:child_process';
import {
  api,
  bootTestApp,
  db,
  findMail,
  mailQueue,
  postWithCsrf,
  stopTestApp,
  tokenFromLink,
} from './test-app';

let app: ChildProcess | undefined;

beforeAll(async () => {
  app = await bootTestApp();
}, 60000);

afterAll(async () => {
  await stopTestApp(app);
});

beforeEach(async () => {
  await db.query('TRUNCATE TABLE email_tokens, sessions, documents, users, companies');
  mailQueue.length = 0;
});

async function verifiedCookies(ip: string, email: string): Promise<Record<string, string>> {
  await postWithCsrf(
    '/auth/register',
    { name: 'Credor Teste', email, password: 'Segura@123', passwordConfirmation: 'Segura@123' },
    ip,
  );
  const { link } = await findMail(email);
  await api('GET', `/auth/verify-email?token=${tokenFromLink(link)}`, { ip });
  mailQueue.length = 0;
  const login = await postWithCsrf('/auth/login', { email, password: 'Segura@123' }, ip);
  expect(login.status).toBe(200);
  return login.cookies;
}

describe('GET /account', () => {
  it('returns the caller’s profile', async () => {
    const cookies = await verifiedCookies('203.0.113.301', 'perfil@case.com');

    const response = await api('GET', '/account', { cookies, ip: '203.0.113.301' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'Credor Teste',
        email: 'perfil@case.com',
        role: 'CREDITOR',
        emailVerified: true,
      }),
    );
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('refuses a visitor', async () => {
    const response = await api('GET', '/account', { ip: '203.0.113.302' });

    expect(response.status).toBe(401);
  });
});

describe('PATCH /account', () => {
  it('updates the name', async () => {
    const cookies = await verifiedCookies('203.0.113.303', 'nome@case.com');

    const response = await api('PATCH', '/account', {
      body: { name: 'Novo Nome' },
      cookies,
      ip: '203.0.113.303',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ name: 'Novo Nome' }));
  });

  it('updates the e-mail lowercased and requires re-verification', async () => {
    const cookies = await verifiedCookies('203.0.113.304', 'antigo@case.com');

    const response = await api('PATCH', '/account', {
      body: { email: 'NOVO@Case.COM' },
      cookies,
      ip: '203.0.113.304',
    });

    expect(response.status).toBe(200);
    const { rows } = await db.query('SELECT email, email_verified FROM users');
    expect(rows[0].email).toBe('novo@case.com');
    expect(rows[0].email_verified).toBe(false);
    const mail = await findMail('novo@case.com');
    expect(mail.link).toContain('token=');
  });

  it('refuses a taken e-mail and invalid input', async () => {
    await verifiedCookies('203.0.113.305', 'ocupado@case.com');
    const cookies = await verifiedCookies('203.0.113.305', 'livre@case.com');

    const taken = await api('PATCH', '/account', {
      body: { email: 'ocupado@case.com' },
      cookies,
      ip: '203.0.113.305',
    });
    expect(taken.status).toBe(409);

    const badName = await api('PATCH', '/account', {
      body: { name: 'AB' },
      cookies,
      ip: '203.0.113.305',
    });
    expect(badName.status).toBe(400);

    const badEmail = await api('PATCH', '/account', {
      body: { email: 'não-é-email' },
      cookies,
      ip: '203.0.113.305',
    });
    expect(badEmail.status).toBe(400);
  });

  it('answers an unchanged profile without writing', async () => {
    const cookies = await verifiedCookies('203.0.113.306', 'mesmo@case.com');

    const response = await api('PATCH', '/account', {
      body: {},
      cookies,
      ip: '203.0.113.306',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ email: 'mesmo@case.com' }));
  });

  it('refuses a visitor', async () => {
    const response = await api('PATCH', '/account', {
      body: { name: 'Qualquer Nome' },
      ip: '203.0.113.307',
    });

    expect(response.status).toBe(401);
  });
});

describe('PATCH /account/password', () => {
  it('changes the password and keeps only the current session', async () => {
    const first = await verifiedCookies('203.0.113.311', 'senha@case.com');
    const second = await postWithCsrf(
      '/auth/login',
      { email: 'senha@case.com', password: 'Segura@123' },
      '203.0.113.311',
    );
    expect(second.status).toBe(200);

    const changed = await api('PATCH', '/account/password', {
      body: {
        currentPassword: 'Segura@123',
        password: 'Nova@Senha9',
        passwordConfirmation: 'Nova@Senha9',
      },
      cookies: first,
      ip: '203.0.113.311',
    });
    expect(changed.status).toBe(200);

    const oldLogin = await postWithCsrf(
      '/auth/login',
      { email: 'senha@case.com', password: 'Segura@123' },
      '203.0.113.311',
    );
    expect(oldLogin.status).toBe(401);

    const currentRefresh = await api('POST', '/auth/refresh', {
      cookies: { refresh_token: first.refresh_token },
      ip: '203.0.113.311',
    });
    expect(currentRefresh.status).toBe(200);

    const otherRefresh = await api('POST', '/auth/refresh', {
      cookies: { refresh_token: second.cookies.refresh_token },
      ip: '203.0.113.311',
    });
    expect(otherRefresh.status).toBe(401);
  });

  it('refuses a wrong current password, an equal one and a mismatch', async () => {
    const cookies = await verifiedCookies('203.0.113.312', 'erros@case.com');

    const wrong = await api('PATCH', '/account/password', {
      body: {
        currentPassword: 'Errada@123',
        password: 'Nova@Senha9',
        passwordConfirmation: 'Nova@Senha9',
      },
      cookies,
      ip: '203.0.113.312',
    });
    expect(wrong.status).toBe(400);
    expect(JSON.stringify(wrong.body)).toMatch(/atual incorreta/);

    const equal = await api('PATCH', '/account/password', {
      body: {
        currentPassword: 'Segura@123',
        password: 'Segura@123',
        passwordConfirmation: 'Segura@123',
      },
      cookies,
      ip: '203.0.113.312',
    });
    expect(equal.status).toBe(400);
    expect(JSON.stringify(equal.body)).toMatch(/diferente da atual/);

    const mismatch = await api('PATCH', '/account/password', {
      body: {
        currentPassword: 'Segura@123',
        password: 'Nova@Senha9',
        passwordConfirmation: 'Outra@Senha9',
      },
      cookies,
      ip: '203.0.113.312',
    });
    expect(mismatch.status).toBe(400);

    const weak = await api('PATCH', '/account/password', {
      body: { currentPassword: 'Segura@123', password: 'weak', passwordConfirmation: 'weak' },
      cookies,
      ip: '203.0.113.312',
    });
    expect(weak.status).toBe(400);
  });

  it('refuses a visitor', async () => {
    const response = await api('PATCH', '/account/password', {
      body: {
        currentPassword: 'Segura@123',
        password: 'Nova@Senha9',
        passwordConfirmation: 'Nova@Senha9',
      },
      ip: '203.0.113.313',
    });

    expect(response.status).toBe(401);
  });
});
