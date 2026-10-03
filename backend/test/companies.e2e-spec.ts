// Companies journeys over HTTP — admin CRUD, public listing for everyone.
//
// Companies are the root of the domain: documents will belong to them, so this
// slice proves the root exists before anything hangs off it. No promotion path
// exists by design, so the suite provisions its admin the way production does —
// outside the product, straight into the database.

import type { ChildProcess } from 'node:child_process';
import { api, bootTestApp, db, findMail, mailQueue, postWithCsrf, provisionAdmin, stopTestApp, tokenFromLink } from './test-app';

let app: ChildProcess | undefined;

const ADMIN = { email: 'admin@case.local', password: 'Admin@123' };

const COMPANY = {
  name: 'Empresa Exemplo S.A.',
  judicialAdmin: 'Case Administração Judicial',
  judge: 'Juiz de Direito Titular',
  nature: 'Recuperação Judicial',
  processNumber: '1234567-89.2024.8.11.0000',
  protocolDate: '2024-03-15',
  author: 'Autor do Processo',
  comarca: 'Comarca de Cuiabá - 1ª Vara Cível',
  observations: 'Observações do caso para a equipe',
};

beforeAll(async () => {
  app = await bootTestApp();
}, 60000);

afterAll(async () => {
  await stopTestApp(app);
});

beforeEach(async () => {
  // documents is listed before companies so the truncate respects the FK
  // without CASCADE.
  await db.query('TRUNCATE TABLE email_tokens, sessions, documents, users, companies');
  mailQueue.length = 0;
  await provisionAdmin();
});

async function adminCookies(ip: string): Promise<Record<string, string>> {
  const login = await postWithCsrf('/auth/login', ADMIN, ip);
  expect(login.status).toBe(200);
  return login.cookies;
}

async function creditorCookies(ip: string, email: string): Promise<Record<string, string>> {
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

async function createCompany(ip: string, body: unknown = COMPANY): Promise<string> {
  const cookies = await adminCookies(ip);
  const response = await api('POST', '/companies', { body, cookies, ip });
  expect(response.status).toBe(201);
  return (response.body as { id: string }).id;
}

describe('GET /companies', () => {
  it('returns an empty list when nothing is registered', async () => {
    const response = await api('GET', '/companies', { ip: '203.0.113.181' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('lists companies to a visitor with no session', async () => {
    await createCompany('203.0.113.182');

    const response = await api('GET', '/companies', { ip: '203.0.113.183' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        name: 'Empresa Exemplo S.A.',
        nature: 'Recuperação Judicial',
        processNumber: '1234567-89.2024.8.11.0000',
      }),
    ]);
  });

  it('filters by nature and searches by name or process number', async () => {
    const cookies = await adminCookies('203.0.113.184');
    await api('POST', '/companies', { body: COMPANY, cookies, ip: '203.0.113.184' });
    await api('POST', '/companies', {
      body: { ...COMPANY, name: 'Outra Falida Ltda', nature: 'Falência', processNumber: '999/2024' },
      cookies,
      ip: '203.0.113.184',
    });

    const falencia = await api('GET', '/companies?nature=falencia', { ip: '203.0.113.184' });
    expect((falencia.body as unknown[]).map((c) => (c as { name: string }).name)).toEqual([
      'Outra Falida Ltda',
    ]);

    const byName = await api('GET', '/companies?search=exemplo', { ip: '203.0.113.184' });
    expect((byName.body as unknown[]).map((c) => (c as { name: string }).name)).toEqual([
      'Empresa Exemplo S.A.',
    ]);

    const byProcess = await api('GET', '/companies?search=999/2024', { ip: '203.0.113.184' });
    expect((byProcess.body as unknown[]).map((c) => (c as { name: string }).name)).toEqual([
      'Outra Falida Ltda',
    ]);
  });

  // Multi-valued query params must not reach the query builder: Express parses
  // ?nature[]=x into an array, and an array is never a valid filter.
  it('rejects multi-valued filters with 400 instead of crashing', async () => {
    const nature = await api('GET', '/companies?nature=rj&nature=falencia', {
      ip: '203.0.113.184',
    });
    expect(nature.status).toBe(400);

    const search = await api('GET', '/companies?search=a&search=b', { ip: '203.0.113.184' });
    expect(search.status).toBe(400);
  });
});

describe('GET /companies/:id', () => {
  it('returns the full case file to a visitor', async () => {
    const id = await createCompany('203.0.113.185');

    const response = await api('GET', `/companies/${id}`, { ip: '203.0.113.186' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id,
        name: 'Empresa Exemplo S.A.',
        judicialAdmin: 'Case Administração Judicial',
        judge: 'Juiz de Direito Titular',
        nature: 'Recuperação Judicial',
        processNumber: '1234567-89.2024.8.11.0000',
        protocolDate: '2024-03-15',
        author: 'Autor do Processo',
        comarca: 'Comarca de Cuiabá - 1ª Vara Cível',
        observations: 'Observações do caso para a equipe',
      }),
    );
  });

  it('answers 404 for an unknown company', async () => {
    const response = await api('GET', '/companies/clx0000000000000000000000', {
      ip: '203.0.113.187',
    });

    expect(response.status).toBe(404);
  });
});

describe('POST /companies', () => {
  it('refuses an unauthenticated caller', async () => {
    const response = await postWithCsrf('/companies', COMPANY, '203.0.113.188');

    expect(response.status).toBe(401);
  });

  it('refuses an authenticated creditor', async () => {
    const cookies = await creditorCookies('203.0.113.189', 'credor@case.com');

    const response = await api('POST', '/companies', { body: COMPANY, cookies, ip: '203.0.113.189' });

    expect(response.status).toBe(403);
  });

  it('rejects invalid input with PT-BR messages', async () => {
    const cookies = await adminCookies('203.0.113.190');

    const missing = await api('POST', '/companies', { body: {}, cookies, ip: '203.0.113.190' });
    expect(missing.status).toBe(400);

    const long = await api('POST', '/companies', {
      body: { ...COMPANY, name: 'x'.repeat(301) },
      cookies,
      ip: '203.0.113.190',
    });
    expect(long.status).toBe(400);

    const charset = await api('POST', '/companies', {
      body: { ...COMPANY, processNumber: '123 (fraude)' },
      cookies,
      ip: '203.0.113.190',
    });
    expect(charset.status).toBe(400);

    const nature = await api('POST', '/companies', {
      body: { ...COMPANY, nature: 'Concordata' },
      cookies,
      ip: '203.0.113.190',
    });
    expect(nature.status).toBe(400);

    const date = await api('POST', '/companies', {
      body: { ...COMPANY, protocolDate: '15/03/2024' },
      cookies,
      ip: '203.0.113.190',
    });
    expect(date.status).toBe(400);
  });

  it('creates the company and stores it', async () => {
    const id = await createCompany('203.0.113.191');

    const { rows } = await db.query('SELECT name, nature FROM companies WHERE id = $1', [id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Empresa Exemplo S.A.');
    expect(rows[0].nature).toBe('RECUPERACAO_JUDICIAL');
  });

  it('refuses a second company with the same process number', async () => {
    await createCompany('203.0.113.192');
    const cookies = await adminCookies('203.0.113.192');

    const response = await api('POST', '/companies', { body: COMPANY, cookies, ip: '203.0.113.192' });

    expect(response.status).toBe(409);
    expect((response.body as { message: string }).message).toBe(
      'Já existe uma empresa com este número de processo.',
    );
  });
});

describe('PUT /companies/:id', () => {
  it('refuses visitors and creditors', async () => {
    const id = await createCompany('203.0.113.192');

    const anonymous = await api('PUT', `/companies/${id}`, {
      body: COMPANY,
      ip: '203.0.113.193',
    });
    expect(anonymous.status).toBe(401);

    const creditor = await creditorCookies('203.0.113.194', 'outro@case.com');
    const forbidden = await api('PUT', `/companies/${id}`, {
      body: COMPANY,
      cookies: creditor,
      ip: '203.0.113.194',
    });
    expect(forbidden.status).toBe(403);
  });

  it('answers 404 for an unknown company', async () => {
    const cookies = await adminCookies('203.0.113.195');

    const response = await api('PUT', '/companies/clx0000000000000000000000', {
      body: COMPANY,
      cookies,
      ip: '203.0.113.195',
    });

    expect(response.status).toBe(404);
  });

  it('updates every field, including a nature change of tab', async () => {
    const cookies = await adminCookies('203.0.113.196');
    const created = await api('POST', '/companies', { body: COMPANY, cookies, ip: '203.0.113.196' });
    const id = (created.body as { id: string }).id;

    const updated = await api('PUT', `/companies/${id}`, {
      body: { ...COMPANY, name: 'Empresa Renomeada S.A.', nature: 'Falência' },
      cookies,
      ip: '203.0.113.196',
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual(
      expect.objectContaining({ name: 'Empresa Renomeada S.A.', nature: 'Falência' }),
    );

    const rj = await api('GET', '/companies?nature=recuperacao-judicial', { ip: '203.0.113.196' });
    expect(rj.body).toEqual([]);
    const falencia = await api('GET', '/companies?nature=falencia', { ip: '203.0.113.196' });
    expect((falencia.body as unknown[])).toHaveLength(1);
  });
});

describe('DELETE /companies/:id', () => {
  it('refuses visitors and creditors', async () => {
    const id = await createCompany('203.0.113.197');

    const anonymous = await api('DELETE', `/companies/${id}`, { ip: '203.0.113.198' });
    expect(anonymous.status).toBe(401);

    const creditor = await creditorCookies('203.0.113.199', 'dono@case.com');
    const forbidden = await api('DELETE', `/companies/${id}`, {
      cookies: creditor,
      ip: '203.0.113.199',
    });
    expect(forbidden.status).toBe(403);
  });

  it('answers 404 for an unknown company', async () => {
    const cookies = await adminCookies('203.0.113.200');

    const response = await api('DELETE', '/companies/clx0000000000000000000000', {
      cookies,
      ip: '203.0.113.200',
    });

    expect(response.status).toBe(404);
  });

  it('removes the company for good', async () => {
    const cookies = await adminCookies('203.0.113.201');
    const created = await api('POST', '/companies', { body: COMPANY, cookies, ip: '203.0.113.201' });
    const id = (created.body as { id: string }).id;

    const deleted = await api('DELETE', `/companies/${id}`, { cookies, ip: '203.0.113.201' });
    expect(deleted.status).toBe(204);

    const gone = await api('GET', `/companies/${id}`, { ip: '203.0.113.201' });
    expect(gone.status).toBe(404);
    const { rows } = await db.query('SELECT id FROM companies WHERE id = $1', [id]);
    expect(rows).toHaveLength(0);
  });
});
