"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultarPessoaPorDocumento = consultarPessoaPorDocumento;
const undici_1 = require("undici");
const env_js_1 = require("../config/env.js");
const token_js_1 = require("./token.js");
const strings_js_1 = require("../utils/strings.js");
const API_PESSOAS = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177-valida-nome-benef';
function gerarMockPessoa(documento) {
    const digits = (0, strings_js_1.onlyDigits)(documento) || '00000000000';
    const isPJ = digits.length > 11;
    const nomeBase = isPJ ? 'Empresa' : 'Pessoa';
    return {
        tip_pessoa: isPJ ? 'J' : 'F',
        nome_pessoa: `${nomeBase} ${digits.slice(-4)}`,
        contrato: `CT${digits.slice(-6) || '000001'}`,
        cod_pessoa: digits.slice(-6) || '123456',
        dt_nasc: isPJ ? undefined : '1990-01-01',
        carteirinha: `M${digits.slice(-8) || '00000000'}`,
        doc_pessoa_s_formatacao: digits,
        doc_pessoa_formatado: documento,
    };
}
function toIsoDate(dateStr) {
    if (!dateStr)
        return undefined;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        if (dd && mm && yyyy) {
            return `${yyyy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
    }
    return dateStr;
}
function mapTipoPlanoToPessoa(t) {
    if (!t)
        return 'F';
    return t.toUpperCase() === 'PJ' ? 'J' : 'F';
}
async function consultarPessoaPorDocumento(documento) {
    const tryRemote = async () => {
        const token = await (0, token_js_1.getToken)();
        // O nome do campo enviado ao endpoint pode variar. Deixe configuravel.
        const fieldName = env_js_1.CONFIG.PESSOAS_DOC_FIELD || 'documento';
        const digits = (0, strings_js_1.onlyDigits)(documento);
        const body = {
            [fieldName]: digits, // manter string para nǜo perder zeros à esquerda
        };
        const r = await (0, undici_1.fetch)(API_PESSOAS, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!r.ok) {
            const t = await r.text().catch(() => '');
            throw new Error(`Falha ao consultar pessoa: ${t}`);
        }
        const data = (await r.json());
        const content = Array.isArray(data?.content) ? data.content : [];
        // Seleciona pelo CPF informado para evitar pegar o registro errado.
        const selected = content.find((item) => (0, strings_js_1.onlyDigits)(item?.cpf) === digits) || content[0] || null;
        if (!selected)
            return null;
        const normalizedDocumento = (0, strings_js_1.onlyDigits)(selected.cpf || documento) || digits;
        return {
            tip_pessoa: mapTipoPlanoToPessoa(selected?.tipo_plano || selected?.tip_pessoa),
            nome_pessoa: selected?.nome || selected?.nome_pessoa,
            contrato: selected?.registro_ans?.trim?.() || selected?.contrato,
            cod_pessoa: selected?.codigo_pessoa || selected?.cod_pessoa,
            dt_nasc: toIsoDate(selected?.data_nascimento || selected?.dt_nasc),
            carteirinha: selected?.carteirinha,
            doc_pessoa_s_formatacao: normalizedDocumento,
            doc_pessoa_formatado: selected?.cpf || documento,
        };
    };
    try {
        return await tryRemote();
    }
    catch (err) {
        if (env_js_1.CONFIG.MOCK_PESSOAS) {
            console.warn(`[MOCK] Gerando usuario ficticio para CPF/CNPJ: ${documento}`);
            return gerarMockPessoa(documento);
        }
        throw err;
    }
}
