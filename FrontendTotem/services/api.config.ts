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
const BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000' || 'http://192.168.177.77:3000'
);

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
