import { useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  buscarBoleto,
  buscarFaturas,
  getPdfViewerUrl,
  imprimirBoleto,
  lookupByCpf,
} from '@/services/api.service';
import type { Beneficiario, BoletoResult, Fatura } from '@/services/api.types';
import {
  digits,
  escolherPrimeiroValor,
  formatarData,
  formatarValor,
  normalizeDataTitularToDdmmYyyyDigits,
  formatNomeCompleto,
} from '@/services/utils.service';

export type Step =
  | 'cpf'
  | 'validacao'
  | 'resp_financeiro'
  | 'resp_financeiro_ajuda'
  | 'cpf_resp_financeiro'
  | 'faturas';

type StatusType = 'ok' | 'warn' | 'err';

type PendingFaturasRequest = {
  cpfCnpj: string;
  segundoParam: string;
  opts?: { segundoCampo: 'contrato' | 'data_nascimento_titular' };
};

export interface TotemController {
  // Estado
  step: Step;
  cpf: string;
  setCpf: (v: string) => void;
  campoComplementar: string;
  setCampoComplementar: (v: string) => void;
  loading: boolean;
  status: { type: StatusType; message: string } | null;
  beneficiario: Beneficiario | null;
  faturas: Fatura[];
  selectedFatura: string | null;
  boletoAtual: BoletoResult | null;
  boletoModalUrl: string | null;
  isBoletoModalVisible: boolean;
  isPessoaJuridica: boolean;
  resumoFaturas: string;
  nomeEmpresaDoLookup: string;
  cpfRespFinanceiro: string;
  setCpfRespFinanceiro: (v: string) => void;
  resetarFluxoRef: React.MutableRefObject<() => void>;

  // Handlers
  setStep: (step: Step) => void;
  handleLookup: () => Promise<void>;
  handleConfirmarValidacao: () => void;
  handleContinuarRespFinanceiro: () => void;
  handleVisualizarLinha: (item: Fatura, index: number) => Promise<void>;
  handleImprimirLinha: (item: Fatura, index: number) => Promise<void>;
  handleImprimir: () => Promise<void>;
  handleFecharBoletoModal: () => void;
  handleEncerrarAtendimento: () => void;
  handleVoltarParaFaturas: () => void;
  handleVoltarParaValidacao: () => void;
  handleConfirmarCpfRespFinanceiro: () => void;
  resetarFluxo: () => void;

  // Helpers de fatura
  getNumeroFatura: (item: Fatura, index: number) => string;
  formatarValorFatura: (item: Fatura) => string;
  formatarDataFatura: (item: Fatura) => string;
}

/** Controller central do fluxo Totem — toda a lógica de negócio. */
export function useTotemController(): TotemController {
  const [step, setStep] = useState<Step>('cpf');
  const [cpf, setCpf] = useState('');
  const [campoComplementar, setCampoComplementar] = useState('');
  const [cpfRespFinanceiro, setCpfRespFinanceiro] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: StatusType; message: string } | null>(null);
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [selectedFatura, setSelectedFatura] = useState<string | null>(null);
  const [boletoAtual, setBoletoAtual] = useState<BoletoResult | null>(null);
  const [boletoModalUrl, setBoletoModalUrl] = useState<string | null>(null);
  const [isBoletoModalVisible, setIsBoletoModalVisible] = useState(false);
  const [pendingFaturasRequest, setPendingFaturasRequest] = useState<PendingFaturasRequest | null>(null);

  const resetarFluxoRef = useRef<() => void>(() => {});

  // ── Derivações ──────────────────────────────────────────────────────────────
  const getTipoPessoa = (data?: Beneficiario | null): 'PF' | 'PJ' =>
    String(data?.tipo_plano || '').trim().toUpperCase() === 'PJ' ? 'PJ' : 'PF';

  const isPessoaJuridica = getTipoPessoa(beneficiario) === 'PJ';

  const resumoFaturas = useMemo(() => {
    if (!faturas.length) return '';
    return `Encontramos ${faturas.length} fatura${faturas.length > 1 ? 's' : ''} em aberto.`;
  }, [faturas]);

  const nomeEmpresaDoLookup = (() => {
    const nome = beneficiario?.nome_empresa?.trim() || '';
    // A API Unimed retorna esses placeholders para PF — não exibir na tela
    if (!nome || nome.toUpperCase().includes('NÃO POSSUI') || nome.toUpperCase().includes('NAO POSSUI')) return '';
    return nome;
  })();

  // ── Helpers de fatura ───────────────────────────────────────────────────────
  const getNumeroFatura = (item: Fatura, index: number): string => {
    const val = escolherPrimeiroValor(
      item as Record<string, string | undefined>,
      ['numeroFatura', 'numerofatura', 'numerofaturacontrole', 'numero'],
      undefined,
    ) as string | undefined;
    return val?.trim() || String(index + 1).padStart(2, '0');
  };

  const formatarValorFatura = (item: Fatura): string => {
    const raw = escolherPrimeiroValor(
      item as any,
      ['valor', 'valorfatura', 'valor_fatura', 'valorComDesconto'],
    );
    if (raw == null) return 'R$ --';
    const str = String(raw).trim();
    // Já vem formatado pela API (ex: "R$ 319,13")
    if (str.startsWith('R$') || str.includes(',')) return str;
    // Numérico puro
    const resultado = formatarValor(raw as number | string | null | undefined);
    return resultado || str || 'R$ --';
  };

  const formatarDataFatura = (item: Fatura): string => {
    const raw = escolherPrimeiroValor(item as any, [
      'vencimento',
      'vencimentofatura',
      'dataVencimento',
      'data_vencimento',
    ]) as string | undefined;
    if (!raw) return 'N/D';
    const str = String(raw).trim();
    // Já vem formatada como DD/MM/AAAA pela API
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
    // Tenta converter outros formatos
    return formatarData(str) || str || 'N/D';
  };

  // ── Utilitários internos ────────────────────────────────────────────────────
  const setStatusMessage = (type: StatusType, message: string) => setStatus({ type, message });

  const possuiRespFinanceiroAtivo = (b: Beneficiario | null) => {
    const flag = String(b?.possui_resp_financeiro ?? '').trim().toUpperCase();
    return flag === 'S' && Boolean(b?.nome_resp_financeiro?.trim());
  };

  // ── API calls ───────────────────────────────────────────────────────────────
  const carregarFaturas = async (
    cpfCnpj: string,
    segundoParam: string,
    opts?: { segundoCampo: 'contrato' | 'data_nascimento_titular' },
    cpfResp?: string,
  ) => {
    setLoading(true);
    setStatus(null);
    try {
      const cnpjPJ =
        getTipoPessoa(beneficiario) === 'PJ' && opts?.segundoCampo === 'contrato'
          ? beneficiario?.cnpj_caepf_empresa
          : undefined;
      const { faturas: lista } = await buscarFaturas(cpfCnpj, segundoParam, opts, cpfResp, cnpjPJ);
      // Lista vazia não indica contrato inválido: pode não haver faturas em aberto. O backend valida contrato/CNPJ quando possível.
      if (getTipoPessoa(beneficiario) === 'PJ' && opts?.segundoCampo === 'contrato' && lista.length === 0) {
        setFaturas([]);
        setSelectedFatura(null);
        setBoletoAtual(null);
        setStep('faturas');
        setStatusMessage(
          'warn',
          'Não encontramos faturas em aberto para estes dados.',
        );
        return;
      }
      setFaturas(lista);
      setStep('faturas');
      setStatusMessage('ok', `Encontramos ${lista.length} fatura${lista.length === 1 ? '' : 's'} em aberto.`);
    } catch (error: any) {
      setStatusMessage('err', error?.message || 'Falha ao buscar faturas.');
    } finally {
      setLoading(false);
    }
  };

  const solicitarFaturasComEtapaRespFinanceiro = (
    cpfCnpj: string,
    segundoParam: string,
    opts: { segundoCampo: 'contrato' | 'data_nascimento_titular' } | undefined,
  ) => {
    // Verifica se possui responsável financeiro ativo (dados vêm do lookup)
    if (possuiRespFinanceiroAtivo(beneficiario)) {
      setStatus(null);
      setPendingFaturasRequest({ cpfCnpj, segundoParam, opts });
      setStep('resp_financeiro'); // Mostra nome do resp. financeiro
      return;
    }
    void carregarFaturas(cpfCnpj, segundoParam, opts);
  };

  const carregarEBoleto = async (item: Fatura, index: number): Promise<BoletoResult | null> => {
    const numero = getNumeroFatura(item, index);
    setSelectedFatura(numero);
    setStatusMessage('warn', `Carregando boleto da fatura ${numero}...`);
    setLoading(true);
    try {
      const boleto = await buscarBoleto(numero);
      const withNum = { ...boleto, numero };
      setBoletoAtual(withNum);
      setStatusMessage('ok', `Boleto da fatura ${numero} pronto!`);
      return withNum;
    } catch (error: any) {
      setStatusMessage('err', error?.message || 'Falha ao carregar o boleto.');
      setSelectedFatura(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers públicos ───────────────────────────────────────────────────────
  const handleLookup = async () => {
    const d = digits(cpf);
    if (d.length !== 11) { setStatusMessage('warn', 'Digite um CPF válido com 11 números.'); return; }
    setLoading(true);
    setStatus(null);
    try {
      const result = await lookupByCpf(d);
      setCampoComplementar('');
      setFaturas([]);
      setSelectedFatura(null);
      setBoletoAtual(null);
      setPendingFaturasRequest(null);
      setBeneficiario(result);
      setStep('validacao');
      setStatusMessage('ok', `Bem-vindo, ${formatNomeCompleto(result.nome_titular || '')}!`);
    } catch (error: any) {
      setStatusMessage('err', error?.message || 'Não foi possível validar o CPF.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarValidacao = () => {
    if (!beneficiario) { setStatusMessage('warn', 'Valide um CPF antes de continuar.'); setStep('cpf'); return; }
    const cpfTitular = digits(beneficiario.cpf_titular || '');
    if (cpfTitular.length !== 11) { setStatusMessage('err', 'CPF do titular inválido no cadastro.'); return; }

    if (isPessoaJuridica) {
      const contratoDigits = digits(campoComplementar);
      if (!contratoDigits) { setStatusMessage('warn', 'Informe o número do contrato.'); return; }
      solicitarFaturasComEtapaRespFinanceiro(cpfTitular, contratoDigits, { segundoCampo: 'contrato' });
      return;
    }

    const dataNascimentoDigits = digits(campoComplementar);
    if (dataNascimentoDigits.length !== 8) {
      setStatusMessage('warn', 'Informe a data de nascimento completa (DD/MM/AAAA).');
      return;
    }
    const dataNascimentoCadastro = normalizeDataTitularToDdmmYyyyDigits(beneficiario.data_nascimento_titular);
    if (dataNascimentoCadastro && dataNascimentoDigits !== dataNascimentoCadastro) {
      setStatusMessage('warn', 'A data de nascimento não confere com o cadastro.');
      return;
    }
    solicitarFaturasComEtapaRespFinanceiro(cpfTitular, dataNascimentoDigits, {
      segundoCampo: 'data_nascimento_titular',
    });
  };

  const handleContinuarRespFinanceiro = () => {
    if (!pendingFaturasRequest) return;
    const p = pendingFaturasRequest;
    // Avança para pedir CPF do responsável financeiro (confirmação da identidade)
    setCpfRespFinanceiro('');
    setStep('cpf_resp_financeiro');
  };

  const handleConfirmarCpfRespFinanceiro = () => {
    if (!pendingFaturasRequest) return;
    const cpfDigits = digits(cpfRespFinanceiro);
    if (cpfDigits.length !== 11) {
      setStatusMessage('warn', 'Informe o CPF do responsável financeiro com 11 dígitos.');
      return;
    }
    const p = pendingFaturasRequest;
    setPendingFaturasRequest(null);
    void carregarFaturas(p.cpfCnpj, p.segundoParam, p.opts, cpfDigits);
  };

  const handleVisualizarLinha = async (item: Fatura, index: number) => {
    const numero = getNumeroFatura(item, index);
    if (boletoAtual && boletoAtual.numero === numero) { await handleVisualizar(boletoAtual); return; }
    const boleto = await carregarEBoleto(item, index);
    if (boleto) await handleVisualizar(boleto);
  };

  const handleImprimirLinha = async (item: Fatura, index: number) => {
    const numero = getNumeroFatura(item, index);
    if (boletoAtual && boletoAtual.numero === numero) { await handleImprimir(); return; }
    const boleto = await carregarEBoleto(item, index);
    if (boleto) await handleImprimir();
  };

  const handleVisualizar = async (boletoOverride?: BoletoResult) => {
    const boleto = boletoOverride ?? boletoAtual;
    if (!boleto) { Alert.alert('Aviso', 'Nenhum boleto carregado.'); return; }
    const rawUrl = boleto.remoteUrl || boleto.url;
    if (!rawUrl) { Alert.alert('Erro', 'Não foi possível abrir o boleto.'); return; }
    const isHttp = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');
    const isProxy = rawUrl.includes('/api/pdf');
    const url = isHttp && !isProxy ? getPdfViewerUrl(rawUrl) : rawUrl;
    if (!url) { Alert.alert('Erro', 'Não foi possível abrir o boleto.'); return; }
    setBoletoModalUrl(url);
    setIsBoletoModalVisible(true);
  };

  const handleImprimir = async () => {
    if (!boletoAtual || !selectedFatura) { Alert.alert('Aviso', 'Nenhum boleto carregado.'); return; }
    setLoading(true);
    try {
      const result = await imprimirBoleto(
        selectedFatura,
        boletoAtual.remoteUrl || (boletoAtual.kind === 'remote' ? boletoAtual.url : undefined),
      );
      Alert.alert('Sucesso', `Enviado para a impressora${result.printer ? ` (${result.printer})` : ''}.`);
    } catch {
      Alert.alert('Atenção', 'Não foi possível enviar para a impressora automaticamente. Você pode visualizar o boleto e imprimir manualmente.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Visualizar', onPress: () => handleVisualizar() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFecharBoletoModal = () => {
    setIsBoletoModalVisible(false);
    setBoletoModalUrl(null);
  };

  const handleEncerrarAtendimento = () => { handleFecharBoletoModal(); resetarFluxo(); };

  const handleVoltarParaFaturas = () => {
    handleFecharBoletoModal();
    setBoletoAtual(null);
    setSelectedFatura(null);
    setStatus(null);
    setStep('faturas');
  };

  const handleVoltarParaValidacao = () => {
    setBoletoAtual(null);
    setSelectedFatura(null);
    setFaturas([]);
    setStep('validacao');
  };

  const resetarFluxo = () => {
    setIsBoletoModalVisible(false);
    setBoletoModalUrl(null);
    setCpf('');
    setCampoComplementar('');
    setCpfRespFinanceiro('');
    setPendingFaturasRequest(null);
    setBeneficiario(null);
    setFaturas([]);
    setSelectedFatura(null);
    setBoletoAtual(null);
    setStep('cpf');
    setStatus(null);
  };

  resetarFluxoRef.current = resetarFluxo;

  return {
    step, setStep, cpf, setCpf, campoComplementar, setCampoComplementar,
    cpfRespFinanceiro, setCpfRespFinanceiro,
    loading, status, beneficiario, faturas, selectedFatura,
    boletoAtual, boletoModalUrl, isBoletoModalVisible,
    isPessoaJuridica, resumoFaturas, nomeEmpresaDoLookup,
    resetarFluxoRef,
    handleLookup, handleConfirmarValidacao, handleContinuarRespFinanceiro,
    handleConfirmarCpfRespFinanceiro,
    handleVisualizarLinha, handleImprimirLinha, handleImprimir,
    handleFecharBoletoModal, handleEncerrarAtendimento,
    handleVoltarParaFaturas, handleVoltarParaValidacao,
    resetarFluxo,
    getNumeroFatura, formatarValorFatura, formatarDataFatura,
  };
}
