import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import type { ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatCpfInput } from '@/services/utils.service';
import styles, { palette, scale } from '@/styles/totem.styles';
import NumericKeypad from '@/components/ui/numeric-keypad';
import InputCard from '@/components/ui/input-card';

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
  const cpfDigits = (cpfRespFinanceiro || '').replace(/\D/g, '');

  const handleKeyPress = (key: string) => {
    if (cpfDigits.length < 11) {
      setCpfRespFinanceiro(formatCpfInput(cpfDigits + key));
    }
  };

  const handleDelete = () => {
    if (cpfDigits.length > 0) {
      setCpfRespFinanceiro(formatCpfInput(cpfDigits.slice(0, -1)));
    }
  };

  return (
    <View style={styles.welcomeCard}>
      <TouchableOpacity style={styles.backCornerButton} onPress={onVoltar} disabled={loading}>
        <Ionicons name="chevron-back" size={22} color={palette.greenDark} />
        <Text style={styles.backCornerText}>Voltar</Text>
      </TouchableOpacity>
      <View style={styles.rfAjudaIconWrap}>
        <Ionicons name="shield-checkmark-outline" size={56} color={palette.greenDark} />
      </View>

      <Text style={styles.pjWelcome}>Verificação de identidade</Text>

      <Text style={[styles.pjNextStep, { marginTop: 8, marginBottom: 20 }]}>
        Este plano possui responsável financeiro:{' '}
        <Text style={{ fontWeight: '800', color: palette.greenDark }}>{nomeRespFinanceiro}</Text>
        {'\n'}Informe o CPF do responsável para continuar.
      </Text>

      <View style={{ width: '100%', alignSelf: 'center' }}>
        <InputCard iconName="person-outline" value={cpfRespFinanceiro} placeholder="000.000.000-00" maxWidth={700} />
      </View>

      <NumericKeypad
        marginTop={18}
        onDigit={handleKeyPress}
        onDelete={handleDelete}
        onConfirm={onConfirmar}
        disabledConfirm={loading || cpfDigits.length !== 11}
        confirmLabel="CONTINUAR"
      />
    </View>
  );
}
