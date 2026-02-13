import cors from '@fastify/cors';
import { CONFIG } from '../config/env.js';
function isOriginAllowed(origin) {
    if (!origin)
        return true;
    if (CONFIG.RAW_CORS_ORIGINS.includes('*'))
        return true;
    return CONFIG.RAW_CORS_ORIGINS.includes(origin);
}
export const corsPlugin = async (fastify) => {
    await fastify.register(cors, {
        origin: (origin, cb) => {
            if (isOriginAllowed(origin)) {
                return cb(null, origin || '*');
            }
            return cb(new Error('Origin not allowed'), false);
        },
        credentials: false,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        exposedHeaders: ['Content-Type', 'Content-Disposition'],
        optionsSuccessStatus: 204,
    });
    // Garante envio do header CORS mesmo quando o plugin não injeta (ex.: health)
    fastify.addHook('onSend', async (request, reply, payload) => {
        const origin = request.headers.origin;
        if (isOriginAllowed(origin)) {
            reply.header('Access-Control-Allow-Origin', origin || '*');
            reply.header('Vary', 'Origin');
            reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
        }
        return payload;
    });
};
