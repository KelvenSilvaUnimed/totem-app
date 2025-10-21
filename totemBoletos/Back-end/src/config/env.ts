import 'dotenv/config';
import { z } from 'zod';


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


const schema = z.object({
// OAuth
CLIENT_ID: z.string().min(1),
CLIENT_SECRET: z.string().min(1),


// Server
PORT: z.coerce.number().int().positive().default(3000),


// Sessão (JWT)
JWT_SECRET: z.string().min(10).default('change-me-please'),


// Endpoint Pessoas — campo do documento no payload
PESSOAS_DOC_FIELD: z.string().default('documento'),


// SMTP
SMTP_HOST: z.string().optional(),
SMTP_PORT: z.coerce.number().int().positive().default(587),
SMTP_USER: z.string().optional(),
SMTP_PASS: z.string().optional(),
MAIL_FROM: z.string().default('noreply@localhost'),
SMTP_TLS_REJECT_UNAUTHORIZED: z
.string()
.default('true')
.transform((v) => !/^(0|false|no)$/i.test(v.trim())),


// Segurança
FRAME_ANCESTORS: z.string().default(DEFAULT_FRAME_ANCESTORS),
CORS_ORIGINS: z.string().default(DEFAULT_CORS_ORIGINS)
});


const env = schema.parse(process.env);


const RAW_CORS_ORIGINS = env.CORS_ORIGINS
.split(',')
.map((s) => s.trim())
.filter(Boolean);


const FRAME_ANCESTORS_LIST = Array.from(
new Set(env.FRAME_ANCESTORS.split(/\s+/).filter(Boolean))
);


export const CONFIG = {
...env,
RAW_CORS_ORIGINS,
FRAME_ANCESTORS_LIST
};