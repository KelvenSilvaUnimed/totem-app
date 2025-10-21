import Fastify from 'fastify';
import { CONFIG } from './config/env';
import { corsPlugin } from './plugins/cors';
import { securityPlugin } from './plugins/security';
import { mailerPlugin } from './plugins/mailer';
import { faturasRoute } from './routes/faturas.route';
import { boletoRoute } from './routes/boleto.route';
import { pdfRoute } from './routes/pdf.route';
import { healthRoute } from './routes/health.route';
import { identificacaoRoute } from './routes/identificacao.route.js';


async function build() {
const app = Fastify({ logger: true });


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