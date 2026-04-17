import axios from 'axios';
import { API_CONFIG } from './api.config';
import type { Beneficiario, BoletoResult, BuscarFaturasResult } from './api.types';

const { BASE_URL, ENDPOINTS, TIMEOUT } = API_CONFIG;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

function pickNomeEmpresaLookup(data: Record<string, unknown>): string | undefined {
  const keys = ['nome_empresa', 'nomeEmpresa', 'razao_social', 'razaoSocial', 'nome_fantasia', 'nomeFantasia'];
  for (const k of keys) {
    const v = data[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

/** POST /api/identificacao/lookup */
export async function lookupByCpf(cpf: string): Promise<Beneficiario> {
  try {
    const response = await api.post(ENDPOINTS.LOOKUP, { documento: cpf });
    const data = response.data as Record<string, unknown>;
    const nomeEmpresa = pickNomeEmpresaLookup(data);
    const base = { ...(data as object) } as Beneficiario;
    if (nomeEmpresa) base.nome_empresa = nomeEmpresa;
    return base;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Erro ao buscar beneficiário');
  }
}

export type BuscarFaturasSegundoCampo = 'contrato' | 'data_nascimento_titular';

/** POST /api/faturas */
export async function buscarFaturas(
  cpfCnpj: string,
  segundoParam: string,
  opts?: { segundoCampo?: BuscarFaturasSegundoCampo },
  cpfRespFinanceiro?: string,
): Promise<BuscarFaturasResult> {
  try {
    const segundoCampo = opts?.segundoCampo ?? 'contrato';
    let body: Record<string, string>;

    if (segundoCampo === 'data_nascimento_titular') {
      body = { cpfCnpj, data_nascimento_titular: segundoParam };
      if (cpfRespFinanceiro) body.cpf_resp_financeiro = cpfRespFinanceiro;
    } else {
      // contrato (PJ)
      body = { cpfCnpj, contrato: segundoParam };
    }

    const response = await api.post(ENDPOINTS.FATURAS, body);
    const data = response.data;
    const faturas = Array.isArray(data?.content) ? data.content : [];
    const rawNome = data?.nome_empresa ?? (data as { nomeEmpresa?: string })?.nomeEmpresa
      ?? data?.info?.empresa;
    const nomeEmpresa = typeof rawNome === 'string' && rawNome.trim() ? rawNome.trim() : undefined;
    return { faturas, nomeEmpresa };
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Erro ao buscar faturas');
  }
}

/** POST /api/boleto */
export async function buscarBoleto(numeroFatura: string): Promise<BoletoResult> {
  try {
    const response = await api.post(
      ENDPOINTS.BOLETO,
      { numeroFatura, prefer: 'stream' },
      { headers: { Accept: 'application/pdf, application/json' }, responseType: 'json' },
    );
    if (response.data?.url) {
      return { kind: 'remote', url: response.data.url, remoteUrl: response.data.url };
    }
    throw new Error('Resposta inesperada de /api/boleto');
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Erro ao buscar boleto');
  }
}

/** POST /api/boleto/proxy */
export async function proxyParaBlob(urlRemota: string): Promise<BoletoResult> {
  try {
    const response = await api.post(
      ENDPOINTS.BOLETO_PROXY,
      { url: urlRemota },
      { headers: { Accept: 'application/pdf' }, responseType: 'blob' },
    );
    const blob = response.data;
    const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    return { kind: 'blob', url: URL.createObjectURL(pdfBlob), blob: pdfBlob };
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Erro no proxy');
  }
}

/** POST /api/boleto/print */
export async function imprimirBoleto(
  numeroFatura: string,
  urlRemota?: string,
): Promise<{ ok: boolean; printer?: string; error?: string }> {
  try {
    const response = await api.post(ENDPOINTS.BOLETO_PRINT, { numeroFatura, url: urlRemota });
    if (!response.data?.ok) throw new Error(response.data?.error || 'Falha ao imprimir');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Erro ao imprimir');
  }
}

/** Gera URL de visualização do PDF via proxy. */
export function getPdfViewerUrl(remoteUrl: string): string {
  return `${BASE_URL}${ENDPOINTS.PDF_VIEWER}?url=${encodeURIComponent(remoteUrl)}&t=${Date.now()}`;
}
