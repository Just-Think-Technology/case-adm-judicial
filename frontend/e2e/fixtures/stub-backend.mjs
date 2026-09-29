// Minimal stub of the NestJS API for Playwright: deterministic fixtures so the
// frontend e2e proves rendering, navigation and states without a live backend.
// Controlled at runtime via POST /__control { failCompanies?, failDocuments? }.
import http from 'node:http';

const PORT = 3000;

const state = { failCompanies: false, failDocuments: false, failUpload: false };
const accountState = { id: 'u1', name: 'Credor Teste', email: 'credor@case.com' };
const adminState = { id: 'u-admin', name: 'Admin Teste', email: 'admin@case.com' };

const companies = [
  {
    id: 'c1',
    name: 'Alvorada Alimentos Ltda',
    nature: 'Recuperação Judicial',
    processNumber: '1001234-56.2026.8.11.0001',
    createdAt: '2026-09-20T12:00:00.000Z',
  },
  {
    id: 'c2',
    name: 'Pantanal Transportes SA',
    nature: 'Falência',
    processNumber: '1009876-11.2025.8.11.0002',
    createdAt: '2026-09-21T12:00:00.000Z',
  },
  {
    id: 'c3',
    name: 'Aruana Logística Ltda',
    nature: 'Falência',
    processNumber: '1003333-44.2024.8.11.0003',
    createdAt: '2024-02-11T12:00:00.000Z',
  },
];

const details = {
  c1: {
    ...companies[0],
    judicialAdmin: 'Case Administração Judicial',
    judge: 'Juíza de Direito Exemplar',
    protocolDate: '2026-09-10',
    author: 'Alvorada Alimentos Ltda',
    comarca: 'Vara Empresarial de Cuiabá/MT',
    observations: 'Assembleia marcada para outubro.',
    updatedAt: '2026-09-20T12:00:00.000Z',
  },
  c2: {
    ...companies[1],
    judicialAdmin: 'Case Administração Judicial',
    judge: 'Juiz de Direito Exemplar',
    protocolDate: '2025-05-02',
    author: 'Pantanal Transportes SA',
    comarca: '',
    observations: null,
    updatedAt: '2026-09-21T12:00:00.000Z',
  },
};

const documents = {
  c1: [
    { id: 'd1', name: 'Petição inicial.pdf', type: 'Outros', customType: 'Petição', status: 'Em análise', visibility: 'Público', uploadedBy: 'Credor Teste', mine: true },
    { id: 'd2', name: 'Lista de credores.xlsx', type: 'Habilitação de crédito', customType: null, status: 'Deferido', visibility: 'Privado', uploadedBy: 'Admin Teste', mine: false },
  ],
  c2: [],
};

const stubClients = [
  {
    id: 'u1',
    name: 'Credor Teste',
    email: 'credor@case.com',
    createdAt: '2026-09-20T12:00:00.000Z',
    role: 'CREDITOR',
    companies: [{ id: 'c1', name: 'Alvorada Alimentos Ltda', nature: 'Recuperação Judicial' }],
    totalCompanies: 1,
  },
  {
    id: 'u-admin',
    name: 'Admin Teste',
    email: 'admin@case.com',
    createdAt: '2026-09-01T12:00:00.000Z',
    role: 'ADMIN',
    companies: [],
    totalCompanies: 0,
  },
  {
    id: 'u3',
    name: 'Outro Credor',
    email: 'outro@case.com',
    createdAt: '2026-09-22T12:00:00.000Z',
    role: 'CREDITOR',
    companies: [
      { id: 'c1', name: 'Alvorada Alimentos Ltda', nature: 'Recuperação Judicial' },
      { id: 'c2', name: 'Pantanal Transportes SA', nature: 'Falência' },
    ],
    totalCompanies: 2,
  },
];

const clientDocs = {
  u1: {
    user: { id: 'u1', name: 'Credor Teste', email: 'credor@case.com' },
    stats: { total: 1, emAnalise: 1, deferidos: 0, indeferidos: 0 },
    items: [
      { id: 'd1', name: 'Petição inicial.pdf', type: 'Outros', customType: 'Petição', company: { id: 'c1', name: 'Alvorada Alimentos Ltda' }, status: 'Em análise', createdAt: '2026-09-20T12:00:00.000Z' },
    ],
    page: 1,
    totalPages: 1,
  },
};

function json(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

// The real API answers visibility as a display label, whatever it accepts.
function visibilityLabel(input) {
  return String(input).toLowerCase().includes('priv') ? 'Privado' : 'Público';
}

// Fixed accounts for the auth journeys: verified, unverified and taken.
const KNOWN_PASSWORD = 'Segura@123';

function authJson(res, status, payload, cookies) {
  const headers = { 'content-type': 'application/json' };
  if (cookies) headers['set-cookie'] = cookies;
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://stub');

  if (req.method === 'POST' && url.pathname === '/__control') {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw || '{}');
        if (typeof body.failCompanies === 'boolean') state.failCompanies = body.failCompanies;
        if (typeof body.failDocuments === 'boolean') state.failDocuments = body.failDocuments;
        if (typeof body.failUpload === 'boolean') state.failUpload = body.failUpload;
      } catch {
        // Malformed control payloads keep the previous state on purpose.
      }
      json(res, 200, state);
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PATCH' && req.method !== 'PUT' && req.method !== 'DELETE') {
    json(res, 405, { message: 'Método não permitido.' });
    return;
  }

  if (url.pathname === '/auth/csrf-token') {
    return authJson(res, 200, { token: 'stub-csrf' }, ['csrf_token=stub-csrf; Path=/']);
  }

  if (url.pathname === '/auth/register' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.email === 'usada@case.com') {
      return authJson(res, 409, { message: 'Este e-mail já está cadastrado no sistema.' });
    }
    return authJson(res, 201, {
      message: 'Cadastro realizado com sucesso! Verifique seu e-mail para ativar a conta, inclusive a caixa de spam.',
    });
  }

  if (url.pathname === '/auth/login' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.email === 'novo@case.com') {
      return authJson(res, 401, { message: 'Necessário validar o e-mail.' });
    }
    if (body.email === 'credor@case.com' && body.password === KNOWN_PASSWORD) {
      return authJson(
        res,
        200,
        { message: 'Login realizado com sucesso.' },
        ['access_token=sess-valid; Path=/; HttpOnly', 'refresh_token=sess-refresh; Path=/auth/refresh; HttpOnly'],
      );
    }
    if (body.email === 'admin@case.com' && body.password === KNOWN_PASSWORD) {
      return authJson(
        res,
        200,
        { message: 'Login realizado com sucesso.' },
        ['access_token=sess-admin; Path=/; HttpOnly', 'refresh_token=sess-admin-refresh; Path=/auth/refresh; HttpOnly'],
      );
    }
    return authJson(res, 401, { message: 'Credenciais inválidas.' });
  }

  if (url.pathname === '/auth/verification-notification' && req.method === 'POST') {
    return authJson(res, 200, { message: 'E-mail de verificação reenviado! Verifique também a caixa de spam.' });
  }

  if (url.pathname === '/auth/verify-email') {
    if (url.searchParams.get('token') === 'valido') {
      return authJson(res, 200, { message: 'E-mail verificado com sucesso!' });
    }
    return authJson(res, 400, { message: 'O link de verificação não é válido.' });
  }

  if (url.pathname === '/auth/forgot-password' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.email === 'credor@case.com') {
      return authJson(res, 200, { message: 'E-mail de redefinição enviado!' });
    }
    return authJson(res, 200, { message: 'Não foi encontrado usuário com esse endereço.' });
  }

  if (url.pathname === '/auth/reset-password' && req.method === 'GET') {
    if (url.searchParams.get('token') === 'valido') {
      return authJson(res, 200, { email: 'credor@case.com' });
    }
    return authJson(res, 400, { message: 'O link de redefinição não é válido ou já foi utilizado.' });
  }

  if (url.pathname === '/auth/reset-password' && req.method === 'POST') {
    return authJson(res, 200, { message: 'Senha redefinida com sucesso!' });
  }

  if (url.pathname === '/auth/logout' && req.method === 'POST') {
    return authJson(res, 200, { message: 'Você saiu da conta.' }, [
      'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'refresh_token=; Path=/auth/refresh; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ]);
  }

  if (url.pathname === '/account') {
    const cookie = req.headers.cookie ?? '';
    const active = cookie.includes('sess-admin') ? adminState : cookie.includes('sess-valid') ? accountState : null;
    if (!active) {
      return authJson(res, 401, { message: 'Não autenticado.' });
    }
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      if (body.email === 'usada@case.com') {
        return authJson(res, 409, { message: 'Este e-mail já está em uso.' });
      }
      if (body.name) active.name = body.name;
      if (body.email) active.email = body.email;
      return authJson(res, 200, { ...active });
    }
    return authJson(res, 200, {
      id: active.id,
      name: active.name,
      email: active.email,
      role: cookie.includes('sess-admin') ? 'ADMIN' : 'CREDITOR',
      emailVerified: true,
      createdAt: '2026-09-20T12:00:00.000Z',
    });
  }

  if (url.pathname === '/account/password' && req.method === 'PATCH') {
    const body = await readBody(req);
    if (body.currentPassword === 'errada') {
      return authJson(res, 400, { message: 'Senha atual incorreta.' });
    }
    return authJson(res, 200, { message: 'Senha alterada com sucesso!' });
  }

  const companyIdMatch = url.pathname.match(/^\/companies\/([^/]+)$/);
  if (companyIdMatch && req.method === 'PUT') {
    const body = await readBody(req);
    if (!body.name) return authJson(res, 400, { message: 'O nome da empresa é obrigatório.' });
    return authJson(res, 200, { ...details.c1, ...body, id: companyIdMatch[1] });
  }

  if (companyIdMatch && req.method === 'DELETE') {
    res.writeHead(204);
      res.end();
      return;
  }

  if (url.pathname === '/clients') {
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const company = (url.searchParams.get('company') ?? '').toLowerCase();
    const page = Number(url.searchParams.get('page') ?? '1');
    const filtered = stubClients.filter((client) => {
      if (search && !client.name.toLowerCase().includes(search) && !client.email.toLowerCase().includes(search)) {
        return false;
      }
      if (company && !client.companies.some((entry) => entry.name.toLowerCase().includes(company))) {
        return false;
      }
      return true;
    });
    const perPage = 2;
    const slice = filtered.slice((page - 1) * perPage, page * perPage);
    return authJson(res, 200, {
      items: slice,
      page,
      totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
      total: filtered.length,
    });
  }

  const clientDocsMatch = url.pathname.match(/^\/clients\/([^/]+)\/documents$/);
  if (clientDocsMatch) {
    const docs = clientDocs[clientDocsMatch[1]];
    if (!docs) return authJson(res, 404, { message: 'Cliente não encontrado.' });
    return authJson(res, 200, docs);
  }

  const clientMatch = url.pathname.match(/^\/clients\/([^/]+)$/);
  if (clientMatch && req.method === 'DELETE') {
    if (clientMatch[1] === 'u-admin') {
      return authJson(res, 403, { message: 'Não é permitido excluir um administrador.' });
    }
    res.writeHead(204);
      res.end();
      return;
  }

  const docStatusMatch = url.pathname.match(/^\/documents\/([^/]+)\/(status|visibility)$/);
  if (docStatusMatch && req.method === 'PATCH') {
    const body = await readBody(req);
    // Mirror the real backend: the change persists and answers carry labels.
    const field = docStatusMatch[2];
    for (const list of Object.values(documents)) {
      const doc = list.find((d) => d.id === docStatusMatch[1]);
      if (doc && typeof body[field] === 'string') {
        doc[field] = field === 'visibility' ? visibilityLabel(body[field]) : body[field];
      }
    }
    return authJson(res, 200, { id: docStatusMatch[1], name: 'Documento' });
  }

  const docMatch = url.pathname.match(/^\/documents\/([^/]+)$/);
  if (docMatch && req.method === 'DELETE') {
    res.writeHead(204);
      res.end();
      return;
  }

  if (url.pathname === '/companies') {
    if (req.method === 'POST') {
      const body = await readBody(req);
      if (!body.name) return authJson(res, 400, { message: 'O nome da empresa é obrigatório.' });
      return authJson(res, 201, { ...details.c1, ...body, id: 'c9' });
    }
    if (state.failCompanies) return json(res, 500, { message: 'Erro interno.' });
    return json(res, 200, companies);
  }

  const detailMatch = url.pathname.match(/^\/companies\/([^/]+)$/);
  if (detailMatch) {
    const company = details[detailMatch[1]];
    if (!company) return json(res, 404, { message: 'Empresa não encontrada.' });
    return json(res, 200, company);
  }

  const docsMatch = url.pathname.match(/^\/companies\/([^/]+)\/documents$/);
  if (docsMatch) {
    if (req.method === 'POST') {
      const cookie = req.headers.cookie ?? '';
      if (!cookie.includes('sess-valid')) return authJson(res, 401, { message: 'Não autenticado.' });
      if (state.failUpload) return authJson(res, 500, { message: 'Falha no armazenamento.' });
      // The multipart body streams through — the stub only answers.
      req.resume();
      return authJson(res, 201, { id: 'd9', name: 'enviado' });
    }
    if (state.failDocuments) return json(res, 500, { message: 'Erro interno.' });
    const docs = documents[docsMatch[1]];
    if (!docs) return json(res, 404, { message: 'Empresa não encontrada.' });
    const scope = url.searchParams.get('scope') ?? 'all';
    const filtered =
      scope === 'mine' ? docs.filter((doc) => doc.mine) : scope === 'admin' ? docs.filter((doc) => !doc.mine) : docs;
    return json(res, 200, filtered);
  }

  const contentMatch = url.pathname.match(/^\/documents\/([^/]+)\/content$/);
  if (req.method !== 'GET') {
    json(res, 405, { message: 'Método não permitido.' });
    return;
  }
  if (contentMatch) {
    const body = Buffer.from('%PDF-stub', 'utf8');
    res.writeHead(200, {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="documento.pdf"',
      'content-length': body.length,
    });
    res.end(body);
    return;
  }

  json(res, 404, { message: 'Não encontrado.' });
});

server.on('error', (error) => {
  console.error(`stub-backend failed to bind :${PORT} — is a backend already running?`, error.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`stub-backend listening on :${PORT}`);
});
