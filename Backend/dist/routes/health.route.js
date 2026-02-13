export const healthRoute = async (fastify) => {
    fastify.get('/health', async () => ({ ok: true }));
};
