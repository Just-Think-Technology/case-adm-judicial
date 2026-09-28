// Minimal stub of the NestJS API for Playwright: deterministic fixtures so the
// frontend e2e proves rendering, navigation and states without a live backend.
// Controlled at runtime via POST /__control { failCompanies?, failDocuments? }.
import http from 'node:http';

const PORT = 3000;

const state = { failCompanies: false, failDocuments: false };

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
    { id: 'd1', name: 'Petição inicial.pdf', type: 'Outros', customType: 'Petição' },
    { id: 'd2', name: 'Lista de credores.xlsx', type: 'Habilitação de crédito', customType: null },
  ],
  c2: [],
};

function json(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://stub');

  if (req.method === 'POST' && url.pathname === '/__control') {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        const body = JSON.parse(raw || '{}');
        if (typeof body.failCompanies === 'boolean') state.failCompanies = body.failCompanies;
        if (typeof body.failDocuments === 'boolean') state.failDocuments = body.failDocuments;
      } catch {
        // Malformed control payloads keep the previous state on purpose.
      }
      json(res, 200, state);
    });
    return;
  }

  if (req.method !== 'GET') {
    json(res, 405, { message: 'Método não permitido.' });
    return;
  }

  if (url.pathname === '/api/companies') {
    if (state.failCompanies) return json(res, 500, { message: 'Erro interno.' });
    return json(res, 200, companies);
  }

  const detailMatch = url.pathname.match(/^\/api\/companies\/([^/]+)$/);
  if (detailMatch) {
    const company = details[detailMatch[1]];
    if (!company) return json(res, 404, { message: 'Empresa não encontrada.' });
    return json(res, 200, company);
  }

  const docsMatch = url.pathname.match(/^\/api\/companies\/([^/]+)\/documents$/);
  if (docsMatch) {
    if (state.failDocuments) return json(res, 500, { message: 'Erro interno.' });
    const docs = documents[docsMatch[1]];
    if (!docs) return json(res, 404, { message: 'Empresa não encontrada.' });
    return json(res, 200, docs);
  }

  const contentMatch = url.pathname.match(/^\/api\/documents\/([^/]+)\/content$/);
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
