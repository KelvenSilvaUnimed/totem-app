import { fetch } from 'undici';
import { CONFIG } from '../config/env.js';
import { getToken } from './token.js';
import { onlyDigits } from '../utils/strings.js';
const API_PESSOAS = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177-valida-nome-benef';
function gerarMockPessoa(documento) {
    const digits = onlyDigits(documento) || '00000000000';
    const isPJ = digits.length > 11;
    return {
        nome_titular: `Pessoa ${digits.slice(-4)}`,
        cpf_titular: digits,
        tipo_plano: isPJ ? 'PJ' : 'PF',
        registro_ans: `ANS${digits.slice(-6)}`,
        codigo_pessoa_titular: digits.slice(-5),
        data_nascimento_titular: '01/01/1990',
        codigo_resp_financeiro: '',
        nome_resp_financeiro: '',
        cpf_resp_financeiro: '',
        possui_resp_financeiro: 'N',
        pes_cod: digits.slice(-6),
        nome_empresa: isPJ ? `Empresa ${digits.slice(-4)}` : '',
        cnpj_caepf_empresa: isPJ ? digits.padStart(14, '0') : '',
    };
}
export async function consultarPessoaPorDocumento(documento) {
    const tryRemote = async () => {
        const token = await getToken();
        // O nome do campo enviado ao endpoint pode variar. Deixe configuravel.
        const fieldName = CONFIG.PESSOAS_DOC_FIELD || 'documento';
        const digits = onlyDigits(documento);
        const body = {
            [fieldName]: digits,
        };
        const r = await fetch(API_PESSOAS, {
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
        const selected = content.find((item) => onlyDigits(item?.cpf_titular || item?.cpf) === digits) ||
            content[0] ||
            null;
        if (!selected)
            return null;
        return {
            nome_titular: selected?.nome_titular || selected?.nome || selected?.nome_pessoa,
            cpf_titular: selected?.cpf_titular || selected?.cpf || documento,
            tipo_plano: selected?.tipo_plano || selected?.tip_pessoa,
            registro_ans: selected?.registro_ans?.trim?.() || selected?.contrato,
            codigo_pessoa_titular: selected?.codigo_pessoa_titular || selected?.codigo_pessoa || selected?.cod_pessoa,
            data_nascimento_titular: selected?.data_nascimento_titular || selected?.data_nascimento || selected?.dt_nasc,
            codigo_resp_financeiro: selected?.codigo_resp_financeiro ?? '',
            nome_resp_financeiro: selected?.nome_resp_financeiro ?? '',
            cpf_resp_financeiro: selected?.cpf_resp_financeiro ?? '',
            possui_resp_financeiro: selected?.possui_resp_financeiro ?? 'N',
            pes_cod: selected?.pes_cod ?? selected?.codigo_pessoa ?? selected?.cod_pessoa,
            nome_empresa: selected?.nome_empresa ?? '',
            cnpj_caepf_empresa: selected?.cnpj_caepf_empresa ?? '',
        };
    };
    try {
        return await tryRemote();
    }
    catch (err) {
        if (CONFIG.MOCK_PESSOAS) {
            console.warn(`[MOCK] Gerando usuario ficticio para CPF/CNPJ: ${documento}`);
            return gerarMockPessoa(documento);
        }
        throw err;
    }
}
