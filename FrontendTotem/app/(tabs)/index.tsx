<<<<<<< HEAD
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
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
=======
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  buscarBoleto,
  buscarFaturas,
  getPdfViewerUrl,
  imprimirBoleto,
  lookupByCpf,
  utils,
>>>>>>> origin/master
} from '@/services/api.service';
import type { Beneficiario, BoletoResult, Fatura } from '@/services/api.types';
import styles, { palette } from '@/styles/totem.styles';

<<<<<<< HEAD
=======
// Background images
const HERO_BACKGROUND = require('../../assets/images/fundo.png');
const HERO_BACKGROUND_OVERLAY = require('../../assets/images/fundo_transparente.png');
const HERO_ASSISTANT = require('../../assets/images/atendente.png');
const HERO_LOGO = require('../../assets/images/logo.png');

>>>>>>> origin/master
type Step = 'cpf' | 'servicos' | 'contrato' | 'faturas';
type StatusType = 'ok' | 'warn' | 'err';

export default function TotemHomeScreen() {
<<<<<<< HEAD
=======
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
>>>>>>> origin/master
  const [step, setStep] = useState<Step>('cpf');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contrato, setContrato] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: StatusType; message: string } | null>(null);
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [selectedFatura, setSelectedFatura] = useState<string | null>(null);
  const [boletoAtual, setBoletoAtual] = useState<BoletoResult | null>(null);
<<<<<<< HEAD
=======
  const heroInputRef = useRef<TextInput>(null);
>>>>>>> origin/master

  const resumoFaturas = useMemo(() => {
    if (!faturas.length) return 'Nenhuma fatura encontrada.';
    return `Encontramos ${faturas.length} fatura${faturas.length > 1 ? 's' : ''} em aberto.`;
  }, [faturas]);

  const isPJ = beneficiario?.tipoPessoa === 'PJ';
<<<<<<< HEAD
=======
  const cpfDigits = utils.digits(cpf);
  const isCpfReady = cpfDigits.length === 11;
>>>>>>> origin/master

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
      setStep('servicos');
      setStatusMessage('ok', `Bem-vindo, ${utils.formatNomeCompleto(result.nome)}.`);
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

    if (beneficiario.tipoPessoa === 'PJ') {
      setStep('contrato');
      return;
    }

    const contratoNumero = beneficiario.contrato || beneficiario.documento;
    carregarFaturas(utils.digits(beneficiario.documento), utils.digits(contratoNumero));
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

  const handleVisualizar = async () => {
    if (!boletoAtual) {
      Alert.alert('Aviso', 'Nenhum boleto carregado.');
      return;
    }
    try {
      const url = boletoAtual.remoteUrl ? getPdfViewerUrl(boletoAtual.remoteUrl) : boletoAtual.url;
      const supported = await Linking.canOpenURL(url);
      if (supported) Linking.openURL(url);
      else Alert.alert('Erro', 'Não foi possível abrir o boleto.');
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Falha ao visualizar o boleto.');
    }
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
          { text: 'Visualizar', onPress: handleVisualizar },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const resetarFluxo = () => {
    setCpf('');
    setCnpj('');
    setContrato('');
    setBeneficiario(null);
    setFaturas([]);
    setSelectedFatura(null);
    setBoletoAtual(null);
    setStep('cpf');
    setStatus(null);
  };

  const renderStatus = () => {
    if (!status) return null;
    const background =
      status.type === 'ok'
        ? 'rgba(5,46,22,0.8)'
        : status.type === 'warn'
        ? 'rgba(63,20,5,0.8)'
        : 'rgba(62,12,17,0.82)';
    const border =
      status.type === 'ok'
        ? 'rgba(34,197,94,0.8)'
        : status.type === 'warn'
        ? 'rgba(245,158,11,0.8)'
        : 'rgba(239,68,68,0.8)';
    return (
      <View style={[styles.status, { backgroundColor: background, borderColor: border }]}>
        <Text style={styles.statusText}>{status.message}</Text>
      </View>
    );
  };

<<<<<<< HEAD
  const renderCPFStep = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Totem de Autoatendimento</Text>
      <Text style={styles.muted}>Digite seu CPF para iniciar o atendimento.</Text>
      <Text style={styles.label}>CPF do beneficiário</Text>
      <TextInput
        style={styles.input}
        placeholder="Somente números"
        placeholderTextColor={palette.muted}
        value={cpf}
        onChangeText={(value) => setCpf(formatCpfInput(value))}
        keyboardType="numeric"
        maxLength={14}
      />
      <View style={styles.buttonRow}>
        <PrimaryButton text="Avançar" onPress={handleLookup} disabled={loading} />
=======
  const handleHeroButtonPress = () => {
    if (isCpfReady) {
      handleLookup();
      return;
    }
    heroInputRef.current?.focus();
  };

  const renderHeroStep = () => (
    <View style={styles.heroContainer}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>TOTEM DE ATENDIMENTO</Text>
        <Text style={styles.heroSubtitle}>
          Bem-vindo!{'\n'}Retire aqui a sua 2ª via de boleto:
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.heroButton, (!isCpfReady || loading) && styles.heroButtonDisabled]}
          onPress={handleHeroButtonPress}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.heroButtonText}>{cpf || 'DIGITE O CPF'}</Text>}
        </TouchableOpacity>
        <TextInput
          ref={heroInputRef}
          style={styles.heroHiddenInput}
          value={cpf}
          keyboardType="number-pad"
          onChangeText={(value) => setCpf(formatCpfInput(value))}
          maxLength={14}
          returnKeyType="done"
          onSubmitEditing={() => isCpfReady && handleLookup()}
        />
        <Text style={styles.heroHint}>Digite os 11 dígitos do CPF e toque para continuar.</Text>
      </View>
      <Image source={HERO_ASSISTANT} style={styles.heroAssistant} resizeMode="contain" />
      <View style={styles.heroBrandCard}>
        <Text style={styles.heroBrandSlogan}>Sua vida precisa de um plano.</Text>
        <Image source={HERO_LOGO} style={styles.heroBrandLogo} resizeMode="contain" />
>>>>>>> origin/master
      </View>
    </View>
  );

  const renderServicosStep = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Serviços disponíveis</Text>
      <Text style={styles.muted}>
        Olá <Text style={styles.highlight}>{utils.formatNomeCompleto(beneficiario?.nome || '')}</Text>, identificamos
        seu plano como{' '}
        <Text style={styles.highlight}>
          {beneficiario?.tipoPessoa} - {beneficiario?.tipoPessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
        </Text>
        .
      </Text>
      <Text style={[styles.muted, { marginTop: 8 }]}>Qual serviço deseja realizar hoje?</Text>
      <View style={styles.buttonColumn}>
        <PrimaryButton text="📄 Emissão de 2ª via de boletos" onPress={handleServicoSelecionado} disabled={loading} />
        <SecondaryButton text="📋 Guias (em desenvolvimento)" disabled />
        <SecondaryButton text="🩺 Consultas (em desenvolvimento)" disabled />
      </View>
      <View style={styles.buttonRow}>
        <LinkButton text="Não é você? Digitar outro CPF" onPress={resetarFluxo} />
      </View>
    </View>
  );

  const renderContratoStep = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Informar dados do contrato</Text>
      <Text style={styles.muted}>
        Por se tratar de um contrato PJ, informe o CNPJ e depois o número do contrato para localizar as faturas em
        aberto.
      </Text>
      <Text style={styles.label}>CNPJ</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite o CNPJ"
        placeholderTextColor={palette.muted}
        value={cnpj}
        onChangeText={(value) => setCnpj(formatCnpjInput(value))}
        keyboardType="numeric"
        maxLength={18}
      />
      <Text style={styles.label}>Número do contrato</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite o número do contrato"
        placeholderTextColor={palette.muted}
        value={contrato}
        onChangeText={setContrato}
        keyboardType="numeric"
      />
      <View style={styles.buttonRow}>
        <SecondaryButton text="Voltar" onPress={() => setStep('servicos')} disabled={loading} />
        <PrimaryButton text="Buscar faturas" onPress={handleBuscarFaturasPJ} disabled={loading} />
      </View>
    </View>
  );

  const renderFaturasStep = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Faturas em aberto</Text>
      <Text style={styles.muted}>{resumoFaturas}</Text>
      <Text style={[styles.muted, { marginTop: 8 }]}>
        Toque em uma fatura para carregar o boleto e visualizar as opções.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.faturaScroll}>
        {faturas.map((item, index) => {
          const numero = getNumeroFatura(item, index);
          const selected = selectedFatura === numero;
          return (
            <TouchableOpacity
              key={numero}
              style={[styles.faturaCard, selected && styles.faturaCardSelected]}
              onPress={() => handleSelecionarFatura(item, index)}
              disabled={loading}
            >
              <Text style={styles.faturaTitle}>Fatura {numero}</Text>
              <Text style={styles.faturaInfo}>Vencimento: {formatarDataFatura(item)}</Text>
              <Text style={styles.faturaValue}>{formatarValorFatura(item)}</Text>
              {selected && loading ? <ActivityIndicator color={palette.primary} style={{ marginTop: 8 }} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {boletoAtual && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Boleto da fatura {selectedFatura} carregado!</Text>
          <View style={styles.actionsGrid}>
            <ActionButton text="👁️ Visualizar" onPress={handleVisualizar} disabled={loading} />
            <ActionButton text="🖨️ Imprimir" onPress={handleImprimir} disabled={loading} />
            <ActionButton text="📧 Email (em breve)" disabled />
            <ActionButton text="💬 WhatsApp (em breve)" disabled />
          </View>
        </View>
      )}
      <View style={styles.buttonRow}>
        <SecondaryButton text="Consultar novo CPF/CNPJ" onPress={resetarFluxo} />
      </View>
    </View>
  );

<<<<<<< HEAD
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStatus()}
        {step === 'cpf' && renderCPFStep()}
        {step === 'servicos' && renderServicosStep()}
        {step === 'contrato' && renderContratoStep()}
        {step === 'faturas' && renderFaturasStep()}
        {loading && (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Processando...</Text>
            <ActivityIndicator color={palette.primary} style={{ marginLeft: 8 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
=======
  const renderMainContent = () => {
    if (step === 'cpf') {
      return <SafeAreaView style={styles.heroSafeArea}>{renderHeroStep()}</SafeAreaView>;
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderStatus()}
          {step === 'servicos' && renderServicosStep()}
          {step === 'contrato' && renderContratoStep()}
          {step === 'faturas' && renderFaturasStep()}
          {loading && (
            <View style={styles.loading}>
              <Text style={styles.loadingText}>Processando...</Text>
              <ActivityIndicator color={palette.primary} style={{ marginLeft: 8 }} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Calcula escala baseada na largura da tela (referência: 1920px)
  const baseWidth = 1920;
  const scale = screenWidth / baseWidth;
  const decorativeWidth = 1920 * scale;
  const decorativeHeight = 1080 * scale;

  return (
    <View style={styles.backgroundLayer}>
      <View style={styles.backgroundBase} />
      <Image source={HERO_BACKGROUND} style={styles.backgroundOverlay} resizeMode="cover" />
      <View style={styles.decorativeLayer} pointerEvents="none">
        <Image
          source={HERO_BACKGROUND_OVERLAY}
          style={{
            width: decorativeWidth,
            height: decorativeHeight,
          }}
          resizeMode="contain"
        />
      </View>
      {renderMainContent()}
    </View>
>>>>>>> origin/master
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

<<<<<<< HEAD

=======
>>>>>>> origin/master
