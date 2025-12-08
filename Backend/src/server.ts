import Fastify from 'fastify';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';
import { CONFIG } from './config/env.js';
import { corsPlugin } from './plugins/cors.js';
import { mailerPlugin } from './plugins/mailer.js';
import { securityPlugin } from './plugins/security.js';
import { boletoRoute } from './routes/boleto.route.js';
import { faturasRoute } from './routes/faturas.route.js';
import { healthRoute } from './routes/health.route.js';
import { identificacaoRoute } from './routes/identificacao.route.js';
import { pdfRoute } from './routes/pdf.route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  const app = Fastify({ logger: true });

  await app.register(corsPlugin);
  await app.register(securityPlugin);
  await app.register(mailerPlugin);

  app.addHook('onRequest', async (req, reply) => {
    if (req.method === 'OPTIONS') {
      const origin = (req.headers.origin as string) || '*';
      reply
        .header('Access-Control-Allow-Origin', origin === 'null' ? '*' : origin)
        .header('Vary', 'Origin')
        .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
        .code(204)
        .send();
    }
  });

  app.addHook('onSend', async (req, reply, payload) => {
    const origin = (req.headers.origin as string) || '*';
    reply
      .header('Access-Control-Allow-Origin', origin === 'null' ? '*' : origin)
      .header('Vary', 'Origin')
      .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return payload;
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..'),
    index: ['index.html'],
    wildcard: false,
  });

  // Resposta simples para GET /
  app.get('/', async () => ({ ok: true }));

  // Rotas
  await app.register(identificacaoRoute);
  await app.register(faturasRoute);
  await app.register(boletoRoute);
  await app.register(pdfRoute);
  await app.register(healthRoute);

  return app;
}

async function start() {
  try {
    const app = await build();
    const server = await app.listen({ port: CONFIG.PORT, host: '0.0.0.0' });
    app.log.info(`Servidor rodando em ${server}`);
    app.log.info(`CORS: ${CONFIG.RAW_CORS_ORIGINS.join(', ')}`);
    app.log.info(`frame-ancestors: 'self' ${CONFIG.FRAME_ANCESTORS_LIST.join(' ')}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
