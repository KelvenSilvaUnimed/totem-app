const normalizeBaseUrl = (url?: string) => {
  const value = url && url.trim() ? url.trim() : '';
  return value.replace(/\/+$/, '');
};

const normalizePrefix = (prefix?: string) => {
  if (!prefix) return '';
  const cleaned = prefix.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  return cleaned ? `/${cleaned}` : '';
};

/**
 * Em dev, o frontend (Expo) e o backend ficam em portas diferentes,
 * então precisamos de uma base URL absoluta (ex.: http://localhost:3000).
 *
 * Configure via env:
 * - EXPO_PUBLIC_API_URL (recomendado)
 * - API_URL (fallback)
 */
const getDynamicBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) return process.env.EXPO_PUBLIC_API_BASE_URL;
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (process.env.API_URL) return process.env.API_URL;
  
  // Se estiver rodando no navegador (web), detectamos o ambiente de forma dinâmica
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const hostname = window.location.hostname;
    
    // Se for localhost (Dev local), direciona diretamente para a porta do backend local (3000)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // Em produção (subdomínio da Unimed), usa a rota relativa (/api) pelo Nginx reverse-proxy
    return window.location.origin;
  }
  
  return 'http://localhost:3000';
};

const BASE_URL = normalizeBaseUrl(getDynamicBaseUrl());

const API_PREFIX = normalizePrefix(process.env.EXPO_PUBLIC_API_PREFIX || process.env.API_PREFIX || '');
const withPrefix = (path: string) => `${API_PREFIX}${path}`;

export const API_CONFIG = {
  BASE_URL,

  ENDPOINTS: {
    LOOKUP: withPrefix('/api/identificacao/lookup'),
    FATURAS: withPrefix('/api/faturas'),
    BOLETO: withPrefix('/api/boleto'),
    BOLETO_PROXY: withPrefix('/api/boleto/proxy'),
    BOLETO_PRINT: withPrefix('/api/boleto/print'),
    BOLETO_VIEW: withPrefix('/api/boleto/view'),
    PDF_VIEWER: withPrefix('/api/pdf'),
  },

  HEADERS: {
    'Content-Type': 'application/json',
  },

  TIMEOUT: 30000,
};
