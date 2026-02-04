// Tipos e interfaces para a API do Totem

// Resposta do endpoint de lookup (identificacao do beneficiario)
export interface Beneficiario {
  nome_titular?: string;
  cpf_titular?: string;
  tipo_plano?: string;
  registro_ans?: string;
  codigo_pessoa_titular?: string;
  data_nascimento_titular?: string;
  codigo_resp_financeiro?: string;
  nome_resp_financeiro?: string;
  cpf_resp_financeiro?: string;
  possui_resp_financeiro?: string;
  pes_cod?: string;
  nome_empresa?: string;
  cnpj_caepf_empresa?: string;
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
