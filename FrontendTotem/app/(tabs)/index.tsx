import { useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'react-native';
import type { ImageStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTotemController } from '@/controllers/useTotemController';
import { useViewport } from '@/hooks/use-viewport';
import { useKeyboard } from '@/hooks/use-keyboard';

import TotemBackground from '@/views/TotemBackground';
import CpfStep from '@/views/CpfStep';
import ValidacaoStep from '@/views/ValidacaoStep';
import RespFinanceiroStep from '@/views/RespFinanceiroStep';
import RespFinanceiroAjudaStep from '@/views/RespFinanceiroAjudaStep';
import CpfRespFinanceiroStep from '@/views/CpfRespFinanceiroStep';
import FaturasStep from '@/views/FaturasStep';
import BoletoModal from '@/views/BoletoModal';

import styles, { palette } from '@/styles/totem.styles';

export default function TotemHomeScreen() {
  const params = useLocalSearchParams<{ idleReset?: string }>();

  const { viewportWidth, viewportHeight, isTablet, atendenteWidth, atendenteHeight } = useViewport();
  const { keyboardHeight, isFormFocused, isFormFocusedRef, scrollRef, setIsFormFocused } = useKeyboard();
  const ctrl = useTotemController();

  const stepOpacity = useSharedValue(1);
  const stepTranslateX = useSharedValue(0);
  const statusOpacity = useSharedValue(1);
  const statusTranslateY = useSharedValue(0);

  // Idle reset disparado pelo layout de inatividade
  useEffect(() => {
    if (params?.idleReset) ctrl.resetarFluxoRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.idleReset]);

  // Evita "foco" persistente entre steps (ex.: keypad virtual não abre teclado nativo),
  // o que pode deixar um paddingBottom grande e criar scroll/vazio desnecessário.
  useEffect(() => {
    setIsFormFocused(false);
  }, [ctrl.step, setIsFormFocused]);

  // Quando o teclado virtual é usado, garantimos que o ScrollView volte ao topo.
  // Sem isso, ele pode ficar "preso" numa posição rolada com o scroll desabilitado.
  useEffect(() => {
    if (ctrl.step === 'cpf' || ctrl.step === 'validacao' || ctrl.step === 'cpf_resp_financeiro') {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo?.({ y: 0, animated: false });
      });
    }
  }, [ctrl.step, scrollRef]);

  // Toast overlay (warn/err): aparece sobre a tela e some gradualmente em 10s.
  useEffect(() => {
    if (!ctrl.status) {
      // Prepara para o próximo toast
      statusOpacity.value = 1;
      statusTranslateY.value = 0;
      return;
    }
    if (ctrl.status.type === 'ok') return;

    // Garante visibilidade imediata (mesmo antes da animação)
    statusOpacity.value = 1;
    statusTranslateY.value = 0;

    // Mantém por ~9s e faz fade-out no último 1s (total ~10s)
    statusOpacity.value = withDelay(9000, withTiming(0, { duration: 1000, easing: Easing.in(Easing.cubic) }));
    statusTranslateY.value = withDelay(9000, withTiming(-8, { duration: 1000, easing: Easing.in(Easing.cubic) }));

    const t = setTimeout(() => ctrl.clearStatus(), 10000);
    return () => clearTimeout(t);
  }, [ctrl.status, ctrl, statusOpacity, statusTranslateY]);

  // Animação suave ao trocar de etapa (mais confiável que entering/exiting no web).
  useEffect(() => {
    stepOpacity.value = 0;
    stepTranslateX.value = 24;
    stepOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    stepTranslateX.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [ctrl.step, stepOpacity, stepTranslateX]);

  const stepAnimStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
    transform: [{ translateX: stepTranslateX.value }],
  }));

  const statusAnimStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
    transform: [{ translateY: statusTranslateY.value }],
  }));


  const renderStatus = () => {
    if (!ctrl.status || ctrl.status.type === 'ok') return null;
    const isWarn = ctrl.status.type === 'warn';
    const icon = isWarn ? 'alert-circle-outline' : 'close-circle-outline';
    return (
      <Animated.View pointerEvents="none" style={[styles.statusToastOverlay, statusAnimStyle]}>
        <View
          style={[
            styles.statusToast,
            {
              borderColor: isWarn ? 'rgba(245,158,11,0.95)' : 'rgba(239,68,68,0.95)',
            },
          ]}
        >
          <View style={styles.statusToastRow}>
            <Ionicons name={icon as any} size={22} color="#ffffff" />
            <Text style={styles.statusToastText}>{ctrl.status.message}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.screenRoot, { width: viewportWidth, height: viewportHeight }]}>
      <TotemBackground
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        isTablet={isTablet}
        atendenteWidth={atendenteWidth}
        atendenteHeight={atendenteHeight}
      />

      <SafeAreaView style={styles.safeArea}>
        {renderStatus()}
        <KeyboardAvoidingView
          style={styles.contentWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          enabled={Platform.OS !== 'web'}
        >
          <Animated.ScrollView
            ref={scrollRef as any}
            scrollEnabled={!(ctrl.step === 'cpf' || ctrl.step === 'validacao' || ctrl.step === 'cpf_resp_financeiro')}
            contentContainerStyle={[
              styles.scrollContent,
              isTablet && styles.scrollContentTablet,
              // Quando o scroll está desativado (teclado virtual), evitamos centralização vertical
              // e reduzimos o padding superior para não "cortar" o topo do conteúdo.
              (ctrl.step === 'cpf' || ctrl.step === 'validacao' || ctrl.step === 'cpf_resp_financeiro') && {
                justifyContent: 'flex-start',
                paddingTop: 16,
              },
              // Na validação (PF e PJ), reduz o padding inferior padrão para evitar "vazio" rolável
              // abaixo do teclado virtual (NumericKeypad).
              ctrl.step === 'validacao' && { paddingBottom: 0 },
              // Para teclado virtual (NumericKeypad), esse padding cria "vazio" rolável.
              keyboardHeight > 0 && { paddingBottom: keyboardHeight + 45 },
              isFormFocused && keyboardHeight > 0 && {
                paddingBottom: Math.max(
                  keyboardHeight,
                  ctrl.step === 'cpf'
                    ? 20
                    : ctrl.step === 'validacao'
                      ? (ctrl.isPessoaJuridica ? 20 : 60)
                      : 120,
                ),
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
          >
            {/* Decorações de topo dentro do ScrollView para rolarem junto com o conteúdo */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, pointerEvents: 'none' }}>
              <View
                style={[
                  styles.topLeftImage,
                  isTablet && styles.topLeftImageTablet,
                  {
                    top: Platform.OS === 'web' ? -32 : -24,
                    left: Platform.OS === 'web' ? -20 : -14,
                    width: Math.min(viewportWidth * 0.32, isTablet ? 520 : 420),
                    height: Math.min(viewportHeight * 0.22, isTablet ? 320 : 240),
                    zIndex: 0,
                  },
                ]}
              >
                <Image
                  source={require('@/assets/images/top_left.png')}
                  style={styles.decorImageFill as ImageStyle}
                  resizeMode="contain"
                />
              </View>

              <View
                style={[
                  styles.topRightImage,
                  isTablet && styles.topRightImageTablet,
                  {
                    top: Platform.OS === 'web' ? -30 : -22,
                    right: Platform.OS === 'web' ? -49 : -40,
                    width: Math.min(viewportWidth * 0.30, isTablet ? 520 : 420),
                    height: Math.min(viewportHeight * 0.22, isTablet ? 340 : 260),
                    zIndex: 0,
                  },
                ]}
              >
                <Image
                  source={require('@/assets/images/top_right.png')}
                  style={styles.decorImageFill as ImageStyle}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Animated.View style={[{ width: '100%' }, stepAnimStyle]}>
                {ctrl.step === 'cpf' && (
                  <CpfStep
                    cpf={ctrl.cpf}
                    setCpf={ctrl.setCpf}
                    loading={ctrl.loading}
                    onConfirmar={ctrl.handleLookup}
                    scrollRef={scrollRef}
                    setIsFormFocused={setIsFormFocused}
                  />
                )}

                {ctrl.step === 'validacao' && (
                  <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                    <ValidacaoStep
                      beneficiario={ctrl.beneficiario}
                      campoComplementar={ctrl.campoComplementar}
                      setCampoComplementar={ctrl.setCampoComplementar}
                      isPJ={ctrl.isPessoaJuridica}
                      isTablet={isTablet}
                      loading={ctrl.loading}
                      nomeEmpresaDoLookup={ctrl.nomeEmpresaDoLookup}
                      onConfirmar={ctrl.handleConfirmarValidacao}
                      onReset={ctrl.resetarFluxo}
                    />
                  </View>
                )}

                {ctrl.step === 'resp_financeiro' && (
                  <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                    <RespFinanceiroStep
                      beneficiario={ctrl.beneficiario}
                      loading={ctrl.loading}
                      isTablet={isTablet}
                      onContinuar={ctrl.handleContinuarRespFinanceiro}
                      onAjuda={() => ctrl.setStep('resp_financeiro_ajuda')}
                    />
                  </View>
                )}

                {ctrl.step === 'resp_financeiro_ajuda' && (
                  <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                    <RespFinanceiroAjudaStep
                      loading={ctrl.loading}
                      onEncerrar={ctrl.handleEncerrarAtendimento}
                    />
                  </View>
                )}

                {ctrl.step === 'cpf_resp_financeiro' && (
                  <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                    <CpfRespFinanceiroStep
                      nomeRespFinanceiro={ctrl.beneficiario?.nome_resp_financeiro || ''}
                      cpfRespFinanceiro={ctrl.cpfRespFinanceiro}
                      setCpfRespFinanceiro={ctrl.setCpfRespFinanceiro}
                      loading={ctrl.loading}
                      isTablet={isTablet}
                      scrollRef={scrollRef}
                      isFormFocusedRef={isFormFocusedRef}
                      setIsFormFocused={setIsFormFocused}
                      onConfirmar={ctrl.handleConfirmarCpfRespFinanceiro}
                      onVoltar={() => ctrl.setStep('resp_financeiro')}
                    />
                  </View>
                )}

                {ctrl.step === 'faturas' && (
                  <View style={isTablet ? styles.welcomeCardTablet : undefined}>
                    <FaturasStep
                      faturas={ctrl.faturas}
                      selectedFatura={ctrl.selectedFatura}
                      loading={ctrl.loading}
                      isTablet={isTablet}
                      resumo={ctrl.resumoFaturas}
                      getNumeroFatura={ctrl.getNumeroFatura}
                      formatarValorFatura={ctrl.formatarValorFatura}
                      formatarDataFatura={ctrl.formatarDataFatura}
                      onVisualizar={ctrl.handleVisualizarLinha}
                      onImprimir={ctrl.handleImprimirLinha}
                      onVoltar={ctrl.handleVoltarParaValidacao}
                    />
                  </View>
                )}
            </Animated.View>

            {ctrl.loading && (
              <View style={styles.loading}>
                <Text style={styles.loadingText}>
                  {ctrl.step === 'faturas' && ctrl.selectedFatura
                    ? `Carregando boleto da fatura ${ctrl.selectedFatura}...`
                    : 'Processando...'}
                </Text>
                <ActivityIndicator color={palette.primary} style={{ marginLeft: 8 }} />
              </View>
            )}
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <BoletoModal
        visible={ctrl.isBoletoModalVisible}
        url={ctrl.boletoModalUrl}
        loading={ctrl.loading}
        onVoltarParaFaturas={ctrl.handleVoltarParaFaturas}
        onImprimir={ctrl.handleImprimir}
        onEncerrar={ctrl.handleEncerrarAtendimento}
      />
    </View>
  );
}
