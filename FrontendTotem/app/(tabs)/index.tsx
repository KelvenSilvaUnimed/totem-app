import { useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

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

  // Idle reset disparado pelo layout de inatividade
  useEffect(() => {
    if (params?.idleReset) ctrl.resetarFluxoRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.idleReset]);

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

            {ctrl.step === 'cpf' && (
              <CpfStep
                cpf={ctrl.cpf}
                setCpf={ctrl.setCpf}
                loading={ctrl.loading}
                onConfirmar={ctrl.handleLookup}
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
                  scrollRef={scrollRef}
                  isFormFocusedRef={isFormFocusedRef}
                  setIsFormFocused={setIsFormFocused}
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
          </ScrollView>
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
