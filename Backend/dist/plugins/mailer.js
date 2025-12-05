"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailerPlugin = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_js_1 = require("../config/env.js"); // <-- use .js se estiver em NodeNext
const mailerPlugin = async (fastify) => {
    if (!env_js_1.CONFIG.SMTP_HOST || !env_js_1.CONFIG.SMTP_USER || !env_js_1.CONFIG.SMTP_PASS) {
        fastify.log.warn('SMTP não configurado: /api/send-boleto ficará indisponível');
        fastify.decorate('mailer', {
            sendMail: async () => {
                throw new Error('SMTP não configurado no servidor.');
            }
        });
        return;
    }
    // ✅ Tipar corretamente como SMTPTransport.Options
    const transporterOptions = {
        host: env_js_1.CONFIG.SMTP_HOST, // podemos usar ! porque já validamos acima
        port: env_js_1.CONFIG.SMTP_PORT,
        secure: env_js_1.CONFIG.SMTP_PORT === 465,
        auth: { user: env_js_1.CONFIG.SMTP_USER, pass: env_js_1.CONFIG.SMTP_PASS },
        // opcional: incluir tls já aqui
        ...(env_js_1.CONFIG.SMTP_TLS_REJECT_UNAUTHORIZED ? {} : { tls: { rejectUnauthorized: false } })
    };
    const transporter = nodemailer_1.default.createTransport(transporterOptions);
    fastify.decorate('mailer', transporter);
};
exports.mailerPlugin = mailerPlugin;
