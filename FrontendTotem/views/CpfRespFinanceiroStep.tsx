import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatCpfInput } from '@/services/utils.service';
import styles, { palette, scale } from '@/styles/totem.styles';
import VirtualKeypad from '@/components/ui/virtual-keypad';

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
  const handleKeyPress = (key: string) => {
    const numericOnly = cpfRespFinanceiro.replace(/\D/g, '');
    if (numericOnly.length < 11) {
      setCpfRespFinanceiro(formatCpfInput(numericOnly + key));
    }
  };

  const handleClear = () => setCpfRespFinanceiro('');
  
  const handleDelete = () => {
    const numericOnly = cpfRespFinanceiro.replace(/\D/g, '');
    if (numericOnly.length > 0) {
      setCpfRespFinanceiro(formatCpfInput(numericOnly.slice(0, -1)));
    }
  };

  return (
    <View style={styles.welcomeCard}>
      <View style={styles.rfAjudaIconWrap}>
        <Ionicons name="shield-checkmark-outline" size={56} color={palette.greenDark} />
      </View>

      <Text style={styles.pjWelcome}>Verificação de identidade</Text>

      <Text style={[styles.pjNextStep, { marginTop: 8, marginBottom: 20 }]}>
        Este plano possui responsável financeiro:{' '}
        <Text style={{ fontWeight: '800', color: palette.greenDark }}>{nomeRespFinanceiro}</Text>
        {'\n'}Informe o CPF do responsável para continuar.
      </Text>

      <View style={[styles.totemFieldOuter, isTablet && styles.formContainerTablet]}>
        <View style={styles.totemFieldBorder}>
          <Ionicons name="person-outline" size={36} color={palette.greenDark} />
          <TextInput
            style={[styles.totemFieldTextInput, { pointerEvents: 'none' }]}
            placeholder="000.000.000-00"
            placeholderTextColor="#9ca3af"
            value={cpfRespFinanceiro}
            editable={false}
          />
        </View>
      </View>

      <VirtualKeypad 
        onPress={handleKeyPress}
        onClear={handleClear}
        onDelete={handleDelete}
      />

      <View style={[styles.cpfButtonRow, isTablet && styles.cpfButtonRowTablet, { marginTop: scale(40) }]}>
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
    </View>
  );
}
