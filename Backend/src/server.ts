import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';
import { CONFIG } from './config/env';
import { corsPlugin } from './plugins/cors';
import { mailerPlugin } from './plugins/mailer';
import { securityPlugin } from './plugins/security';
import { boletoRoute } from './routes/boleto.route';
import { faturasRoute } from './routes/faturas.route';
import { healthRoute } from './routes/health.route';
import { identificacaoRoute } from './routes/identificacao.route.js';
import { pdfRoute } from './routes/pdf.route';


async function build() {
  const app = Fastify({ logger: true });

  // Serve a SPA estática (index.html/app.js) para atender GET /
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..'),
    index: ['index.html'],
    wildcard: false,
  });

  await app.register(identificacaoRoute);

  await app.register(corsPlugin);
  await app.register(securityPlugin);
  await app.register(mailerPlugin);

  await app.register(faturasRoute);
  await app.register(boletoRoute);
  await app.register(pdfRoute);
  await app.register(healthRoute);

  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..'),
    index: ['index.html'],
    wildcard: false,
  });

  await app.register(identificacaoRoute);

  await app.register(corsPlugin);
  await app.register(securityPlugin);
  await app.register(mailerPlugin);

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
