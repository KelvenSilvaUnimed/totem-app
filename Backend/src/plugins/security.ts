import helmet from '@fastify/helmet';
import type { FastifyPluginAsync } from 'fastify';


export const securityPlugin: FastifyPluginAsync = async (fastify) => {
// Helmet geral (sem CSP global, pois /api/pdf ajusta CSP por rota)
await fastify.register(helmet, {
contentSecurityPolicy: false,
});
};