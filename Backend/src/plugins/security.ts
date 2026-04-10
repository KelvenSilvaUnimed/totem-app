import helmet from '@fastify/helmet';
import type { FastifyPluginAsync } from 'fastify';


export const securityPlugin: FastifyPluginAsync = async (fastify) => {
await fastify.register(helmet, {
contentSecurityPolicy: false,
});
};