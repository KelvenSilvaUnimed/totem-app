import { fetch } from 'undici';
import { getToken } from './token.js';

const API_VALIDACAO =
  'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177-valida-nome-benef';

export async function validarNomeBenef(payload: Record<string, any>) {
  const token = await getToken();

  const r = await fetch(API_VALIDACAO, {
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

  const data = (await r.json()) as { content?: any[] };
  const first = Array.isArray(data?.content) ? data.content[0] : null;
  return first ?? null;
}

