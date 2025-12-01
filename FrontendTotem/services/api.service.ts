import axios from 'axios';
import { API_CONFIG } from './api.config';
import type { Beneficiario, BoletoResult, Fatura } from './api.types';

const { BASE_URL, ENDPOINTS, TIMEOUT } = API_CONFIG;

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Busca dados do beneficiário pelo CPF
 * POST /api/identificacao/lookup
 */
export async function lookupByCpf(cpf: string): Promise<Beneficiario> {
  try {
    const response = await api.post(ENDPOINTS.LOOKUP, { documento: cpf });
    return response.data as Beneficiario;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Erro ao buscar beneficiário';
    throw new Error(message);
  }
}

/**
 * Busca faturas em aberto
 * POST /api/faturas
 */
export async function buscarFaturas(
  cpfCnpj: string,
  contrato: string
): Promise<Fatura[]> {
  try {
    const response = await api.post(ENDPOINTS.FATURAS, { cpfCnpj, contrato });
    return Array.isArray(response.data?.content) ? response.data.content : [];
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
