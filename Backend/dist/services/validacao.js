"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarNomeBenef = validarNomeBenef;
const undici_1 = require("undici");
const token_js_1 = require("./token.js");
const API_VALIDACAO = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177-valida-nome-benef';
async function validarNomeBenef(payload) {
    const token = await (0, token_js_1.getToken)();
    const r = await (0, undici_1.fetch)(API_VALIDACAO, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload || {}),
    });
    if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error(`Falha ao validar beneficiário: ${t}`);
    }
    const data = (await r.json());
    const first = Array.isArray(data?.content) ? data.content[0] : null;
    return first ?? null;
}
