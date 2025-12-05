"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoute = void 0;
const healthRoute = async (fastify) => {
    fastify.get('/health', async () => ({ ok: true }));
};
exports.healthRoute = healthRoute;
