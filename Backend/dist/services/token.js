"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToken = getToken;
const undici_1 = require("undici");
const env_1 = require("../config/env");
const OAUTH_URL = 'https://api.unimedpatos.sgusuite.com.br/oauth2/token';
let cachedToken = null;
let expiresAt = 0;
async function getToken() {
    const now = Date.now();
    if (cachedToken && now < expiresAt)
        return cachedToken;
    const params = new URLSearchParams({
        client_id: env_1.CONFIG.CLIENT_ID,
        client_secret: env_1.CONFIG.CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'read'
    });
    const r = await (0, undici_1.fetch)(OAUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error('Falha ao autenticar (token): ' + t);
    }
    const data = await r.json();
    cachedToken = data.access_token;
    const ttl = Math.max(30, Math.min(3600, data.expires_in ?? 3000)) * 1000;
    expiresAt = now + ttl - 15_000;
    return cachedToken;
}
