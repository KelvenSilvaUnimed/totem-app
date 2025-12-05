"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const DEFAULT_FRAME_ANCESTORS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8081'
].join(' ');
const DEFAULT_CORS_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:8081'
].join(',');
const schema = zod_1.z.object({
    // OAuth
    CLIENT_ID: zod_1.z.string().min(1),
    CLIENT_SECRET: zod_1.z.string().min(1),
    // Server
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    // Sessão (JWT)
    JWT_SECRET: zod_1.z.string().min(10).default('change-me-please'),
    // Endpoint Pessoas – campo do documento no payload
    PESSOAS_DOC_FIELD: zod_1.z.string().default('cpf'),
    MOCK_PESSOAS: zod_1.z
        .string()
        .default('false')
        .transform((v) => /^(1|true|yes|sim|y)$/i.test(v.trim())),
    // SMTP
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().int().positive().default(587),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    MAIL_FROM: zod_1.z.string().default('noreply@localhost'),
    SMTP_TLS_REJECT_UNAUTHORIZED: zod_1.z
        .string()
        .default('true')
        .transform((v) => !/^(0|false|no)$/i.test(v.trim())),
    // Segurança
    FRAME_ANCESTORS: zod_1.z.string().default(DEFAULT_FRAME_ANCESTORS),
    CORS_ORIGINS: zod_1.z.string().default(DEFAULT_CORS_ORIGINS)
});
const env = schema.parse(process.env);
const RAW_CORS_ORIGINS = env.CORS_ORIGINS
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const FRAME_ANCESTORS_LIST = Array.from(new Set(env.FRAME_ANCESTORS.split(/\s+/).filter(Boolean)));
exports.CONFIG = {
    ...env,
    RAW_CORS_ORIGINS,
    FRAME_ANCESTORS_LIST
};
