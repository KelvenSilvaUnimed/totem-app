"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowedDocUrl = isAllowedDocUrl;
function isAllowedDocUrl(raw) {
    try {
        const u = new URL(raw);
        return (u.protocol === 'https:' &&
            u.hostname === 'api.unimedpatos.sgusuite.com.br' &&
            u.pathname.startsWith('/document/'));
    }
    catch {
        return false;
    }
}
