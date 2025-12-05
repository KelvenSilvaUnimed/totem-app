"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const node_path_1 = __importDefault(require("node:path"));
const static_1 = __importDefault(require("@fastify/static"));
const env_1 = require("./config/env");
const cors_1 = require("./plugins/cors");
const mailer_1 = require("./plugins/mailer");
const security_1 = require("./plugins/security");
const boleto_route_1 = require("./routes/boleto.route");
const faturas_route_1 = require("./routes/faturas.route");
const health_route_1 = require("./routes/health.route");
const identificacao_route_js_1 = require("./routes/identificacao.route.js");
const pdf_route_1 = require("./routes/pdf.route");
async function build() {
    const app = (0, fastify_1.default)({ logger: true });
    await app.register(cors_1.corsPlugin);
    await app.register(security_1.securityPlugin);
    await app.register(mailer_1.mailerPlugin);
    app.addHook('onRequest', async (req, reply) => {
        if (req.method === 'OPTIONS') {
            const origin = req.headers.origin || '*';
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
        const origin = req.headers.origin || '*';
        reply
            .header('Access-Control-Allow-Origin', origin === 'null' ? '*' : origin)
            .header('Vary', 'Origin')
            .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
        return payload;
    });
    await app.register(static_1.default, {
        root: node_path_1.default.join(__dirname, '..'),
        index: ['index.html'],
        wildcard: false,
    });
    // Resposta simples para GET /
    app.get('/', async () => ({ ok: true }));
    // Rotas
    await app.register(identificacao_route_js_1.identificacaoRoute);
    await app.register(faturas_route_1.faturasRoute);
    await app.register(boleto_route_1.boletoRoute);
    await app.register(pdf_route_1.pdfRoute);
    await app.register(health_route_1.healthRoute);
    return app;
}
async function start() {
    try {
        const app = await build();
        const server = await app.listen({ port: env_1.CONFIG.PORT, host: '0.0.0.0' });
        app.log.info(`Servidor rodando em ${server}`);
        app.log.info(`CORS: ${env_1.CONFIG.RAW_CORS_ORIGINS.join(', ')}`);
        app.log.info(`frame-ancestors: 'self' ${env_1.CONFIG.FRAME_ANCESTORS_LIST.join(' ')}`);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
start();
