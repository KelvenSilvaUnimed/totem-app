const normalizeBaseUrl = (url?: string) =>
  (url && url.trim() ? url.trim() : 'http://192.168.178.130:3000').replace(/\/+$/, '');

const normalizePrefix = (prefix?: string) => {
  if (!prefix) return '';
  const cleaned = prefix.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  return cleaned ? `/${cleaned}` : '';
};

const BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
const API_PREFIX = normalizePrefix(process.env.EXPO_PUBLIC_API_PREFIX);
const withPrefix = (path: string) => `${API_PREFIX}${path}`;

export const API_CONFIG = {
  BASE_URL,

  ENDPOINTS: {
    LOOKUP: withPrefix('/api/identificacao/lookup'),
    FATURAS: withPrefix('/api/faturas'),
    BOLETO: withPrefix('/api/boleto'),
    BOLETO_PROXY: withPrefix('/api/boleto/proxy'),
    BOLETO_PRINT: withPrefix('/api/boleto/print'),
    PDF_VIEWER: withPrefix('/api/pdf'),
  },

  HEADERS: {
    'Content-Type': 'application/json',
  },

  TIMEOUT: 30000,
};
