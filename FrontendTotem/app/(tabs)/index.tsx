import { useEffect, useMemo, useRef, useState } from 'react';
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

import {
    buscarBoleto,
    buscarFaturas,
    getPdfViewerUrl,
    imprimirBoleto,
    lookupByCpf,
    utils,
} from '@/services/api.service';
import type { Beneficiario, BoletoResult, Fatura } from '@/services/api.types';
import PdfViewer from '@/components/pdf-viewer';
import styles, { palette } from '@/styles/totem.styles';

type Step = 'cpf' | 'servicos' | 'contrato' | 'faturas';
type StatusType = 'ok' | 'warn' | 'err';

export default function TotemHomeScreen() {
  const [viewport, setViewport] = useState(() =>
    Dimensions.get(Platform.OS === 'web' ? 'window' : 'screen'),
  );
  const viewportWidth = viewport.width || (Platform.OS === 'web' ? window.innerWidth : 0);
  const viewportHeight = viewport.height || (Platform.OS === 'web' ? window.innerHeight : 0);
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
  const [cnpj, setCnpj] = useState('');
  const [contrato, setcontrato] = useState('');
  const [contratoPF, setContratoPF] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: StatusType; message: string } | null>(null);
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [selectedFatura, setSelectedFatura] = useState<string | null>(null);
  const [boletoAtual, setBoletoAtual] = useState<BoletoResult | null>(null);
  const [showCpfInput, setShowCpfInput] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [boletoModalUrl, setBoletoModalUrl] = useState<string | null>(null);
  const [isBoletoModalVisible, setIsBoletoModalVisible] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      if (window?.width && window?.height) setViewport(window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      subscription?.remove?.();
      showSub.remove();
      hideSub.remove();
    };
  }, []);


  const resumoFaturas = useMemo(() => {
    if (!faturas.length) return 'Nenhuma fatura encontrada.';
    return `Encontramos ${faturas.length} fatura${faturas.length > 1 ? 's' : ''} em aberto.`;
  }, [faturas]);

  const isPJ = beneficiario?.tipo_plano === 'PJ';

  const setStatusMessage = (type: StatusType, message: string) => setStatus({ type, message });

  const formatCpfInput = (value: string) => {
    const digits = utils.digits(value);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const formatCnpjInput = (value: string) => {
    const digits = utils.digits(value);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(
      8,
      12,
    )}-${digits.slice(12, 14)}`;
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
      setStatusMessage('ok', `Bem-vindo, ${utils.formatNomeCompleto(result.nome_titular)}.`);
    } catch (error: any) {
      setStatusMessage('err', error?.message || 'Não foi possível validar o CPF.');
    } finally {
      setLoading(false);
    }
  };

  const carregarFaturas = async (cpfCnpj: string, contratoNumero: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const lista = await buscarFaturas(cpfCnpj, contratoNumero);
      setFaturas(lista);
      setStep('faturas');
      setStatusMessage('ok', `Encontramos ${lista.length} fatura${lista.length === 1 ? '' : 's'} em aberto.`);
    } catch (error: any) {
      setStatusMessage('err', error?.message || 'Falha ao buscar faturas.');
    } finally {
      setLoading(false);
    }
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
    carregarFaturas(utils.digits(beneficiario.cpf_titular), utils.digits(contratoNumero));
  };

  const handleBuscarFaturasPJ = () => {
    const cnpjDigits = utils.digits(cnpj);
    const contratoDigits = utils.digits(contrato);

    if (cnpjDigits.length !== 14) {
      setStatusMessage('warn', 'Informe um CNPJ válido com 14 dígitos.');
      return;
    }

    if (!contratoDigits) {
      setStatusMessage('warn', 'Informe o número do contrato.');
      return;
    }

    carregarFaturas(cnpjDigits, contratoDigits);
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

  const handleSelecionarFatura = async (item: Fatura, index: number) => {
    const numero = getNumeroFatura(item, index);
    setSelectedFatura(numero);
    setBoletoAtual(null);
    setStatusMessage('warn', `Carregando boleto da fatura ${numero}...`);
    setLoading(true);
    try {
      const boleto = await buscarBoleto(numero);
      setBoletoAtual({ ...boleto, numero });
      setStatusMessage('ok', `Boleto da fatura ${numero} pronto!`);
    } catch (error: any) {
      setStatusMessage('err', error?.message || 'Falha ao carregar o boleto.');
      setSelectedFatura(null);
    } finally {
      setLoading(false);
    }
  };

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
    setCpf('');
    setCnpj('');
    setcontrato('');
    setContratoPF('');
    setBeneficiario(null);
    setFaturas([]);
    setSelectedFatura(null);
    setBoletoAtual(null);
    setStep('cpf');
    setStatus(null);
    setShowCpfInput(false);
  };

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
    <View style={styles.welcomeCard}>
      <Text style={styles.welcomeTitle}>TOTEM DE ATENDIMENTO</Text>
      <Text style={styles.welcomeSubtitle}>Bem-vindo!</Text>
      <Text style={styles.welcomeDescription}>Retire aqui a sua 2ª via de boleto:</Text>
      
      {showCpfInput ? (
        <View style={styles.cpfInputContainer}>
      <TextInput
            style={styles.cpfInput}
            placeholder="000.000.000-00"
            placeholderTextColor="#999"
        value={cpf}
        onChangeText={(value) => setCpf(formatCpfInput(value))}
        keyboardType="numeric"
        maxLength={14}
            autoFocus
      />
          <View style={styles.cpfButtonRow}>
            <TouchableOpacity 
              style={[styles.orangeButton, loading && styles.buttonDisabled]} 
              onPress={handleLookup} 
              disabled={loading}
            >
              <Text style={styles.orangeButtonText}>CONFIRMAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.orangeButton, loading && styles.buttonDisabled]} 
            onPress={() => setShowCpfInput(true)} 
            disabled={loading}
          >
            <Text style={styles.orangeButtonText}>DIGITE O CPF</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderServicosStep = () => {
    const isPessoaJuridica = beneficiario?.tipo_plano === 'PJ';
    
    if (isPessoaJuridica) {
      return (
        <View style={styles.welcomeCard}>
          <Text style={styles.pjTitle}>2ª via de boleto</Text>
          <View style={styles.pjBadge}>
            <Text style={styles.pjBadgeText}>PESSOA JURÍDICA</Text>
          </View>
          <Text style={styles.pjWelcome}>Bem vindo {utils.formatNomeCompleto(beneficiario?.nome_titular || '')}!</Text>
          <Text style={styles.pjNextStep}>Próximo passo:</Text>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
          >
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.greenButton, loading && styles.buttonDisabled]} 
                onPress={handleServicoSelecionado} 
                disabled={loading}
              >
                <Text style={styles.greenButtonText}>DIGITE O NÚMERO DO contrato</Text>
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
        <Text style={styles.pjTitle}>2ª via de boleto</Text>
        <View style={styles.pfBadge}>
          <Text style={styles.pfBadgeText}>PESSOA FÍSICA</Text>
      </View>
        <Text style={styles.pjWelcome}>Bem vindo {utils.formatNomeCompleto(beneficiario?.nome_titular || '')}!</Text>
        <Text style={styles.pjNextStep}>Próximo passo:</Text>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
        >
          <View style={[styles.formContainer, isTablet && styles.formContainerTablet]}>
            <Text style={styles.formLabel}>Número do contrato</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Digite o número do contrato"
              placeholderTextColor="#999"
              value={contratoPF}
              onChangeText={setContratoPF}
              keyboardType="numeric"
              onFocus={() => {
                setIsFormFocused(true);
                scrollRef.current?.scrollToEnd({ animated: true });
              }}
              onBlur={() => setIsFormFocused(false)}
            />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.greenButton, loading && styles.buttonDisabled]} 
              onPress={() => {
                const contratoNumero = utils.digits(contratoPF);
                if (!contratoNumero) {
                  setStatusMessage('warn', 'Informe o número do contrato.');
                  return;
                }
                carregarFaturas(utils.digits(beneficiario?.cpf_titular || ''), contratoNumero);
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
      <Text style={styles.pjTitle}>2ª via de boleto</Text>
      <View style={styles.pjBadge}>
        <Text style={styles.pjBadgeText}>PESSOA JURÍDICA</Text>
      </View>
      <Text style={styles.pjWelcome}>Bem vindo {utils.formatNomeCompleto(beneficiario?.nome_titular || '')}!</Text>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
      >
        <View style={[styles.formContainer, isTablet && styles.formContainerTablet]}>
          <Text style={styles.formLabel}>CNPJ</Text>
        <TextInput
            style={styles.formInput}
            placeholder="00.000.000/0000-00"
            placeholderTextColor="#999"
          value={cnpj}
          onChangeText={(value) => setCnpj(formatCnpjInput(value))}
          keyboardType="numeric"
          maxLength={18}
          onFocus={() => {
            setIsFormFocused(true);
            scrollRef.current?.scrollToEnd({ animated: true });
          }}
          onBlur={() => setIsFormFocused(false)}
        />
          <Text style={styles.formLabel}>Número do contrato</Text>
        <TextInput
            style={styles.formInput}
          placeholder="Digite o número do contrato"
            placeholderTextColor="#999"
          value={contrato}
          onChangeText={setcontrato}
          keyboardType="numeric"
          onFocus={() => {
            setIsFormFocused(true);
            scrollRef.current?.scrollToEnd({ animated: true });
          }}
          onBlur={() => setIsFormFocused(false)}
        />
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

  const renderFaturasStep = () => (
    <View style={[styles.card, styles.faturaScreenContainer]}>
      <Text style={styles.cardTitle}>Faturas em aberto</Text>
      <Text style={styles.muted}>{resumoFaturas}</Text>

      {!faturas.length ? (
        <View style={styles.semFaturaContainer}>
          <Text style={styles.semFaturaTexto}>Nenhuma fatura em aberto no momento.</Text>
          <View style={styles.buttonRow}>
            <SecondaryButton text="Consultar novo CPF/CNPJ" onPress={resetarFluxo} />
          </View>
        </View>
      ) : (
        <>

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
    <View style={[styles.screenRoot, { width: viewportWidth, height: viewportHeight }]}>
      <View
        pointerEvents="none"
        style={[styles.backgroundLayer, { width: viewportWidth, height: viewportHeight }]}
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
              style={styles.decorImageFill}
              resizeMode="contain"
            />
          </View>

          <View
            style={[styles.topRightImage, isTablet && styles.topRightImageTablet]}
          >
            <Image
              source={require('@/assets/images/top_right.png')}
              style={styles.decorImageFill}
              resizeMode="contain"
            />
          </View>

          <View
            style={[styles.bottomLeftImage, isTablet && styles.bottomLeftImageTablet]}
          >
            <Image
              source={require('@/assets/images/bottom_left.png')}
              style={styles.decorImageFill}
              resizeMode="contain"
            />
          </View>

          <View
            style={[styles.bottomRightImage, isTablet && styles.bottomRightImageTablet]}
          >
            <Image
              source={require('@/assets/images/bottom_right.png')}
              style={styles.decorImageFill}
              resizeMode="contain"
            />
          </View>

          <View
            style={[styles.atendenteContainer, isTablet && styles.atendenteContainerTablet]}
          >
            <Image
              source={require('@/assets/images/atendente.png')}
              style={[
                styles.atendenteImage,
                { width: atendenteWidth, height: atendenteHeight },
                isTablet && styles.atendenteImageTablet,
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
          >
            {renderStatus()}
            {step === 'cpf' && renderCPFStep()}
            {step === 'servicos' && renderServicosStep()}
            {step === 'contrato' && (
              <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                {renderContratoStep()}
              </View>
            )}
            {step === 'faturas' && (
              <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                {renderFaturasStep()}
              </View>
            )}
            {loading && (
              <View style={styles.loading}>
                <Text style={styles.loadingText}>Processando...</Text>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Boleto</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={handleFecharBoletoModal}>
                <Text style={styles.modalCloseButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
            <PdfViewer
              source={boletoModalUrl ? { uri: boletoModalUrl } : null}
              style={styles.modalPdf}
            />
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

const PrimaryButton = ({ text, onPress, disabled }: ButtonProps) => (
  <TouchableOpacity style={[styles.primaryButton, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
    <Text style={styles.primaryButtonText}>{text}</Text>
  </TouchableOpacity>
);

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

const ActionButton = ({ text, onPress, disabled }: ButtonProps) => (
  <TouchableOpacity
    style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.actionButtonText}>{text}</Text>
  </TouchableOpacity>
);


