import nodemailer from 'nodemailer';
import { CONFIG } from '../config/env.js';
export const mailerPlugin = async (fastify) => {
    // 1. Verificação de segurança
    if (!CONFIG.SMTP_HOST || !CONFIG.SMTP_USER || !CONFIG.SMTP_PASS) {
        fastify.log.warn('SMTP não configurado: /api/send-boleto ficará indisponível');
        fastify.decorate('mailer', {
            sendMail: async () => {
                throw new Error('SMTP não configurado no servidor.');
            }
        });
        return;
    }
    // 2. Criação do transporte direto (o TS infere os tipos automaticamente aqui)
    const transporter = nodemailer.createTransport({
        host: CONFIG.SMTP_HOST,
        port: CONFIG.SMTP_PORT,
        secure: CONFIG.SMTP_PORT === 465,
        auth: {
            user: CONFIG.SMTP_USER,
            pass: CONFIG.SMTP_PASS
        },
        tls: CONFIG.SMTP_TLS_REJECT_UNAUTHORIZED
            ? undefined
            : { rejectUnauthorized: false }
    });
    // 3. Registro no Fastify
    fastify.decorate('mailer', transporter);
};
