import { fetch } from 'undici';
import { CONFIG } from '../config/env';


const OAUTH_URL = 'https://api.unimedpatos.sgusuite.com.br/oauth2/token';


let cachedToken: string | null = null;
let expiresAt = 0; // epoch ms


export async function getToken(): Promise<string> {
const now = Date.now();
if (cachedToken && now < expiresAt) return cachedToken;


const params = new URLSearchParams({
client_id: CONFIG.CLIENT_ID,
client_secret: CONFIG.CLIENT_SECRET,
grant_type: 'client_credentials',
scope: 'read'
});


const r = await fetch(OAUTH_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
body: params
});


if (!r.ok) {
const t = await r.text().catch(() => '');
throw new Error('Falha ao autenticar (token): ' + t);
}


const data = await r.json() as { access_token: string; expires_in?: number };
cachedToken = data.access_token;
// define TTL (fallback 50min)
const ttl = Math.max(30, Math.min(3600, data.expires_in ?? 3000)) * 1000; // 30s..1h
expiresAt = now + ttl - 15_000; // margem de 15s
return cachedToken;
}