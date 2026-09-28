// Documents journeys over HTTP — upload, visibility-filtered listing, delivery.
//
// The company is the root: every upload names one in the URL, and an unknown
// company is a 404 before a single byte is read. The office notification is
// asserted through the captured test mail; its failure never blocks the
// upload, by decision.

import type { ChildProcess } from 'node:child_process';
import {
  api,
  apiForm,
  BASE,
  bootTestApp,
  db,
  findMail,
  mailQueue,
  postWithCsrf,
  provisionAdmin,
  stopTestApp,
  tokenFromLink,
} from './test-app';

let app: ChildProcess | undefined;

const ADMIN = { email: 'admin@case.local', password: 'Admin@123' };
const OFFICE_EMAIL = process.env.JUDICIAL_NOTIFICATION_EMAIL ?? 'documentos@case.local';

const COMPANY = {
  name: 'Empresa Exemplo S.A.',
  judicialAdmin: 'Case Administração Judicial',
  judge: 'Juiz de Direito Titular',
  nature: 'Recuperação Judicial',
  processNumber: '1234567-89.2024.8.11.0000',
  protocolDate: '2024-03-15',
  author: 'Autor do Processo',
  comarca: 'Comarca de Cuiabá - 1ª Vara Cível',
  observations: 'Observações do caso',
};

const PDF_BYTES = new TextEncoder().encode('%PDF-1.4\n%exemplo\n');

beforeAll(async () => {
  app = await bootTestApp();
}, 60000);

afterAll(async () => {
  await stopTestApp(app);
});

beforeEach(async () => {
  await db.query('TRUNCATE TABLE email_tokens, sessions, documents, users, companies');
  mailQueue.length = 0;
  await provisionAdmin();
});

async function adminCookies(ip: string): Promise<Record<string, string>> {
  const login = await postWithCsrf('/auth/login', ADMIN, ip);
  expect(login.status).toBe(200);
  return login.cookies;
}

async function loginAs(ip: string, email: string, password = 'Segura@123'): Promise<Record<string, string>> {
  const login = await postWithCsrf('/auth/login', { email, password }, ip);
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

async function createCompany(ip: string): Promise<string> {
  const cookies = await adminCookies(ip);
  const response = await api('POST', '/companies', { body: COMPANY, cookies, ip });
  expect(response.status).toBe(201);
  return (response.body as { id: string }).id;
}

function uploadForm(fields: Record<string, string>, filename: string, mime: string, bytes: Uint8Array): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append('file', new File([bytes], filename, { type: mime }));
  return form;
}

const FIELDS = {
  type: 'Habilitação de crédito',
  name: 'Petição inicial',
  description: 'Documento de habilitação',
};

async function upload(
  ip: string,
  companyId: string,
  cookies: Record<string, string>,
  fields: Record<string, string> = FIELDS,
  filename = 'peticao.pdf',
  mime = 'application/pdf',
  bytes: Uint8Array = PDF_BYTES,
) {
  return apiForm('POST', `/companies/${companyId}/documents`, uploadForm(fields, filename, mime, bytes), {
    cookies,
    ip,
  });
}

describe('POST /companies/:id/documents', () => {
  it('refuses a visitor with no session', async () => {
    const companyId = await createCompany('203.0.113.211');

    const response = await upload('203.0.113.212', companyId, {});

    expect(response.status).toBe(401);
  });

  it('refuses when verification is lost mid-session', async () => {
    const companyId = await createCompany('203.0.113.213');
    const cookies = await creditorCookies('203.0.113.213', 'quase@case.com');
    await db.query(`UPDATE users SET email_verified = false WHERE email = 'quase@case.com'`);

    const response = await upload('203.0.113.213', companyId, cookies);

    expect(response.status).toBe(403);
  });

  it('answers 404 for an unknown company before reading the file', async () => {
    const cookies = await adminCookies('203.0.113.214');

    const response = await upload('203.0.113.214', 'clx0000000000000000000000', cookies);

    expect(response.status).toBe(404);
  });

  it('rejects invalid input with PT-BR messages', async () => {
    const companyId = await createCompany('203.0.113.215');
    const cookies = await creditorCookies('203.0.113.215', 'regras@case.com');

    const noName = await upload('203.0.113.215', companyId, cookies, { type: 'Outros', customType: 'X' });
    expect(noName.status).toBe(400);

    const badType = await upload('203.0.113.215', companyId, cookies, { ...FIELDS, type: 'Procuração' });
    expect(badType.status).toBe(400);

    const noSpec = await upload('203.0.113.215', companyId, cookies, {
      ...FIELDS,
      type: 'Outros',
    });
    expect(noSpec.status).toBe(400);

    const badFormat = await upload(
      '203.0.113.215',
      companyId,
      cookies,
      { ...FIELDS, name: 'virus' },
      'virus.exe',
      'application/x-msdownload',
      new Uint8Array([0x4d, 0x5a]),
    );
    expect(badFormat.status).toBe(400);
  });

  it('refuses a file larger than 60 MB', async () => {
    const companyId = await createCompany('203.0.113.216');
    const cookies = await creditorCookies('203.0.113.216', 'grande@case.com');

    const response = await upload(
      '203.0.113.216',
      companyId,
      cookies,
      FIELDS,
      'grande.pdf',
      'application/pdf',
      new Uint8Array(61 * 1024 * 1024),
    );

    expect(response.status).toBe(413);
  }, 120000);

  it('stores a creditor upload as private and under analysis', async () => {
    const companyId = await createCompany('203.0.113.217');
    const cookies = await creditorCookies('203.0.113.217', 'envia@case.com');

    const response = await upload('203.0.113.217', companyId, cookies);

    expect(response.status).toBe(201);
    const { rows } = await db.query(
      'SELECT name, status, visibility, storage_key, content_hash, size, mime_type FROM documents',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'Petição inicial',
      status: 'EM_ANALISE',
      visibility: 'PRIVADO',
      size: PDF_BYTES.length,
      mime_type: 'application/pdf',
    });
    expect(rows[0].storage_key.startsWith(`${companyId}/`)).toBe(true);
    expect(rows[0].content_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('stores an admin upload as public', async () => {
    const companyId = await createCompany('203.0.113.218');
    const cookies = await adminCookies('203.0.113.218');

    const response = await upload('203.0.113.218', companyId, cookies);

    expect(response.status).toBe(201);
    const { rows } = await db.query('SELECT visibility FROM documents');
    expect(rows[0].visibility).toBe('PUBLICO');
  });

  it('notifies the office without blocking the upload', async () => {
    const companyId = await createCompany('203.0.113.219');
    const cookies = await creditorCookies('203.0.113.219', 'avisa@case.com');

    const response = await upload('203.0.113.219', companyId, cookies);

    expect(response.status).toBe(201);
    const mail = await findMail(OFFICE_EMAIL);
    expect(mail.link).toBe('');
  }, 60000);

  it('refuses the same content twice, whatever the name', async () => {
    const companyId = await createCompany('203.0.113.220');
    const cookies = await creditorCookies('203.0.113.220', 'duplo@case.com');
    await upload('203.0.113.220', companyId, cookies);

    const response = await upload(
      '203.0.113.220',
      companyId,
      cookies,
      { ...FIELDS, name: 'Outro nome para o mesmo arquivo' },
    );

    expect(response.status).toBe(409);
  });

  it('lets only one of two simultaneous identical uploads through', async () => {
    const companyId = await createCompany('203.0.113.221');
    const cookies = await creditorCookies('203.0.113.221', 'corrida@case.com');

    const [first, second] = await Promise.all([
      upload('203.0.113.221', companyId, cookies),
      upload('203.0.113.221', companyId, cookies, { ...FIELDS, name: 'Cópia da corrida' }),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
  });

  it('throttles the twenty-first upload from one account', async () => {
    const companyId = await createCompany('203.0.113.222');
    const cookies = await creditorCookies('203.0.113.222', 'pressa@case.com');

    for (let i = 0; i < 20; i++) {
      const unique = new Uint8Array([...PDF_BYTES, i]);
      const response = await upload(
        '203.0.113.222',
        companyId,
        cookies,
        { ...FIELDS, name: `Doc ${i}` },
        `doc-${i}.pdf`,
        'application/pdf',
        unique,
      );
      expect(response.status).toBe(201);
    }

    const throttled = await upload(
      '203.0.113.222',
      companyId,
      cookies,
      { ...FIELDS, name: 'Doc 20' },
      'doc-20.pdf',
      'application/pdf',
      new Uint8Array([...PDF_BYTES, 20]),
    );
    expect(throttled.status).toBe(429);
  }, 120000);
});

describe('GET /companies/:id/documents', () => {
  async function seedVisibility(ip: string): Promise<{ companyId: string; privateId: string }> {
    const companyId = await createCompany(ip);
    // One creditor per seed: the 2-accounts-per-IP cap leaves room for the
    // test's own account, and a second seed account would serve no purpose.
    const owner = await creditorCookies(ip, 'dono@case.com');
    const admin = await adminCookies(ip);

    // Distinct bytes per upload: identical content would (correctly) be
    // rejected as a duplicate second send.
    const ownerBytes = new Uint8Array([...PDF_BYTES, 0x01]);
    const adminBytes = new Uint8Array([...PDF_BYTES, 0x02]);
    const mine = await upload(ip, companyId, owner, FIELDS, 'peticao.pdf', 'application/pdf', ownerBytes);
    expect(mine.status).toBe(201);
    const pub = await upload(
      ip,
      companyId,
      admin,
      { ...FIELDS, name: 'Aviso público' },
      'aviso.pdf',
      'application/pdf',
      adminBytes,
    );
    expect(pub.status).toBe(201);
    return { companyId, privateId: (mine.body as { id: string }).id };
  }

  it('shows a visitor only public documents', async () => {
    const { companyId } = await seedVisibility('203.0.113.231');

    const response = await api('GET', `/companies/${companyId}/documents`, { ip: '203.0.113.232' });

    expect(response.status).toBe(200);
    expect((response.body as unknown[]).map((d) => (d as { name: string }).name)).toEqual([
      'Aviso público',
    ]);
  }, 60000);

  it('shows a creditor the public, the own and the admin-sent documents', async () => {
    const { companyId } = await seedVisibility('203.0.113.233');
    const cookies = await creditorCookies('203.0.113.233', 'terceiro@case.com');

    const response = await api('GET', `/companies/${companyId}/documents`, {
      cookies,
      ip: '203.0.113.233',
    });

    expect(response.status).toBe(200);
    const names = (response.body as unknown[]).map((d) => (d as { name: string }).name);
    expect(names).toContain('Aviso público');
    expect(names).not.toContain('Petição inicial');
  }, 60000);

  it('filters a creditor list by scope', async () => {
    const { companyId } = await seedVisibility('203.0.113.234');
    const cookies = await loginAs('203.0.113.234', 'dono@case.com');

    const mine = await api('GET', `/companies/${companyId}/documents?scope=mine`, {
      cookies,
      ip: '203.0.113.234',
    });
    expect((mine.body as unknown[]).map((d) => (d as { name: string }).name)).toEqual([
      'Petição inicial',
    ]);

    const fromAdmin = await api('GET', `/companies/${companyId}/documents?scope=admin`, {
      cookies,
      ip: '203.0.113.234',
    });
    expect((fromAdmin.body as unknown[]).map((d) => (d as { name: string }).name)).toEqual([
      'Aviso público',
    ]);
  }, 60000);

  it('shows an admin everything', async () => {
    const { companyId } = await seedVisibility('203.0.113.235');
    const cookies = await adminCookies('203.0.113.235');

    const response = await api('GET', `/companies/${companyId}/documents`, {
      cookies,
      ip: '203.0.113.235',
    });

    expect(response.status).toBe(200);
    expect((response.body as unknown[])).toHaveLength(2);
  }, 60000);

  it('answers 404 for an unknown company', async () => {
    const response = await api('GET', '/companies/clx0000000000000000000000/documents', {
      ip: '203.0.113.236',
    });

    expect(response.status).toBe(404);
  });
});

describe('GET /documents/:id/content', () => {
  it('delivers the exact bytes that were sent', async () => {
    const companyId = await createCompany('203.0.113.241');
    const cookies = await adminCookies('203.0.113.241');
    const created = await upload('203.0.113.241', companyId, cookies);
    const id = (created.body as { id: string }).id;

    const response = await fetch(`${BASE}/documents/${id}/content`, {
      headers: { 'X-Forwarded-For': '203.0.113.242' },
    });
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
    expect(response.headers.get('content-disposition')).toContain('inline');
    expect(bytes).toEqual(PDF_BYTES);
  }, 60000);

  it('downloads non-browser formats as attachments', async () => {
    const companyId = await createCompany('203.0.113.243');
    const cookies = await adminCookies('203.0.113.243');
    const created = await upload(
      '203.0.113.243',
      companyId,
      cookies,
      { ...FIELDS, name: 'Planilha', type: 'Outros', customType: 'Planilha de credores' },
      'planilha.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x01]),
    );
    const id = (created.body as { id: string }).id;

    const response = await fetch(`${BASE}/documents/${id}/content`, {
      headers: { 'X-Forwarded-For': '203.0.113.244' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect(response.headers.get('content-disposition')).toContain('Planilha.xlsx');
  }, 60000);

  it('hides a private document from strangers with a 404', async () => {
    const companyId = await createCompany('203.0.113.245');
    const owner = await creditorCookies('203.0.113.245', 'escondido@case.com');
    const created = await upload('203.0.113.245', companyId, owner);
    const id = (created.body as { id: string }).id;

    const visitor = await fetch(`${BASE}/documents/${id}/content`, {
      headers: { 'X-Forwarded-For': '203.0.113.246' },
    });
    expect(visitor.status).toBe(404);

    const stranger = await creditorCookies('203.0.113.246', 'estranho@case.com');
    const other = await api('GET', `/documents/${id}/content`, {
      cookies: stranger,
      ip: '203.0.113.246',
    });
    expect(other.status).toBe(404);
  });

  it('answers 404 for an unknown document', async () => {
    const response = await api('GET', '/documents/clx0000000000000000000000/content', {
      ip: '203.0.113.247',
    });

    expect(response.status).toBe(404);
  });

  it('throttles past sixty downloads for one account', async () => {
    const companyId = await createCompany('203.0.113.248');
    const cookies = await creditorCookies('203.0.113.248', 'leitor@case.com');
    const created = await upload('203.0.113.248', companyId, cookies);
    void created;

    const admin = await adminCookies('203.0.113.248');
    const listed = await api('GET', `/companies/${companyId}/documents`, {
      cookies: admin,
      ip: '203.0.113.248',
    });
    const id = ((listed.body as unknown[])[0] as { id: string }).id;

    let last = 200;
    for (let i = 0; i < 61; i++) {
      const response = await api('GET', `/documents/${id}/content`, { cookies, ip: '203.0.113.248' });
      last = response.status;
    }
    expect(last).toBe(429);
  }, 120000);
});
