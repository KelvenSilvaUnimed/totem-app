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

export async function consultarPessoaPorDocumento(
  documento: string
): Promise<PessoaRecord | null> {
  const token = await getToken();

  // O nome do campo enviado ao endpoint pode variar. Deixe configurável.
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
}
