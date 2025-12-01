// main.js (server) — versão com CSP flexível e viewer/download
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // v2
const cors = require('cors');
const nodemailer = require('nodemailer');
const { URL } = require('url');
const path = require('path');

// ================= CONFIG =================
const OAUTH_URL   = 'https://api.unimedpatos.sgusuite.com.br/oauth2/token';
const API_FATURAS = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177_busca_dados_fatura_aberto';
const API_BOLETO  = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/p_0177_json_busca_boleto';

const CLIENT_ID     = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@localhost';
const SMTP_TLS_REJECT_UNAUTHORIZED =
  !/^(0|false|no)$/i.test((process.env.SMTP_TLS_REJECT_UNAUTHORIZED || '').trim());

const PORT = process.env.PORT || 3001;

// CORS: origens autorizadas a chamar a API (use 'null' para liberar file://, '*' para liberar geral)
const RAW_CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:8081')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const ALLOW_ALL_CORS = RAW_CORS_ORIGINS.includes('*');
const ALLOW_NULL_ORIGIN = RAW_CORS_ORIGINS.includes('null');
const CORS_ORIGINS = RAW_CORS_ORIGINS.filter(origin => origin !== 'null');

// CSP: origens autorizadas a iframar /api/pdf
const DEFAULT_FRAME_ANCESTORS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8081',
].join(' ');

const FRAME_ANCESTORS = (() => {
  const base = (process.env.FRAME_ANCESTORS || DEFAULT_FRAME_ANCESTORS)
    .split(/[\s,]+/)
    .filter(Boolean);
  const set = new Set(base);
  RAW_CORS_ORIGINS.forEach(origin => {
    if (/^https?:\/\//.test(origin)) set.add(origin);
  });
  return Array.from(set);
})();

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Faltam CLIENT_ID/CLIENT_SECRET no .env');
  process.exit(1);
}

// ================= APP =================
const app = express();

app.use(
  cors({
    credentials: false,
    origin(origin, callback) {
      if (ALLOW_ALL_CORS) return callback(null, true);

      if (!origin) return callback(null, true); // requests sem header Origin (ex.: curl, Postman)
      if (origin === 'null') {
        return ALLOW_NULL_ORIGIN
          ? callback(null, true)
          : callback(new Error('CORS: origem \'null\' não autorizada'));
      }

      if (CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origem '${origin}' não autorizada`));
    },
  })
);
app.use(express.json({ limit: '2mb' }));

// (Opcional) servir o front pelo mesmo host/porta (same-origin):
// Coloque seu index.html numa pasta "public" ao lado do main.js e descomente:
// app.use(express.static(path.join(__dirname, 'public')));

// ================= HELPERS =================
const onlyDigits = (s) => (s || '').replace(/\D/g, '');

async function getToken() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: 'read',
  });
  const r = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!r.ok) {
    const t = await r.text().catch(()=> '');
    throw new Error('Falha ao autenticar (token): ' + t);
  }
  const data = await r.json();
  return data.access_token;
}

// aceita apenas PDFs servidos pelo domínio oficial
function isAllowedDocUrl(raw) {
  try {
    const u = new URL(raw);
    return (
      u.protocol === 'https:' &&
      u.hostname === 'api.unimedpatos.sgusuite.com.br' &&
      u.pathname.startsWith('/document/')
    );
  } catch {
    return false;
  }
}

function safeFilename(str = 'boleto.pdf') {
  return String(str).replace(/[^a-zA-Z0-9_.-]/g, '_');
}

// ================= ROTAS =================

// POST /api/faturas { cpfCnpj, contrato }
app.post('/api/faturas', async (req, res) => {
  const started = Date.now();
  try {
    const { cpfCnpj, contrato } = req.body || {};
    if (!cpfCnpj || !contrato) {
      return res.status(400).json({ error: 'cpfCnpj e contrato são obrigatórios' });
    }

    const token = await getToken();
    const payload = {
      CNPJ: Number(onlyDigits(cpfCnpj)),
      CONTRATO: Number(onlyDigits(contrato)),
    };

    const r = await fetch(API_FATURAS, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const t = await r.text().catch(()=> '');
      return res.status(r.status).json({ error: 'Falha ao buscar faturas', detail: t });
    }

    const data = await r.json();
    const content = Array.isArray(data?.content) ? data.content : [];
    console.log(`🧾 /api/faturas -> ${content.length} itens [${Date.now()-started}ms]`);
    res.json({ content });
  } catch (e) {
    console.error('Erro /api/faturas:', e);
    res.status(500).json({ error: e.message || 'Erro ao buscar faturas' });
  }
});

// POST /api/boleto { numeroFatura }
app.post('/api/boleto', async (req, res) => {
  const started = Date.now();
  try {
    const { numeroFatura } = req.body || {};
    if (!numeroFatura) {
      return res.status(400).json({ error: 'numeroFatura é obrigatório' });
    }

    const token = await getToken();
    const r = await fetch(API_BOLETO, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroFatura: Number(numeroFatura) }),
    });

    if (!r.ok) {
      const t = await r.text().catch(()=> '');
      return res.status(r.status).json({ error: 'Falha ao gerar boleto', detail: t });
    }

    const data = await r.json();
    const first = Array.isArray(data?.content) ? data.content[0] : null;
    const url = first?.url || null;
    console.log(`🔗 /api/boleto -> ${url ? 'OK' : 'NOK'} [${Date.now()-started}ms]`);
    res.json({ url });
  } catch (e) {
    console.error('Erro /api/boleto:', e);
    res.status(500).json({ error: e.message || 'Erro ao gerar boleto' });
  }
});

// GET /api/pdf?url=... -> visualização inline (para iframe) com CSP liberando seu front
app.get('/api/pdf', async (req, res) => {
  try {
    const { url } = req.query || {};
    if (!url || !isAllowedDocUrl(url)) {
      return res.status(400).json({ error: 'URL inválida ou não permitida.' });
    }

    const upstream = await fetch(url);
    if (!upstream.ok) {
      const t = await upstream.text().catch(()=> '');
      return res.status(upstream.status).json({ error: 'Falha ao obter PDF', detail: t });
    }

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/pdf');
    const fileName = safeFilename(url.split('/').pop() || 'boleto.pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'private, max-age=300');

    // 🔓 Permitir iframes vindos do(s) front(s) configurado(s) + self
    // (não usamos X-Frame-Options para não conflitar com CSP)
    const cspAncestors = `frame-ancestors 'self' ${FRAME_ANCESTORS.join(' ')}`.trim();
    res.setHeader('Content-Security-Policy', cspAncestors);

    upstream.body.pipe(res);
  } catch (e) {
    console.error('Erro /api/pdf:', e);
    res.status(500).json({ error: e.message || 'Erro ao servir PDF' });
  }
});

// GET /api/pdf-download?url=... -> força download (attachment)
app.get('/api/pdf-download', async (req, res) => {
  try {
    const { url } = req.query || {};
    if (!url || !isAllowedDocUrl(url)) {
      return res.status(400).json({ error: 'URL inválida ou não permitida.' });
    }

    const upstream = await fetch(url);
    if (!upstream.ok) {
      const t = await upstream.text().catch(()=> '');
      return res.status(upstream.status).json({ error: 'Falha ao obter PDF', detail: t });
    }

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/pdf');
    const fileName = safeFilename(url.split('/').pop() || 'boleto.pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-store');

    upstream.body.pipe(res);
  } catch (e) {
    console.error('Erro /api/pdf-download:', e);
    res.status(500).json({ error: e.message || 'Erro ao baixar PDF' });
  }
});

// POST /api/send-boleto { email, url, numeroFatura }
app.post('/api/send-boleto', async (req, res) => {
  try {
    const { email, url, numeroFatura } = req.body || {};
    if (!email || !url) {
      return res.status(400).json({ error: 'email e url são obrigatórios' });
    }
    if (!isAllowedDocUrl(url)) {
      return res.status(400).json({ error: 'URL do boleto não permitida.' });
    }
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return res.status(500).json({ error: 'SMTP não configurado no servidor.' });
    }

    const transporterOptions = {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    };
    if (!SMTP_TLS_REJECT_UNAUTHORIZED) {
      transporterOptions.tls = { rejectUnauthorized: false };
    }

    const transporter = nodemailer.createTransport(transporterOptions);

    const subject = `Boleto ${numeroFatura ? `- Fatura ${numeroFatura}` : ''}`;
    const proxyLink = `${req.protocol}://${req.get('host')}/api/pdf?url=${encodeURIComponent(url)}`;
    const html = `
      <p>Olá,</p>
      <p>Segue o link para visualizar/baixar seu boleto ${numeroFatura ? `da fatura <strong>${numeroFatura}</strong>` : ''}:</p>
      <p><a href="${url}" target="_blank" rel="noreferrer">${url}</a></p>
      <p>Ou visualize via proxy:</p>
      <p><a href="${proxyLink}" target="_blank" rel="noreferrer">${proxyLink}</a></p>
      <p>Atenciosamente,<br/>Unimed Patos de Minas</p>
    `;

    await transporter.sendMail({
      from: MAIL_FROM,
      to: email,
      subject,
      html,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('Erro /api/send-boleto:', e);
    res.status(500).json({ error: e.message || 'Erro ao enviar e-mail' });
  }
});

// Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));


function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);

    const cleanup = () => {
      server.off('error', onError);
      server.off('listening', onListening);
    };

    const onListening = () => {
      cleanup();
      resolve(server);
    };

    const onError = (err) => {
      cleanup();
      reject(err);
    };

    server.once('listening', onListening);
    server.once('error', onError);
  });
}

function logServerInfo(server, requestedPort) {
  const actualPort = server.address().port;
  const requestedInfo =
    typeof requestedPort === 'number' && requestedPort !== actualPort
      ? ` (solicitada ${requestedPort})`
      : '';

  console.log(`[server] Rodando em http://localhost:${actualPort}${requestedInfo}`);
  const corsInfo = ALLOW_ALL_CORS ? '*' : RAW_CORS_ORIGINS.join(', ') || '(nenhum)';
  console.log(`   - CORS: ${corsInfo}`);
  console.log(`   - frame-ancestors: 'self' ${FRAME_ANCESTORS.join(' ')}`);
  if (!SMTP_TLS_REJECT_UNAUTHORIZED) {
    console.warn("   - SMTP TLS: rejeição de certificado DESATIVADA (use somente em testes)");
  }

  server.on('error', (unexpected) => {
    console.error('[server] Erro inesperado:', unexpected);
  });
}

(async () => {
  const portNumber = Number(PORT);
  const preferredPort =
    Number.isInteger(portNumber) && portNumber >= 0 ? portNumber : 3000;

  try {
    const server = await startServer(preferredPort);
    logServerInfo(server, preferredPort);
  } catch (err) {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`[PORT] Porta ${preferredPort} ocupada. Buscando porta livre...`);
      try {
        const server = await startServer(0);
        logServerInfo(server, preferredPort);
      } catch (fallbackErr) {
        console.error('Erro ao iniciar servidor em porta alternativa:', fallbackErr);
        process.exit(1);
      }
    } else {
      console.error('Erro ao iniciar servidor:', err);
      process.exit(1);
    }
  }
})();

