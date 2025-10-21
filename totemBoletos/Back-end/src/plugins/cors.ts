import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';
import { CONFIG } from '../config/env';


export const corsPlugin: FastifyPluginAsync = async (fastify) => {
const RAW = CONFIG.RAW_CORS_ORIGINS;
const ALLOW_ALL = RAW.includes('*');
const ALLOW_NULL = RAW.includes('null');
const WHITELIST = RAW.filter((o) => o !== 'null');


await fastify.register(cors, {
credentials: false,
origin(origin, cb) {
if (ALLOW_ALL) return cb(null, true);
if (!origin) return cb(null, true); // curl/insomnia
if (origin === 'null') return cb(null, ALLOW_NULL);
if (WHITELIST.includes(origin)) return cb(null, true);
cb(new Error(`CORS: origem '${origin}' não autorizada`), false);
}
});
};