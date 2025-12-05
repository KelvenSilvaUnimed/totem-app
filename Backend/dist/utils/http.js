"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOkJson = requireOkJson;
exports.requireOkStream = requireOkStream;
exports.isAllowedDocUrl = isAllowedDocUrl;
exports.safeFilename = safeFilename;
const undici_1 = require("undici");
async function requireOkJson(input, init) {
    const r = await (0, undici_1.fetch)(input, init);
    if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error(`${r.status} ${r.statusText} :: ${t}`);
    }
    return r.json();
}
async function requireOkStream(input, init) {
    const r = await (0, undici_1.fetch)(input, init);
    if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error(`${r.status} ${r.statusText} :: ${t}`);
    }
    return r;
}
const ALLOWED_DOC_DOMAINS = [
    'unimed.com.br',
    'unimedpatos.com.br',
    'unimedpatosdeminas.com.br',
    'sgusuite.com.br',
    'localhost',
    '127.0.0.1',
];
function isAllowedDocUrl(url) {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        return ALLOWED_DOC_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    }
    catch {
        return false;
    }
}
function safeFilename(filename) {
    if (!filename)
        return 'arquivo';
    return (filename
        // remove caracteres inválidos no Windows
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        // evita .. ou nomes vazios
        .replace(/\.{2,}/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .trim()
        .slice(0, 200) || 'arquivo');
}
