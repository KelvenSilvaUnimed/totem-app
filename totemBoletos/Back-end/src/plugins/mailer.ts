// src/plugins/mailer.ts
import type { FastifyPluginAsync } from 'fastify';
import nodemailer, { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport'; // <-- ADICIONE
import { CONFIG } from '../config/env.js'; // <-- use .js se estiver em NodeNext

declare module 'fastify' {
  interface FastifyInstance {
    mailer: Transporter;
  }
}

export const mailerPlugin: FastifyPluginAsync = async (fastify) => {
  if (!CONFIG.SMTP_HOST || !CONFIG.SMTP_USER || !CONFIG.SMTP_PASS) {
    fastify.log.warn('SMTP não configurado: /api/send-boleto ficará indisponível');
    fastify.decorate('mailer', {
      sendMail: async () => {
        throw new Error('SMTP não configurado no servidor.');
      }
    } as unknown as Transporter);
    return;
  }

  // ✅ Tipar corretamente como SMTPTransport.Options
  const transporterOptions: SMTPTransport.Options = {
    host: CONFIG.SMTP_HOST!,                 // podemos usar ! porque já validamos acima
    port: CONFIG.SMTP_PORT,
    secure: CONFIG.SMTP_PORT === 465,
    auth: { user: CONFIG.SMTP_USER!, pass: CONFIG.SMTP_PASS! },
    // opcional: incluir tls já aqui
    ...(CONFIG.SMTP_TLS_REJECT_UNAUTHORIZED ? {} : { tls: { rejectUnauthorized: false } })
  };

  const transporter = nodemailer.createTransport(transporterOptions);
  fastify.decorate('mailer', transporter);
};
