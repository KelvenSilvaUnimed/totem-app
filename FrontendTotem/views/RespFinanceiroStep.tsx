import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Beneficiario } from '@/services/api.types';
import { formatNomeCompleto } from '@/services/utils.service';
import styles, { palette } from '@/styles/totem.styles';

interface RespFinanceiroStepProps {
  beneficiario: Beneficiario | null;
  loading: boolean;
  isTablet: boolean;
  onContinuar: () => void;
  onAjuda: () => void;
}

/** Passo de confirmação do responsável financeiro. */
export default function RespFinanceiroStep({ beneficiario, loading, isTablet, onContinuar, onAjuda }: RespFinanceiroStepProps) {
  const nome = formatNomeCompleto(beneficiario?.nome_resp_financeiro || '');
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
        <TouchableOpacity style={styles.cancelButton} onPress={onAjuda} disabled={loading}>
          <Text style={styles.cancelButtonText}>Responsável incorreto?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.greenButton, styles.greenButtonIconRow, loading && styles.buttonDisabled]} onPress={onContinuar} disabled={loading}>
          <Ionicons name="checkmark-circle-outline" size={30} color={palette.white} />
          <Text style={styles.greenButtonText}>CONFIRMAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
