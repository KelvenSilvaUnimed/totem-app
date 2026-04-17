import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import styles, { palette } from '@/styles/totem.styles';

interface RespFinanceiroAjudaStepProps {
  loading: boolean;
  onEncerrar: () => void;
}

/** Passo de ajuda — responsável financeiro incorreto. */
export default function RespFinanceiroAjudaStep({ loading, onEncerrar }: RespFinanceiroAjudaStepProps) {
  return (
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
        <TouchableOpacity style={[styles.greenButton, loading && styles.buttonDisabled]} onPress={onEncerrar} disabled={loading}>
          <Text style={styles.greenButtonText}>Encerrar atendimento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
