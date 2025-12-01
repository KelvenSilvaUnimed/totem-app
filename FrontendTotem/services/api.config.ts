export const API_CONFIG = {

  BASE_URL: 'http://localhost:3000',  // Backend rodando local

  // Endpoints da API
  ENDPOINTS: {
    LOOKUP: '/api/identificacao/lookup',
    FATURAS: '/api/faturas',
    BOLETO: '/api/boleto',
    BOLETO_PROXY: '/api/boleto/proxy',
    BOLETO_PRINT: '/api/boleto/print',
    
    PDF_VIEWER: '/api/pdf',
  },

  HEADERS: {
    'Content-Type': 'application/json',
  },

  TIMEOUT: 30000,
};

