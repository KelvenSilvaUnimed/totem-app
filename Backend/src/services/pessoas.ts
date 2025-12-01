import { fetch } from 'undici';
import { CONFIG } from '../config/env.js';
import { getToken } from './token.js';
import { onlyDigits } from '../utils/strings.js';

const API_PESSOAS =
  'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177-consulta-dados-pessoas';

export type PessoaRecord = {
  carteirinha?: string;
  contrato?: string;
  cod_pessoa?: string;
  tip_pessoa?: 'F' | 'J';
  nome_pessoa?: string;
  nome_mae?: string;
  dt_nasc?: string;
  doc_pessoa_s_formatacao?: string;
  doc_pessoa_formatado?: string;
};

function gerarMockPessoa(documento: string): PessoaRecord {
  const digits = onlyDigits(documento) || '00000000000';
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

export async function consultarPessoaPorDocumento(
  documento: string
): Promise<PessoaRecord | null> {
  const tryRemote = async () => {
    const token = await getToken();

    // O nome do campo enviado ao endpoint pode variar. Deixe configuravel.
    const fieldName = CONFIG.PESSOAS_DOC_FIELD || 'documento';
    const body: Record<string, any> = {
      [fieldName]: Number(onlyDigits(documento)),
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

    const data = (await r.json()) as { content?: PessoaRecord[]; numberOfElements?: string };
    const first = Array.isArray(data?.content) ? data.content[0] : null;
    return first ?? null;
  };

  try {
    return await tryRemote();
  } catch (err) {
    if (CONFIG.MOCK_PESSOAS) {
      console.warn(`[MOCK] Gerando usuario ficticio para CPF/CNPJ: ${documento}`);
      return gerarMockPessoa(documento);
    }
    throw err;
  }
}
