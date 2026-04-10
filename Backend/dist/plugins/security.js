import helmet from '@fastify/helmet';
export const securityPlugin = async (fastify) => {
    await fastify.register(helmet, {
        contentSecurityPolicy: false,
    });
};
