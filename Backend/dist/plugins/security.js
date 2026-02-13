import helmet from '@fastify/helmet';
export const securityPlugin = async (fastify) => {
    // Helmet geral (sem CSP global, pois /api/pdf ajusta CSP por rota)
    await fastify.register(helmet, {
        contentSecurityPolicy: false,
    });
};
