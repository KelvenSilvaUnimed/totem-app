import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatCpfInput } from '@/services/utils.service';
import styles, { palette } from '@/styles/totem.styles';

interface CpfRespFinanceiroStepProps {
  nomeRespFinanceiro: string;
  cpfRespFinanceiro: string;
  setCpfRespFinanceiro: (v: string) => void;
  loading: boolean;
  isTablet: boolean;
  scrollRef: React.MutableRefObject<ScrollView | null>;
  isFormFocusedRef: React.MutableRefObject<boolean>;
  setIsFormFocused: (v: boolean) => void;
  onConfirmar: () => void;
  onVoltar: () => void;
}

/**
 * Passo: digitação do CPF do responsável financeiro.
 * Exibido apenas para PF quando o plano possui responsável financeiro ativo.
 */
export default function CpfRespFinanceiroStep({
  nomeRespFinanceiro,
  cpfRespFinanceiro,
  setCpfRespFinanceiro,
  loading,
  isTablet,
  scrollRef,
  isFormFocusedRef,
  setIsFormFocused,
  onConfirmar,
  onVoltar,
}: CpfRespFinanceiroStepProps) {
  return (
    <View style={styles.welcomeCard}>
      <View style={styles.rfAjudaIconWrap}>
        <Ionicons name="shield-checkmark-outline" size={56} color={palette.greenDark} />
      </View>

      <Text style={styles.pjWelcome}>Verificação de identidade</Text>

      <Text style={[styles.pjNextStep, { marginTop: 8, marginBottom: 28 }]}>
        Este plano possui responsável financeiro:{' '}
        <Text style={{ fontWeight: '800', color: palette.greenDark }}>{nomeRespFinanceiro}</Text>
        {'\n'}Informe o CPF do responsável para continuar.
      </Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
        enabled={Platform.OS !== 'web'}
      >
        <View style={[styles.totemFieldOuter, isTablet && styles.formContainerTablet]}>
          <View style={styles.totemFieldBorder}>
            <Ionicons name="person-outline" size={36} color={palette.greenDark} />
            <TextInput
              style={styles.totemFieldTextInput}
              placeholder="000.000.000-00"
              placeholderTextColor="#9ca3af"
              value={cpfRespFinanceiro}
              onChangeText={(v) => setCpfRespFinanceiro(formatCpfInput(v))}
              keyboardType="numeric"
              maxLength={14}
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

        <View style={[styles.cpfButtonRow, isTablet && styles.cpfButtonRowTablet]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onVoltar} disabled={loading}>
            <Text style={styles.cancelButtonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.greenButton, styles.greenButtonIconRow, loading && styles.buttonDisabled]}
            onPress={onConfirmar}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle-outline" size={30} color={palette.white} />
            <Text style={styles.greenButtonText}>CONFIRMAR</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
