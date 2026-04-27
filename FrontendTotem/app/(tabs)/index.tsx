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
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'react-native';
import type { ImageStyle } from 'react-native';

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


  const renderStatus = () => {
    if (!ctrl.status || ctrl.status.type === 'ok') return null;
    const isWarn = ctrl.status.type === 'warn';
    return (
      <View
        style={[
          styles.status,
          {
            backgroundColor: isWarn ? 'rgba(63,20,5,0.8)' : 'rgba(62,12,17,0.82)',
            borderColor: isWarn ? 'rgba(245,158,11,0.8)' : 'rgba(239,68,68,0.8)',
          },
        ]}
      >
        <Text style={styles.statusText}>{ctrl.status.message}</Text>
      </View>
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
        <KeyboardAvoidingView
          style={styles.contentWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          enabled={Platform.OS !== 'web'}
        >
          <Animated.ScrollView
            ref={scrollRef as any}
            contentContainerStyle={[
              styles.scrollContent,
              isTablet && styles.scrollContentTablet,
              keyboardHeight > 0 && { paddingBottom: keyboardHeight + 24 },
              isFormFocused && {
                paddingBottom: Math.max(
                  keyboardHeight,
                  ctrl.step === 'cpf' || (ctrl.step === 'validacao' && ctrl.isPessoaJuridica) ? 20 : 120,
                ),
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
          >
            {renderStatus()}

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
                      onReset={ctrl.resetarFluxo}
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
        onVoltarParaFaturas={ctrl.handleVoltarParaFaturas}
        onEncerrar={ctrl.handleEncerrarAtendimento}
      />
    </View>
  );
}
