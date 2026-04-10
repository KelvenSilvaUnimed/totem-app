import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { ImageStyle, ScaledSize } from 'react-native';
import { useFullscreen } from 'react-use';
import { useLocalSearchParams } from 'expo-router';

import {
    buscarBoleto,
    buscarFaturas,
    getPdfViewerUrl,
    imprimirBoleto,
    lookupByCpf,
    utils,
} from '@/services/api.service';
import type { Beneficiario, BoletoResult, Fatura } from '@/services/api.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import PdfViewer from '@/components/pdf-viewer';
import styles, { palette } from '@/styles/totem.styles';

type Step =
  | 'cpf'
  | 'servicos'
  | 'contrato'
  | 'resp_financeiro'
  | 'resp_financeiro_ajuda'
  | 'faturas';

type PendingFaturasRequest = {
  cpfCnpj: string;
  segundoParam: string;
  opts?: { segundoCampo: 'contrato' | 'data_nascimento_titular' };
  /** Tela anterior ao confirmar o responsável financeiro. */
  voltarPara: 'servicos' | 'contrato';
};
type StatusType = 'ok' | 'warn' | 'err';

export default function TotemHomeScreen() {
  const rootRef = useRef<View | null>(null);
  const [shouldFullscreen, setShouldFullscreen] = useState(false);
  const resetarFluxoRef = useRef<() => void>(() => {});
  useFullscreen(rootRef as RefObject<Element>, shouldFullscreen, {
    onClose: () => setShouldFullscreen(false),
  });

  const [viewport, setViewport] = useState(() =>
    Dimensions.get(Platform.OS === 'web' ? 'window' : 'screen'),
  );
  const [stableViewport, setStableViewport] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 };
    }
    return Dimensions.get(Platform.OS === 'web' ? 'window' : 'screen');
  });
  const stableViewportRef = useRef(stableViewport);
  const stableWidth =
    stableViewport.width || (Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 0);
  const stableHeight =
    stableViewport.height || (Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerHeight : 0);
  const liveWidth =
    viewport.width || (Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 0);
  const liveHeight =
    viewport.height || (Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerHeight : 0);
  const viewportWidth = Platform.OS === 'web' ? stableWidth : liveWidth;
  const viewportHeight = Platform.OS === 'web' ? stableHeight : liveHeight;
  // Tablet: mobile com tela grande OU web em viewport de tablet
  const viewportMax = Math.max(viewportWidth, viewportHeight);
  const viewportMin = Math.min(viewportWidth, viewportHeight);
  const isWebTablet = Platform.OS === 'web' && viewportMax >= 900 && viewportMax <= 1400 && viewportMin <= 1000;
  // Para dispositivos nativos, aceita dimensões mais amplas (portrait ou landscape)
  const isNativeTablet =
    Platform.OS !== 'web' &&
    (viewportMax >= 900 || viewportMin >= 720);
  const isTablet = isWebTablet || isNativeTablet;
  const atendenteWidth = viewportWidth * (isTablet ? 0.44 : 0.25);
  const atendenteHeight = viewportHeight * (isTablet ? 0.67 : 0.55);
  const [step, setStep] = useState<Step>('cpf');
  const [cpf, setCpf] = useState('');
  /** PF: valida a data com `data_nascimento_titular` do lookup. */
  const [dataNascimentoPF, setDataNascimentoPF] = useState('');
  /** PJ: valida pelo número do contrato informado. */
  const [contratoPJ, setContratoPJ] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: StatusType; message: string } | null>(null);
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [selectedFatura, setSelectedFatura] = useState<string | null>(null);
  const [boletoAtual, setBoletoAtual] = useState<BoletoResult | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightRef = useRef(0);
  const [boletoModalUrl, setBoletoModalUrl] = useState<string | null>(null);
  const [isBoletoModalVisible, setIsBoletoModalVisible] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const isFormFocusedRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [pendingFaturasRequest, setPendingFaturasRequest] = useState<PendingFaturasRequest | null>(null);
  const params = useLocalSearchParams<{ idleReset?: string }>();

  // Quando o layout disparar idleReset, reseta o fluxo deste screen.
  useEffect(() => {
    if (params?.idleReset) {
      resetarFluxoRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.idleReset]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !shouldFullscreen) {
        setShouldFullscreen(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [shouldFullscreen]);

  useEffect(() => {
    stableViewportRef.current = stableViewport;
  }, [stableViewport]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const syncViewport = () => {
      const next = { width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 };
      setViewport(next);
      if (!isFormFocusedRef.current && keyboardHeightRef.current === 0) {
        setStableViewport(next);
      }
    };
    const raf = requestAnimationFrame(syncViewport);
    const timeout = window.setTimeout(syncViewport, 50);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onResize = () => {
      const next = { width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 };
      setViewport(next);
      if (!isFormFocusedRef.current && keyboardHeightRef.current === 0) {
        setStableViewport(next);
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    const onChange = ({ window, screen }: { window: ScaledSize; screen: ScaledSize }) => {
      if (window?.width && window?.height) {
        setViewport(window);
        if (Platform.OS === 'web') {
          const stable = stableViewportRef.current;
          const widthChanged = Math.abs(window.width - stable.width) > 40;
          const heightIncreased = window.height > stable.height + 40;
          const keyboardVisible = isFormFocusedRef.current || keyboardHeightRef.current > 0;
          if (!keyboardVisible || widthChanged || heightIncreased) {
            setStableViewport(window);
          }
        }
      }
      if (Platform.OS !== 'web' && screen?.width && screen?.height) {
        setStableViewport(screen);
      }
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates?.height || 0;
      keyboardHeightRef.current = height;
      setKeyboardHeight(height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
    });
    return () => {
      subscription?.remove?.();
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboard = () => {
      const diff = window.innerHeight - viewport.height - viewport.offsetTop;
      const height = Math.max(0, diff);
      keyboardHeightRef.current = height;
      setKeyboardHeight(height);
    };

    viewport.addEventListener('resize', updateKeyboard);
    viewport.addEventListener('scroll', updateKeyboard);
    updateKeyboard();

    return () => {
      viewport.removeEventListener('resize', updateKeyboard);
      viewport.removeEventListener('scroll', updateKeyboard);
    };
  }, []);


  const resumoFaturas = useMemo(() => {
    if (!faturas.length) return '';
    return `Encontramos ${faturas.length} fatura${faturas.length > 1 ? 's' : ''} em aberto.`;
  }, [faturas]);

  const setStatusMessage = (type: StatusType, message: string) => setStatus({ type, message });

  const formatCpfInput = (value: string) => {
    const digits = utils.digits(value);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const handleLookup = async () => {
    const digits = utils.digits(cpf);
    if (digits.length !== 11) {
      setStatusMessage('warn', 'Digite um CPF válido com 11 números.');
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const result = await lookupByCpf(digits);
      setBeneficiario(result);
      setStep(result.tipo_plano === 'PJ' ? 'contrato' : 'servicos');
      setStatusMessage('ok', `Bem-vindo!!!!, ${utils.formatNomeCompleto(result.nome_titular || '')}.`);
    } catch (error: any) {
      setStatusMessage('err', error?.message || 'Não foi possível validar o CPF.');
    } finally {
      setLoading(false);
    }
  };

  const carregarFaturas = async (
    cpfCnpj: string,
    segundoParam: string,
    opts?: { segundoCampo: 'contrato' | 'data_nascimento_titular' },
  ) => {
    setLoading(true);
    setStatus(null);
    try {
      const { faturas: lista } = await buscarFaturas(cpfCnpj, segundoParam, opts);
      // Regra do totem: se for PJ e a busca por contrato não retornar nada,
      // tratar como "contrato incorreto" e manter na tela do contrato.
      if (beneficiario?.tipo_plano === 'PJ' && opts?.segundoCampo === 'contrato' && lista.length === 0) {
        setFaturas([]);
        setSelectedFatura(null);
        setBoletoAtual(null);
        setStep('contrato');
        setStatusMessage('warn', 'Número do contrato está incorreto.');
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

  const possuiRespFinanceiroAtivo = (b: Beneficiario | null) => {
    const flag = String(b?.possui_resp_financeiro ?? '').trim().toUpperCase();
    return flag === 'S' && Boolean(b?.nome_resp_financeiro?.trim());
  };

  /** Após validar contrato (PF) ou data de nascimento (PJ): exibe responsável financeiro ou já busca faturas. */
  const solicitarFaturasComEtapaRespFinanceiro = (
    cpfCnpj: string,
    segundoParam: string,
    opts: { segundoCampo: 'contrato' | 'data_nascimento_titular' } | undefined,
    voltarPara: 'servicos' | 'contrato',
  ) => {
    if (possuiRespFinanceiroAtivo(beneficiario)) {
      // Ao avançar para a confirmação, limpa avisos anteriores (ex.: contrato incorreto).
      setStatus(null);
      setPendingFaturasRequest({ cpfCnpj, segundoParam, opts, voltarPara });
      setStep('resp_financeiro');
      return;
    }
    void carregarFaturas(cpfCnpj, segundoParam, opts);
  };

  const handleContinuarRespFinanceiro = () => {
    if (!pendingFaturasRequest) return;
    const p = pendingFaturasRequest;
    setPendingFaturasRequest(null);
    void carregarFaturas(p.cpfCnpj, p.segundoParam, p.opts);
  };

  const handleServicoSelecionado = () => {
    if (!beneficiario) {
      setStatusMessage('warn', 'Valide um CPF antes de escolher o serviço.');
      setStep('cpf');
      return;
    }

    if (beneficiario.tipo_plano === 'PJ') {
      setStep('contrato');
      return;
    }

    const contratoNumero = beneficiario.registro_ans || beneficiario.cpf_titular;
    solicitarFaturasComEtapaRespFinanceiro(
      utils.digits(beneficiario.cpf_titular || ''),
      utils.digits(contratoNumero || ''),
      undefined,
      'servicos',
    );
  };

  const handleBuscarFaturasPJ = () => {
    if (!beneficiario) {
      setStatusMessage('warn', 'Valide o CPF antes de continuar.');
      return;
    }

    const contratoDigits = utils.digits(contratoPJ);
    if (!contratoDigits) {
      setStatusMessage('warn', 'Informe o número do contrato.');
      return;
    }

    const contratoEsperado = utils.digits(beneficiario.registro_ans || '');
    if (contratoEsperado && contratoDigits.length === contratoEsperado.length && contratoDigits !== contratoEsperado) {
      setStatusMessage('warn', 'O número do contrato não confere com o cadastro.');
      return;
    }

    solicitarFaturasComEtapaRespFinanceiro(
      utils.digits(beneficiario.cpf_titular || ''),
      contratoDigits,
      { segundoCampo: 'contrato' },
      'contrato',
    );
  };

  const getNumeroFatura = (item: Fatura, index: number) =>
    utils.escolherPrimeiroValor<string | undefined>(
      item as Record<string, string | undefined>,
      ['numeroFatura', 'numerofatura', 'numerofaturacontrole', 'numero'],
      undefined,
    ) || String(index + 1).padStart(2, '0');

  const formatarValorFatura = (item: Fatura) =>
    utils.formatarValor(
      utils.escolherPrimeiroValor(item as any, ['valor', 'valorfatura', 'valor_fatura', 'valorComDesconto']),
    ) || 'R$ --';

  const formatarDataFatura = (item: Fatura) =>
    utils.formatarData(
      utils.escolherPrimeiroValor(item as any, ['vencimento', 'vencimentofatura', 'dataVencimento', 'data_vencimento']) ||
        '',
    ) || 'N/D';

  const carregarEBoleto = async (item: Fatura, index: number) => {
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

  const handleVisualizarLinha = async (item: Fatura, index: number) => {
    const numero = getNumeroFatura(item, index);
    // se já carregado o mesmo boleto, apenas visualizar
    if (boletoAtual && boletoAtual.numero === numero) {
      await handleVisualizar(boletoAtual);
      return;
    }
    const boleto = await carregarEBoleto(item, index);
    if (boleto) await handleVisualizar(boleto);
  };

  const handleImprimirLinha = async (item: Fatura, index: number) => {
    const numero = getNumeroFatura(item, index);
    if (boletoAtual && boletoAtual.numero === numero) {
      await handleImprimir();
      return;
    }
    const boleto = await carregarEBoleto(item, index);
    if (boleto) await handleImprimir();
  };

  const handleVisualizar = async (boletoOverride?: BoletoResult) => {
    const boleto = boletoOverride ?? boletoAtual;
    if (!boleto) {
      Alert.alert('Aviso', 'Nenhum boleto carregado.');
      return;
    }
    const rawUrl = boleto.remoteUrl || boleto.url;
    if (!rawUrl) {
      Alert.alert('Erro', 'Não foi possível abrir o boleto.');
      return;
    }
    const isHttp = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');
    const isProxy = rawUrl.includes('/api/pdf');
    const url = isHttp && !isProxy ? getPdfViewerUrl(rawUrl) : rawUrl;
    if (!url) {
      Alert.alert('Erro', 'Não foi possível abrir o boleto.');
      return;
    }
    setBoletoModalUrl(url);
    setIsBoletoModalVisible(true);
  };

  const handleFecharBoletoModal = () => {
    setIsBoletoModalVisible(false);
    setBoletoModalUrl(null);
  };

  const handleEncerrarAtendimento = () => {
    handleFecharBoletoModal();
    resetarFluxo();
  };

  const handleVoltarParaFaturas = () => {
    handleFecharBoletoModal();
    setBoletoAtual(null);
    setSelectedFatura(null);
    setStatus(null);
    setStep('faturas');
  };

  const handleImprimir = async () => {
    if (!boletoAtual || !selectedFatura) {
      Alert.alert('Aviso', 'Nenhum boleto carregado.');
      return;
    }
    setLoading(true);
    try {
      const result = await imprimirBoleto(
        selectedFatura,
        boletoAtual.remoteUrl || (boletoAtual.kind === 'remote' ? boletoAtual.url : undefined),
      );
      Alert.alert(
        'Sucesso',
        `Enviado para a impressora${result.printer ? ` (${result.printer})` : ''}.`,
      );
    } catch {
      Alert.alert(
        'Atenção',
        'Não foi possível enviar para a impressora automaticamente. Você pode visualizar o boleto e imprimir manualmente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Visualizar', onPress: () => handleVisualizar() },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const resetarFluxo = () => {
    setIsBoletoModalVisible(false);
    setBoletoModalUrl(null);
    setCpf('');
    setDataNascimentoPF('');
    setContratoPJ('');
    setPendingFaturasRequest(null);
    setBeneficiario(null);
    setFaturas([]);
    setSelectedFatura(null);
    setBoletoAtual(null);
    setStep('cpf');
    setStatus(null);
  };

  resetarFluxoRef.current = resetarFluxo;

  const renderStatus = () => {
    // Exibe somente mensagens de alerta/erro para não mostrar barra "Bem-vindo"
    if (!status || status.type === 'ok') return null;
    const isWarn = status.type === 'warn';
    const background = isWarn ? 'rgba(63,20,5,0.8)' : 'rgba(62,12,17,0.82)';
    const border = isWarn ? 'rgba(245,158,11,0.8)' : 'rgba(239,68,68,0.8)';
    return (
      <View style={[styles.status, { backgroundColor: background, borderColor: border }]}>
        <Text style={styles.statusText}>{status.message}</Text>
      </View>
    );
  };

  const renderCPFStep = () => (
    <View style={[styles.welcomeCard, styles.homeScreenRoot]}>
      <View style={styles.homeReceiptIconWrap}>
        <Ionicons name="receipt-outline" size={100} color={palette.orange} />
      </View>
      <Text style={styles.homeEmissaoTitle}>EMISSÃO DE 2ª VIA DE BOLETO</Text>
      <Text style={styles.homeBemVindo}>Bem-vindo!</Text>
      <Text style={styles.homeInstrucaoCpf}>Informe o CPF do titular</Text>

      <View style={styles.totemFieldOuter}>
        <View style={styles.totemFieldBorder}>
          <Ionicons name="document-text-outline" size={36} color={palette.greenDark} />
          <TextInput
            style={styles.totemFieldTextInput}
            placeholder="000.000.000-00"
            placeholderTextColor="#9ca3af"
            value={cpf}
            onChangeText={(value) => setCpf(formatCpfInput(value))}
            keyboardType="numeric"
            maxLength={14}
            autoFocus
            underlineColorAndroid="transparent"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.homeConfirmButton, loading && styles.buttonDisabled]}
        onPress={handleLookup}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.homeConfirmButtonText}>CONFIRMAR</Text>
        
      </TouchableOpacity>
    </View>
  );

  const nomeEmpresaDoLookup = beneficiario?.nome_empresa?.trim() || '';

  const renderServicosStep = () => {
    const isPessoaJuridica = beneficiario?.tipo_plano === 'PJ';
    
    if (isPessoaJuridica) {
      return (
        <View style={styles.welcomeCard}>
          <View style={styles.pjBadge}>
            <Text style={styles.pjBadgeText}>PESSOA JURÍDICA</Text>
          </View>
          <Text style={styles.pjWelcome}>Olá, {utils.formatNomeCompleto(beneficiario?.nome_titular || '')}!!</Text>
          {nomeEmpresaDoLookup ? (
            <Text style={[styles.pjNextStep, { fontStyle: 'normal', fontWeight: '600', color: palette.greenDark }]}>
              Encontramos o seu vínculo com a empresa {nomeEmpresaDoLookup}.
            </Text>
          ) : null}
          <Text style={styles.pjNextStep}>Próximo passo:</Text>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
            enabled={Platform.OS !== 'web'}
          >
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.greenButton, loading && styles.buttonDisabled]} 
                onPress={handleServicoSelecionado} 
                disabled={loading}
              >
                <Text style={styles.greenButtonText}>INFORMAR NÚMERO DO CONTRATO</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.buttonRow, { marginTop: 24 }]}>
              <LinkButton text="Não é você? Digitar outro CPF" onPress={resetarFluxo} />
            </View>
          </KeyboardAvoidingView>
    </View>
  );
    }

    return (
      <View style={styles.welcomeCard}>
        <View style={styles.pfBadge}>
          <Text style={styles.pfBadgeText}>PESSOA FÍSICA</Text>
      </View>
        <Text style={styles.pjWelcome}>Olá, {utils.formatNomeCompleto(beneficiario?.nome_titular || '')}!</Text>
        <Text style={styles.pjNascimentoInfo}>Para a sua segurança, informe a data de nascimento do titular</Text>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
          enabled={Platform.OS !== 'web'}
        >
          <View style={[styles.formContainerPfData, isTablet && styles.formContainerTablet]}>
            <View style={styles.pjNascimentoFieldOuter}>
              <View style={styles.totemFieldBorder}>
                <Ionicons name="calendar-outline" size={36} color={palette.greenDark} />
                <TextInput
                  style={styles.totemFieldTextInput}
                  placeholderTextColor="#9ca3af"
                  value={dataNascimentoPF}
                  onChangeText={(value) => setDataNascimentoPF(utils.formatDataNascimentoInput(value))}
                  keyboardType="numeric"
                  maxLength={10}
                  underlineColorAndroid="transparent"
                  onFocus={() => {
                    isFormFocusedRef.current = true;
                    setIsFormFocused(true);
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }}
                  onBlur={() => {
                    isFormFocusedRef.current = false;
                    setIsFormFocused(false);
                  }}
                />
              </View>
            </View>
          </View>
          <View style={[styles.buttonRow, styles.buttonRowTightTop]}>
            <TouchableOpacity 
              style={[styles.greenButton, loading && styles.buttonDisabled]} 
              onPress={() => {
                if (!beneficiario) return;
                const digitosInformados = utils.digits(dataNascimentoPF);
                if (digitosInformados.length !== 8) {
                  setStatusMessage('warn', 'Informe a data de nascimento completa (DD/MM/AAAA).');
                  return;
                }
                const esperado = utils.normalizeDataTitularToDdmmYyyyDigits(beneficiario.data_nascimento_titular);
                if (!esperado) {
                  setStatusMessage(
                    'err',
                    'Não foi possível validar a data de nascimento no cadastro. Procure o atendimento.',
                  );
                  return;
                }
                if (digitosInformados !== esperado) {
                  setStatusMessage('warn', 'A data de nascimento não confere com o cadastro.');
                  return;
                }
                solicitarFaturasComEtapaRespFinanceiro(
                  utils.digits(beneficiario.cpf_titular || ''),
                  digitosInformados,
                  { segundoCampo: 'data_nascimento_titular' },
                  'servicos',
                );
              }} 
              disabled={loading}
            >
              <Text style={styles.greenButtonText}>BUSCAR FATURAS</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.buttonRow, { marginTop: 24 }]}>
            <LinkButton text="Não é você? Digitar outro CPF" onPress={resetarFluxo} />
          </View>
        </KeyboardAvoidingView>
    </View>
  );
  };

  const renderContratoStep = () => (
    <View style={styles.welcomeCard}>
      <View style={styles.pjBadge}>
        <Text style={styles.pjBadgeText}>PESSOA JURÍDICA</Text>
      </View>
      <Text style={styles.pjWelcome}>Olá, {utils.formatNomeCompleto(beneficiario?.nome_titular || '')}!</Text>
      {nomeEmpresaDoLookup ? (
        <Text style={[styles.pjNextStep, { fontStyle: 'normal', fontWeight: '600', color: palette.greenDark }]}>
          Encontramos o seu vínculo com a empresa {nomeEmpresaDoLookup}.
        </Text>
      ) : null}

      <Text style={styles.pjNascimentoInfo}>Informe o número do contrato</Text>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
        enabled={Platform.OS !== 'web'}
      >
        <View style={[styles.formContainer, isTablet && styles.formContainerTablet]}>
          <View style={styles.totemFieldOuter}>
            <View style={styles.totemFieldBorder}>
              <Ionicons name="document-text-outline" size={36} color={palette.greenDark} />
              <TextInput
                style={styles.totemFieldTextInput}
                accessibilityLabel="Número do contrato"
                value={contratoPJ}
                onChangeText={setContratoPJ}
                keyboardType="numeric"
                underlineColorAndroid="transparent"
                onFocus={() => {
                  isFormFocusedRef.current = true;
                  setIsFormFocused(true);
                  scrollRef.current?.scrollToEnd({ animated: true });
                }}
                onBlur={() => {
                  isFormFocusedRef.current = false;
                  setIsFormFocused(false);
                }}
              />
            </View>
          </View>
        </View>
        
        <View style={[styles.cpfButtonRow, isTablet && styles.cpfButtonRowTablet]}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => setStep('servicos')}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.greenButton, loading && styles.buttonDisabled]} 
            onPress={handleBuscarFaturasPJ} 
            disabled={loading}
          >
            <Text style={styles.greenButtonText}>BUSCAR FATURAS</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  const renderRespFinanceiroStep = () => {
    const nome = utils.formatNomeCompleto(beneficiario?.nome_resp_financeiro || '');
    return (
      <View style={styles.welcomeCard}>
        <Text style={styles.pjWelcome}>
          O responsável financeiro do plano é{' '}
          <Text style={{ fontWeight: '700', color: palette.greenDark }}>{nome}</Text>?
        </Text>
        <Text style={[styles.pjNextStep, { marginTop: 20 }]}>
          Confira se o nome está correto e clique em confirmar para buscar suas faturas.
        </Text>
        <View style={[styles.cpfButtonRow, isTablet && styles.cpfButtonRowTablet]}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setStep('resp_financeiro_ajuda')}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Responsável incorreto?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.greenButton,
              styles.greenButtonIconRow,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleContinuarRespFinanceiro}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle-outline" size={30} color={palette.white} />
            <Text style={styles.greenButtonText}>CONFIRMAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRespFinanceiroAjudaStep = () => (
    <View style={styles.welcomeCard}>
      <View style={styles.rfAjudaIconWrap}>
        <Ionicons name="information-circle-outline" size={56} color={palette.greenDark} />
      </View>
      <Text style={styles.pjWelcome}>Fale com um atendente</Text>
      <Text style={styles.rfAjudaMensagem}>
        Caso o nome do responsável financeiro exibido na tela anterior não esteja correto, procure um
        atendente para atualizar o cadastro e concluir a consulta de faturas.
      </Text>
      <View style={[styles.buttonRow, { marginTop: 28 }]}>
        <TouchableOpacity
          style={[styles.greenButton, loading && styles.buttonDisabled]}
          onPress={handleEncerrarAtendimento}
          disabled={loading}
        >
          <Text style={styles.greenButtonText}>Encerrar atendimento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFaturasStep = () => (
    <View style={[styles.card, styles.faturaScreenContainer]}>
      {!faturas.length ? (
        <>
          <View style={styles.semFaturaEmptyState}>
            <Text style={styles.semFaturaMensagemBonita}>Nenhuma fatura em aberto</Text>
          </View>
          <View style={styles.buttonRow}>
            <SecondaryButton text="Consultar novo CPF/CNPJ" onPress={resetarFluxo} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.cardTitle}>Faturas em aberto</Text>
          <Text style={styles.muted}>{resumoFaturas}</Text>

          <View style={styles.faturaHeader}>
            <Text style={styles.faturaHeaderText}>Data</Text>
            <Text style={styles.faturaHeaderText}>Valor</Text>
            <Text style={styles.faturaHeaderText}>Ação</Text>
          </View>

          <ScrollView horizontal={false} showsVerticalScrollIndicator={false} style={styles.faturaScroll}>
        {faturas.map((item, index) => {
          const numero = getNumeroFatura(item, index);
          const selected = selectedFatura === numero;
          return (
                <View key={numero} style={[styles.faturaRow, selected && styles.faturaRowSelected]}>
                  <Text style={styles.faturaRowText}>{formatarDataFatura(item)}</Text>
                  <Text style={styles.faturaRowValue}>{formatarValorFatura(item)}</Text>
                  <View style={styles.rowActionGroup}>
                    <TouchableOpacity
                      style={[styles.rowActionButton, loading && styles.buttonDisabled]}
                      onPress={() => handleVisualizarLinha(item, index)}
                      disabled={loading}
                    >
                      {selected && loading ? (
                        <ActivityIndicator color={palette.darkText} />
                      ) : (
                        <Text style={styles.rowActionButtonText}>Visualizar</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rowActionButton, loading && styles.buttonDisabled]}
                      onPress={() => handleImprimirLinha(item, index)}
                      disabled={loading}
                    >
                      {selected && loading ? (
                        <ActivityIndicator color={palette.darkText} />
                      ) : (
                        <Text style={styles.rowActionButtonText}>Imprimir</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
          );
        })}
      </ScrollView>
          <View style={[styles.buttonRow, isTablet && styles.buttonRowTablet]}>
            <SecondaryButton text="Voltar" onPress={() => {
              setBoletoAtual(null);
              setSelectedFatura(null);
              setFaturas([]);
              if (beneficiario?.tipo_plano === 'PJ') {
                setStep('contrato');
              } else {
                setStep('servicos');
              }
            }} disabled={loading} />
            <SecondaryButton text="Consultar novo CPF/CNPJ" onPress={resetarFluxo} />
          </View>
        </>
      )}
    </View>
  );

  return (
    <View
      ref={rootRef}
      style={[styles.screenRoot, { width: viewportWidth, height: viewportHeight }]}
    >
      <View
        style={[
          styles.backgroundLayer,
          Platform.OS === 'web' && styles.backgroundLayerFixed,
          { pointerEvents: 'none' },
          { width: viewportWidth, height: viewportHeight },
        ]}
      >
        <ImageBackground
          source={require('@/assets/images/fundo_.png')}
          style={[
            styles.backgroundImage,
            isTablet && styles.backgroundImageTablet,
            { width: viewportWidth, height: viewportHeight },
          ]}
          resizeMode="cover"
        >
          <View
            style={[styles.topLeftImage, isTablet && styles.topLeftImageTablet]}
          >
            <Image
              source={require('@/assets/images/top_left.png')}
              style={styles.decorImageFill as ImageStyle}
              resizeMode="contain"
            />
          </View>

          <View
            style={[styles.topRightImage, isTablet && styles.topRightImageTablet]}
          >
            <Image
              source={require('@/assets/images/top_right.png')}
              style={styles.decorImageFill as ImageStyle}
              resizeMode="contain"
            />
          </View>

          <View
            style={[styles.bottomLeftImage, isTablet && styles.bottomLeftImageTablet]}
          >
            <Image
              source={require('@/assets/images/bottom_left.png')}
              style={styles.decorImageFill as ImageStyle}
              resizeMode="contain"
            />
          </View>

          <View
            style={[styles.bottomRightImage, isTablet && styles.bottomRightImageTablet]}
          >
            <Image
              source={require('@/assets/images/bottom_right.png')}
              style={styles.decorImageFill as ImageStyle}
              resizeMode="contain"
            />
          </View>

          <View
            style={[styles.atendenteContainer, isTablet && styles.atendenteContainerTablet]}
          >
            <Image
              source={require('@/assets/images/atendente.png')}
              style={[
                styles.atendenteImage as ImageStyle,
                { width: atendenteWidth, height: atendenteHeight },
                isTablet && (styles.atendenteImageTablet as ImageStyle),
              ]}
              resizeMode="contain"
            />
          </View>
        </ImageBackground>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.contentWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          enabled={Platform.OS !== 'web'}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.scrollContent,
              isTablet && styles.scrollContentTablet,
              keyboardHeight > 0 && { paddingBottom: keyboardHeight + 24 },
              isFormFocused && { paddingBottom: Math.max(keyboardHeight, 420) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={100}
          >
            {renderStatus()}
            {step === 'cpf' && renderCPFStep()}
            {step === 'servicos' && renderServicosStep()}
            {step === 'contrato' && (
              <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                {renderContratoStep()}
              </View>
            )}
            {step === 'resp_financeiro' && (
              <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                {renderRespFinanceiroStep()}
              </View>
            )}
            {step === 'resp_financeiro_ajuda' && (
              <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                {renderRespFinanceiroAjudaStep()}
              </View>
            )}
            {step === 'faturas' && (
              <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                {renderFaturasStep()}
              </View>
            )}
            {loading && (
              <View style={styles.loading}>
                <Text style={styles.loadingText}>
                  {step === 'faturas' && selectedFatura
                    ? `Carregando boleto da fatura ${selectedFatura}...`
                    : 'Processando...'}
                </Text>
                <ActivityIndicator color={palette.primary} style={{ marginLeft: 8 }} />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal
        visible={isBoletoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleFecharBoletoModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>

            <PdfViewer
              source={boletoModalUrl ? { uri: boletoModalUrl } : null}
              style={styles.modalPdf}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalFooterButton, styles.modalFooterButtonSecondary]}
                onPress={handleVoltarParaFaturas}
              >
                <Text style={[styles.modalFooterButtonText, styles.modalFooterButtonTextLight]}>
                  Ver outro boleto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalFooterButton, styles.modalFooterButtonPrimary]}
                onPress={handleEncerrarAtendimento}
              >
                <Text style={[styles.modalFooterButtonText, styles.modalFooterButtonTextPrimary]}>
                  Encerrar atendimento
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type ButtonProps = {
  text: string;
  onPress?: () => void;
  disabled?: boolean;
};

const SecondaryButton = ({ text, onPress, disabled }: ButtonProps) => (
  <TouchableOpacity
    style={[styles.secondaryButton, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.secondaryButtonText}>{text}</Text>
  </TouchableOpacity>
);

const LinkButton = ({ text, onPress }: { text: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress}>
    <Text style={styles.linkButtonText}>{text}</Text>
  </TouchableOpacity>
);


