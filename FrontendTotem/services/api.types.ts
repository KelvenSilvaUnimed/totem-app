// Tipos e interfaces para a API do Totem

// Resposta do endpoint de lookup (identificação do beneficiário)
export interface Beneficiario {
  nome: string;
  documento: string;
  contrato?: string;
  tipoPessoa: 'PF' | 'PJ';
  tipoPlano?: string;
}

// Fatura em aberto
export interface Fatura {
  numeroFatura?: string;
  numerofatura?: string;
  numerofaturacontrole?: string;
  numero?: string;
  vencimento?: string;
  vencimentofatura?: string;
  dataVencimento?: string;
  data_vencimento?: string;
  valor?: number | string;
  valorfatura?: number | string;
  valor_fatura?: number | string;
  valorComDesconto?: number | string;
}

// Resposta da busca de faturas
export interface FaturasResponse {
  content: Fatura[];
}

// Boleto
export interface BoletoResult {
  kind: 'blob' | 'remote';
  url: string;
  blob?: Blob;
  remoteUrl?: string;
  numero?: string;
}

// Estado do aplicativo
export interface AppState {
  beneficiario: Beneficiario | null;
  servicoSelecionado: string | null;
  contratoInformado: string | null;
  cnpjInformado: string | null;
  faturas: Fatura[];
  boletoAtual: {
    numero: string | null;
    url: string | null;
    kind?: 'blob' | 'remote';
    remoteUrl?: string;
  };
}

// Resposta de erro da API
export interface ApiError {
  error: string;
  message?: string;
}

