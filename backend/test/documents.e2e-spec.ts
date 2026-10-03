// Documents journeys over HTTP — upload, visibility-filtered listing, delivery.
//
// The company is the root: every upload names one in the URL, and an unknown
// company is a 404 before a single byte is read. The office notification is
// asserted through the captured test mail; its failure never blocks the
// upload, by decision.

import { randomUUID } from 'node:crypto';
import type { ChildProcess } from 'node:child_process';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
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

/** Storage keys under a prefix, through the real bucket — proves no orphans. */
async function bucketKeys(prefix: string): Promise<string[]> {
  const client = new S3Client({
    endpoint: process.env.SEAWEEDFS_ENDPOINT ?? 'http://localhost:8333',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.SEAWEEDFS_ACCESS_KEY ?? 'test',
      secretAccessKey: process.env.SEAWEEDFS_SECRET_KEY ?? 'test',
    },
    forcePathStyle: true,
  });
  const listed = await client.send(
    new ListObjectsV2Command({
      Bucket: process.env.SEAWEEDFS_BUCKET_DOCUMENTS ?? 'documents',
      Prefix: prefix,
    }),
  );
  await client.destroy();
  return (listed.Contents ?? []).map((object) => object.Key ?? '');
}

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

async function createCompany(ip: string, body: unknown = COMPANY): Promise<string> {
  const cookies = await adminCookies(ip);
  const response = await api('POST', '/companies', { body, cookies, ip });
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

  it('accepts the same content in another company', async () => {
    const firstId = await createCompany('203.0.113.223');
    const secondId = await createCompany('203.0.113.223', {
      ...COMPANY,
      processNumber: '7654321-09.2024.8.11.0000',
    });
    const cookies = await creditorCookies('203.0.113.223', 'outra@case.com');
    const first = await upload('203.0.113.223', firstId, cookies);
    expect(first.status).toBe(201);

    const second = await upload('203.0.113.223', secondId, cookies);
    expect(second.status).toBe(201);
  });

  it('accepts the same content from another creditor', async () => {
    const companyId = await createCompany('203.0.113.224');
    const first = await creditorCookies('203.0.113.224', 'primeiro@case.com');
    const second = await creditorCookies('203.0.113.225', 'segundo@case.com');
    const firstUpload = await upload('203.0.113.224', companyId, first);
    expect(firstUpload.status).toBe(201);

    const secondUpload = await upload('203.0.113.225', companyId, second);
    expect(secondUpload.status).toBe(201);
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

describe('PATCH /documents/:id/status', () => {
  async function seededDoc(ip: string): Promise<{ id: string; admin: Record<string, string> }> {
    const companyId = await createCompany(ip);
    const cookies = await creditorCookies(ip, 'status@case.com');
    const created = await upload(ip, companyId, cookies);
    expect(created.status).toBe(201);
    return { id: (created.body as { id: string }).id, admin: await adminCookies(ip) };
  }

  it('lets an admin defer and revert, with no terminal state', async () => {
    const { id, admin } = await seededDoc('203.0.113.251');

    const deferred = await api('PATCH', `/documents/${id}/status`, {
      body: { status: 'Deferido' },
      cookies: admin,
      ip: '203.0.113.251',
    });
    expect(deferred.status).toBe(200);
    expect(deferred.body).toEqual(expect.objectContaining({ status: 'Deferido' }));
    const { rows } = await db.query('SELECT status FROM documents WHERE id = $1', [id]);
    expect(rows[0].status).toBe('DEFERIDO');

    const back = await api('PATCH', `/documents/${id}/status`, {
      body: { status: 'Em análise' },
      cookies: admin,
      ip: '203.0.113.251',
    });
    expect(back.status).toBe(200);
  });

  it('rejects an unknown status or document', async () => {
    const { id, admin } = await seededDoc('203.0.113.252');

    const badStatus = await api('PATCH', `/documents/${id}/status`, {
      body: { status: 'Aprovado' },
      cookies: admin,
      ip: '203.0.113.252',
    });
    expect(badStatus.status).toBe(400);

    const unknown = await api('PATCH', '/documents/clx0000000000000000000000/status', {
      body: { status: 'Deferido' },
      cookies: admin,
      ip: '203.0.113.252',
    });
    expect(unknown.status).toBe(404);
  });

  it('refuses visitors and creditors', async () => {
    const { id } = await seededDoc('203.0.113.253');

    const anonymous = await api('PATCH', `/documents/${id}/status`, {
      body: { status: 'Deferido' },
      ip: '203.0.113.254',
    });
    expect(anonymous.status).toBe(401);

    const creditor = await creditorCookies('203.0.113.255', 'sem-poder@case.com');
    const forbidden = await api('PATCH', `/documents/${id}/status`, {
      body: { status: 'Deferido' },
      cookies: creditor,
      ip: '203.0.113.255',
    });
    expect(forbidden.status).toBe(403);
  });
});

describe('PATCH /documents/:id/visibility', () => {
  it('toggles public and back to private', async () => {
    const companyId = await createCompany('203.0.113.256');
    const cookies = await creditorCookies('203.0.113.256', 'olho@case.com');
    const created = await upload('203.0.113.256', companyId, cookies);
    const id = (created.body as { id: string }).id;
    const admin = await adminCookies('203.0.113.256');

    const pub = await api('PATCH', `/documents/${id}/visibility`, {
      body: { visibility: 'público' },
      cookies: admin,
      ip: '203.0.113.256',
    });
    expect(pub.status).toBe(200);
    expect(pub.body).toEqual(expect.objectContaining({ visibility: 'Público' }));

    const priv = await api('PATCH', `/documents/${id}/visibility`, {
      body: { visibility: 'privado' },
      cookies: admin,
      ip: '203.0.113.256',
    });
    expect(priv.status).toBe(200);
    const { rows } = await db.query('SELECT visibility FROM documents WHERE id = $1', [id]);
    expect(rows[0].visibility).toBe('PRIVADO');
  });

  it('rejects an unknown value, document or caller', async () => {
    const companyId = await createCompany('203.0.113.257');
    const cookies = await creditorCookies('203.0.113.257', 'olho2@case.com');
    const created = await upload('203.0.113.257', companyId, cookies);
    const id = (created.body as { id: string }).id;
    const admin = await adminCookies('203.0.113.257');

    const badValue = await api('PATCH', `/documents/${id}/visibility`, {
      body: { visibility: 'secreto' },
      cookies: admin,
      ip: '203.0.113.257',
    });
    expect(badValue.status).toBe(400);

    const unknown = await api('PATCH', '/documents/clx0000000000000000000000/visibility', {
      body: { visibility: 'público' },
      cookies: admin,
      ip: '203.0.113.257',
    });
    expect(unknown.status).toBe(404);

    const forbidden = await api('PATCH', `/documents/${id}/visibility`, {
      body: { visibility: 'público' },
      cookies,
      ip: '203.0.113.257',
    });
    expect(forbidden.status).toBe(403);

    const anonymous = await api('PATCH', `/documents/${id}/visibility`, {
      body: { visibility: 'público' },
      ip: '203.0.113.258',
    });
    expect(anonymous.status).toBe(401);
  });
});

describe('DELETE /documents/:id', () => {
  it('lets the owner remove their own document for good', async () => {
    const companyId = await createCompany('203.0.113.261');
    const cookies = await creditorCookies('203.0.113.261', 'dono-doc@case.com');
    const created = await upload('203.0.113.261', companyId, cookies);
    const id = (created.body as { id: string }).id;

    const deleted = await api('DELETE', `/documents/${id}`, { cookies, ip: '203.0.113.261' });
    expect(deleted.status).toBe(204);

    const gone = await api('GET', `/documents/${id}/content`, { cookies, ip: '203.0.113.261' });
    expect(gone.status).toBe(404);
    const { rows } = await db.query('SELECT id FROM documents WHERE id = $1', [id]);
    expect(rows).toHaveLength(0);
    expect(await bucketKeys(`${companyId}/`)).toHaveLength(0);
  });

  it('lets an admin remove anyone’s document', async () => {
    const companyId = await createCompany('203.0.113.262');
    const cookies = await creditorCookies('203.0.113.262', 'alheio@case.com');
    const created = await upload('203.0.113.262', companyId, cookies);
    const id = (created.body as { id: string }).id;
    const admin = await adminCookies('203.0.113.262');

    const deleted = await api('DELETE', `/documents/${id}`, { cookies: admin, ip: '203.0.113.262' });
    expect(deleted.status).toBe(204);
  });

  it('hides strangers’ documents behind 404', async () => {
    const companyId = await createCompany('203.0.113.263');
    const cookies = await creditorCookies('203.0.113.263', 'meu@case.com');
    const created = await upload('203.0.113.263', companyId, cookies);
    const id = (created.body as { id: string }).id;
    const stranger = await creditorCookies('203.0.113.264', 'xeretando@case.com');

    const response = await api('DELETE', `/documents/${id}`, {
      cookies: stranger,
      ip: '203.0.113.264',
    });
    expect(response.status).toBe(404);

    const anonymous = await api('DELETE', `/documents/${id}`, { ip: '203.0.113.265' });
    expect(anonymous.status).toBe(401);

    const unknown = await api('DELETE', '/documents/clx0000000000000000000000', {
      cookies,
      ip: '203.0.113.263',
    });
    expect(unknown.status).toBe(404);
  });
});

describe('GET /clients/:userId/documents', () => {
  async function seedClient(ip: string): Promise<{ userId: string; admin: Record<string, string> }> {
    const companyId = await createCompany(ip);
    const cookies = await creditorCookies(ip, 'fichado@case.com');
    for (let i = 0; i < 3; i++) {
      const unique = new Uint8Array([...PDF_BYTES, i]);
      const created = await upload(ip, companyId, cookies, { ...FIELDS, name: `Doc ${i}` }, `doc-${i}.pdf`, 'application/pdf', unique);
      expect(created.status).toBe(201);
    }
    const admin = await adminCookies(ip);
    const listed = await api('GET', `/companies/${companyId}/documents`, { cookies: admin, ip });
    const idOf = (name: string) =>
      (listed.body as Array<{ id: string; name: string }>).find((d) => d.name === name)?.id ?? '';
    await api('PATCH', `/documents/${idOf('Doc 0')}/status`, {
      body: { status: 'Deferido' },
      cookies: admin,
      ip,
    });
    await api('PATCH', `/documents/${idOf('Doc 1')}/status`, {
      body: { status: 'Indeferido' },
      cookies: admin,
      ip,
    });
    const { rows } = await db.query(`SELECT id FROM users WHERE email = 'fichado@case.com'`);
    return { userId: rows[0].id, admin };
  }

  it('reports real totals, not page slices', async () => {
    const { userId, admin } = await seedClient('203.0.113.271');

    const response = await api('GET', `/clients/${userId}/documents`, {
      cookies: admin,
      ip: '203.0.113.271',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        stats: { total: 3, emAnalise: 1, deferidos: 1, indeferidos: 1 },
      }),
    );
    expect((response.body as { user: { email: string } }).user.email).toBe('fichado@case.com');
  });

  it('paginates ten per page while stats stay total', async () => {
    const companyId = await createCompany('203.0.113.272');
    const cookies = await creditorCookies('203.0.113.272', 'prolifico@case.com');
    for (let i = 0; i < 11; i++) {
      const unique = new Uint8Array([...PDF_BYTES, i]);
      await upload('203.0.113.272', companyId, cookies, { ...FIELDS, name: `Doc ${i}` }, `doc-${i}.pdf`, 'application/pdf', unique);
    }
    const admin = await adminCookies('203.0.113.272');
    const { rows } = await db.query(`SELECT id FROM users WHERE email = 'prolifico@case.com'`);

    const first = await api('GET', `/clients/${rows[0].id}/documents`, {
      cookies: admin,
      ip: '203.0.113.272',
    });
    expect((first.body as { items: unknown[] }).items).toHaveLength(10);
    expect(first.body).toEqual(
      expect.objectContaining({ page: 1, totalPages: 2, stats: expect.objectContaining({ total: 11 }) }),
    );

    const second = await api('GET', `/clients/${rows[0].id}/documents?page=2`, {
      cookies: admin,
      ip: '203.0.113.272',
    });
    expect((second.body as { items: unknown[] }).items).toHaveLength(1);
  }, 120000);

  it('rejects bad pages, strangers and unknown users', async () => {
    const { userId, admin } = await seedClient('203.0.113.273');

    const badPage = await api('GET', `/clients/${userId}/documents?page=0`, {
      cookies: admin,
      ip: '203.0.113.273',
    });
    expect(badPage.status).toBe(400);

    const unknown = await api('GET', '/clients/clx0000000000000000000000/documents', {
      cookies: admin,
      ip: '203.0.113.273',
    });
    expect(unknown.status).toBe(404);

    const creditor = await creditorCookies('203.0.113.274', 'curioso@case.com');
    const forbidden = await api('GET', `/clients/${userId}/documents`, {
      cookies: creditor,
      ip: '203.0.113.274',
    });
    expect(forbidden.status).toBe(403);

    const anonymous = await api('GET', `/clients/${userId}/documents`, { ip: '203.0.113.275' });
    expect(anonymous.status).toBe(401);
  });

  it('answers an empty client with zeroed stats', async () => {
    const admin = await adminCookies('203.0.113.276');
    await creditorCookies('203.0.113.276', 'vazio@case.com');
    const { rows } = await db.query(`SELECT id FROM users WHERE email = 'vazio@case.com'`);

    const response = await api('GET', `/clients/${rows[0].id}/documents`, {
      cookies: admin,
      ip: '203.0.113.276',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ items: [], stats: { total: 0, emAnalise: 0, deferidos: 0, indeferidos: 0 } }),
    );
  });
});

describe('GET /clients', () => {
  it('lists users alphabetically with their company tags', async () => {
    const companyId = await createCompany('203.0.113.281');
    const cookies = await creditorCookies('203.0.113.281', 'zebedeu@case.com');
    await upload('203.0.113.281', companyId, cookies);
    const admin = await adminCookies('203.0.113.281');

    const response = await api('GET', '/clients', { cookies: admin, ip: '203.0.113.281' });

    expect(response.status).toBe(200);
    const items = (response.body as { items: Array<{ name: string; companies: Array<{ name: string }> }> }).items;
    expect(items.map((u) => u.name)).toEqual(['Administrador', 'Credor Teste']);
    const zebedeu = items.find((u) => u.name === 'Credor Teste') ?? { companies: [] };
    expect(zebedeu.companies.map((c) => c.name)).toEqual(['Empresa Exemplo S.A.']);
    expect(response.body).toEqual(expect.objectContaining({ page: 1, totalPages: 1, total: 2 }));
  });

  it('searches by name, e-mail and company', async () => {
    const companyId = await createCompany('203.0.113.282');
    const cookies = await creditorCookies('203.0.113.282', 'procurado@case.com');
    await upload('203.0.113.282', companyId, cookies);
    const admin = await adminCookies('203.0.113.282');

    const byName = await api('GET', '/clients?search=credor', { cookies: admin, ip: '203.0.113.282' });
    expect((byName.body as { items: unknown[] }).items).toHaveLength(1);

    const byEmail = await api('GET', '/clients?search=procurado@case.com', {
      cookies: admin,
      ip: '203.0.113.282',
    });
    expect((byEmail.body as { items: unknown[] }).items).toHaveLength(1);

    const byCompany = await api('GET', '/clients?company=exemplo', {
      cookies: admin,
      ip: '203.0.113.282',
    });
    expect((byCompany.body as { items: unknown[] }).items).toHaveLength(1);

    const missing = await api('GET', '/clients?search=ninguem', {
      cookies: admin,
      ip: '203.0.113.282',
    });
    expect((missing.body as { items: unknown[] }).items).toHaveLength(0);

    const arrayed = await api('GET', '/clients?search=a&search=b', {
      cookies: admin,
      ip: '203.0.113.282',
    });
    expect(arrayed.status).toBe(400);
  });

  it('paginates past ten users', async () => {
    const admin = await adminCookies('203.0.113.283');
    for (let i = 0; i < 11; i++) {
      const name = `Usuario ${String(i).padStart(2, '0')}`;
      await db.query(
        `INSERT INTO users (id, name, email, password_hash, role, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, 'x', 'CREDITOR', true, now(), now())`,
        [randomUUID(), name, `u${i}@case.com`],
      );
    }

    const first = await api('GET', '/clients', { cookies: admin, ip: '203.0.113.283' });
    expect((first.body as { items: unknown[] }).items).toHaveLength(10);
    expect(first.body).toEqual(expect.objectContaining({ page: 1, totalPages: 2, total: 12 }));

    const second = await api('GET', '/clients?page=2', { cookies: admin, ip: '203.0.113.283' });
    expect((second.body as { items: unknown[] }).items).toHaveLength(2);
  });

  it('refuses non-admins', async () => {
    const creditor = await creditorCookies('203.0.113.284', 'comum@case.com');

    const forbidden = await api('GET', '/clients', { cookies: creditor, ip: '203.0.113.284' });
    expect(forbidden.status).toBe(403);

    const anonymous = await api('GET', '/clients', { ip: '203.0.113.285' });
    expect(anonymous.status).toBe(401);
  });
});

describe('DELETE /clients/:userId', () => {
  it('removes a creditor with every document and object', async () => {
    const companyId = await createCompany('203.0.113.291');
    const cookies = await creditorCookies('203.0.113.291', 'banido@case.com');
    const created = await upload('203.0.113.291', companyId, cookies);
    const docId = (created.body as { id: string }).id;
    const admin = await adminCookies('203.0.113.291');
    const { rows } = await db.query(`SELECT id FROM users WHERE email = 'banido@case.com'`);

    const deleted = await api('DELETE', `/clients/${rows[0].id}`, {
      cookies: admin,
      ip: '203.0.113.291',
    });
    expect(deleted.status).toBe(204);

    const users = await db.query(`SELECT id FROM users WHERE email = 'banido@case.com'`);
    expect(users.rows).toHaveLength(0);
    const docs = await db.query('SELECT id FROM documents WHERE id = $1', [docId]);
    expect(docs.rows).toHaveLength(0);
    const content = await api('GET', `/documents/${docId}/content`, {
      cookies: admin,
      ip: '203.0.113.291',
    });
    expect(content.status).toBe(404);
    expect(await bucketKeys(`${companyId}/`)).toHaveLength(0);
  });

  it('refuses admins, self, strangers and ghosts', async () => {
    const admin = await adminCookies('203.0.113.292');
    await provisionAdmin('outro-admin@case.local');
    const { rows: admins } = await db.query(
      `SELECT id, email FROM users WHERE role = 'ADMIN' ORDER BY email`,
    );
    const self = admins.find((u: { email: string }) => u.email === 'admin@case.local') ?? admins[0];
    const peer = admins.find((u: { email: string }) => u.email !== self.email) ?? self;

    const adminTarget = await api('DELETE', `/clients/${peer.id}`, {
      cookies: admin,
      ip: '203.0.113.292',
    });
    expect(adminTarget.status).toBe(403);
    expect(JSON.stringify(adminTarget.body)).toMatch(/administradores/);

    const me = await api('DELETE', `/clients/${self.id}`, {
      cookies: admin,
      ip: '203.0.113.292',
    });
    expect(me.status).toBe(403);
    expect(JSON.stringify(me.body)).toMatch(/própria conta/);

    const unknown = await api('DELETE', '/clients/clx0000000000000000000000', {
      cookies: admin,
      ip: '203.0.113.292',
    });
    expect(unknown.status).toBe(404);

    const creditor = await creditorCookies('203.0.113.293', 'qualquer@case.com');
    const forbidden = await api('DELETE', `/clients/${admins[0].id}`, {
      cookies: creditor,
      ip: '203.0.113.293',
    });
    expect(forbidden.status).toBe(403);

    const anonymous = await api('DELETE', `/clients/${admins[0].id}`, { ip: '203.0.113.294' });
    expect(anonymous.status).toBe(401);
  });
});
