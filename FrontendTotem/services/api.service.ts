import axios from 'axios';
import { API_CONFIG } from './api.config';
import type { Beneficiario, BoletoResult, BuscarFaturasResult, Fatura } from './api.types';

const { BASE_URL, ENDPOINTS, TIMEOUT } = API_CONFIG;

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

function pickNomeEmpresaLookup(data: Record<string, unknown>): string | undefined {
  const keys = [
    'nome_empresa',
    'nomeEmpresa',
    'razao_social',
    'razaoSocial',
    'nome_fantasia',
    'nomeFantasia',
  ];
  for (const k of keys) {
    const v = data[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

/**
 * Busca dados do beneficiário pelo CPF
 * POST /api/identificacao/lookup
 */
export async function lookupByCpf(cpf: string): Promise<Beneficiario> {
  try {
    const response = await api.post(ENDPOINTS.LOOKUP, { documento: cpf });
    const data = response.data as Record<string, unknown>;
    const nomeEmpresa = pickNomeEmpresaLookup(data);
    const base = { ...(data as object) } as Beneficiario;
    if (nomeEmpresa) base.nome_empresa = nomeEmpresa;
    return base;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Erro ao buscar beneficiário';
    throw new Error(message);
  }
}

export type BuscarFaturasSegundoCampo = 'contrato' | 'data_nascimento_titular';

/**
 * Busca faturas em aberto
 * POST /api/faturas
 * — `segundoParam`: número do contrato (PF) ou data de nascimento do titular em 8 dígitos DDMMAAAA (PJ).
 */
export async function buscarFaturas(
  cpfCnpj: string,
  segundoParam: string,
  opts?: { segundoCampo?: BuscarFaturasSegundoCampo }
): Promise<BuscarFaturasResult> {
  try {
    const segundoCampo = opts?.segundoCampo ?? 'contrato';
    const body =
      segundoCampo === 'data_nascimento_titular'
        ? { cpfCnpj, data_nascimento_titular: segundoParam }
        : { cpfCnpj, contrato: segundoParam };
    const response = await api.post(ENDPOINTS.FATURAS, body);
    const data = response.data;
    const faturas = Array.isArray(data?.content) ? data.content : [];
    const rawNome = data?.nome_empresa ?? (data as { nomeEmpresa?: string })?.nomeEmpresa;
    const nomeEmpresa =
      typeof rawNome === 'string' && rawNome.trim() ? rawNome.trim() : undefined;
    return { faturas, nomeEmpresa };
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Erro ao buscar faturas';
    throw new Error(message);
  }
}

/**
 * Busca boleto de uma fatura específica
 * POST /api/boleto
 */
export async function buscarBoleto(numeroFatura: string): Promise<BoletoResult> {
  try {
    const response = await api.post(
      ENDPOINTS.BOLETO,
      { numeroFatura, prefer: 'stream' },
      {
        headers: {
          Accept: 'application/pdf, application/json',
        },
        responseType: 'json', // Esperamos JSON com URL
      }
    );

    // Se a resposta tiver uma URL
    if (response.data?.url) {
      return {
        kind: 'remote',
        url: response.data.url,
        remoteUrl: response.data.url,
      };
    }

    throw new Error('Resposta inesperada de /api/boleto');
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Erro ao buscar boleto';
    throw new Error(message);
  }
}

/**
 * Proxy para baixar PDF de URL remota
 * POST /api/boleto/proxy
 */
export async function proxyParaBlob(urlRemota: string): Promise<BoletoResult> {
  try {
    const response = await api.post(
      ENDPOINTS.BOLETO_PROXY,
      { url: urlRemota },
      {
        headers: {
          Accept: 'application/pdf',
        },
        responseType: 'blob',
      }
    );

    const blob = response.data;
    const pdfBlob = blob.type === 'application/pdf' 
      ? blob 
      : new Blob([blob], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);

    return {
      kind: 'blob',
      url: blobUrl,
      blob: pdfBlob,
    };
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Erro no proxy';
    throw new Error(message);
  }
}

/**
 * Envia boleto para impressora
 * POST /api/boleto/print
 */
export async function imprimirBoleto(
  numeroFatura: string,
  urlRemota?: string
): Promise<{ ok: boolean; printer?: string; error?: string }> {
  try {
    const response = await api.post(ENDPOINTS.BOLETO_PRINT, {
      numeroFatura,
      url: urlRemota,
    });

    if (!response.data?.ok) {
      throw new Error(response.data?.error || 'Falha ao imprimir');
    }

    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Erro ao imprimir';
    throw new Error(message);
  }
}

/**
 * Gera URL para visualização do PDF
 */
export function getPdfViewerUrl(remoteUrl: string): string {
  return `${BASE_URL}${ENDPOINTS.PDF_VIEWER}?url=${encodeURIComponent(remoteUrl)}&t=${Date.now()}`;
}

/**
 * Utilitários
 */
export const utils = {
  // Remove tudo que não é número
  digits: (value: string): string => (value || '').replace(/\D/g, ''),

  // Formata nome completo (primeira letra maiúscula)
  formatNomeCompleto: (nome: string): string => {
    if (!nome) return 'Beneficiário';
    return nome
      .trim()
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  },

  /** DD/MM/AAAA a partir de até 8 dígitos digitados. */
  formatDataNascimentoInput: (value: string): string => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  },

  /**
   * Normaliza `data_nascimento_titular` (lookup) para 8 dígitos DDMMAAAA, para comparar com o digitado.
   */
  normalizeDataTitularToDdmmYyyyDigits: (value: string | undefined | null): string | null => {
    if (value == null || String(value).trim() === '') return null;
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const [y, m, dd] = s.slice(0, 10).split('-');
      if (y && m && dd) return `${dd}${m}${y}`;
    }
    const d = s.replace(/\D/g, '');
    if (d.length !== 8) return null;
    const y = parseInt(d.slice(0, 4), 10);
    if (y >= 1900 && y <= 2100) {
      return `${d.slice(6)}${d.slice(4, 6)}${d.slice(0, 4)}`;
    }
    return d;
  },

  // Formata data no padrão brasileiro
  formatarData: (value: string): string | null => {
    if (!value) return null;
    const s = String(value).trim();
    
    // Formato DDMMYYYY
    if (/^\d{8}$/.test(s)) {
      return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4)}`;
    }
    
    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const [a, m, d] = s.split('-');
      return `${d}/${m}/${a}`;
    }
    
    return s;
  },

  // Formata valor monetário
  formatarValor: (value: number | string | null | undefined): string | null => {
    if (value == null) return null;
    const n = Number(String(value).replace(',', '.'));
    return Number.isFinite(n)
      ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : String(value);
  },

  // Pega primeiro valor disponível de um objeto
  escolherPrimeiroValor: <T>(
    obj: Record<string, T> | null,
    chaves: string[],
    fallback: T | null = null
  ): T | null => {
    if (!obj) return fallback;
    for (const k of chaves) {
      if (obj[k] != null) return obj[k];
    }
    return fallback;
  },
};
