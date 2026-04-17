import { TextInput, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import styles, { palette } from '@/styles/totem.styles';
import { formatCpfInput } from '@/services/utils.service';

interface CpfStepProps {
  cpf: string;
  setCpf: (v: string) => void;
  loading: boolean;
  onConfirmar: () => void;
}

/** Passo 1 – entrada do CPF do titular. */
export default function CpfStep({ cpf, setCpf, loading, onConfirmar }: CpfStepProps) {
  return (
    <View style={[styles.welcomeCard, styles.homeScreenRoot]}>
      <View style={styles.homeReceiptIconWrap}>
        <Ionicons name="receipt-outline" size={100} color={palette.orange} />
      </View>
      <Text style={styles.homeEmissaoTitle}>EMISSÃO DE 2ª VIA DE BOLETO</Text>
      <Text style={styles.homeBemVindo}>Bem-vindo!</Text>
      <Text style={styles.homeInstrucaoCpf}>Informe o CPF do titular</Text>

      <View style={styles.totemFieldOuter}>
        <View style={styles.totemFieldBorder}>
          <Ionicons name="document-text-outline" size={36} color={palette.greenDark} />
          <TextInput
            style={styles.totemFieldTextInput}
            placeholder="000.000.000-00"
            placeholderTextColor="#9ca3af"
            value={cpf}
            onChangeText={(v) => setCpf(formatCpfInput(v))}
            keyboardType="numeric"
            maxLength={14}
            autoFocus
            underlineColorAndroid="transparent"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.homeConfirmButton, loading && styles.buttonDisabled]}
        onPress={onConfirmar}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.homeConfirmButtonText}>CONFIRMAR</Text>
      </TouchableOpacity>
    </View>
  );
}
