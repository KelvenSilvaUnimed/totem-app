import { TextInput, Text, TouchableOpacity, View, Keyboard } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import styles, { palette, scale } from '@/styles/totem.styles';
import { formatCpfInput } from '@/services/utils.service';
import VirtualKeypad from '@/components/ui/virtual-keypad';
import FluidContainer from '@/components/ui/fluid-container';

interface CpfStepProps {
  cpf: string;
  setCpf: (v: string) => void;
  loading: boolean;
  onConfirmar: () => void;
}

/** Passo 1 – entrada do CPF do titular. */
export default function CpfStep({ cpf, setCpf, loading, onConfirmar }: CpfStepProps) {
  const handleKeyPress = (key: string) => {
    // Remove formatação para adicionar o novo dígito
    const numericOnly = cpf.replace(/\D/g, '');
    if (numericOnly.length < 11) {
      setCpf(formatCpfInput(numericOnly + key));
    }
  };

  const handleClear = () => setCpf('');
  
  const handleDelete = () => {
    const numericOnly = cpf.replace(/\D/g, '');
    if (numericOnly.length > 0) {
      setCpf(formatCpfInput(numericOnly.slice(0, -1)));
    }
  };

  return (
    <FluidContainer>
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
              style={[styles.totemFieldTextInput, { pointerEvents: 'none' }]}
              placeholder="000.000.000-00"
              placeholderTextColor="#9ca3af"
              value={cpf}
              editable={false} // Impede o teclado do sistema no Web/Nativo
            />
          </View>
        </View>

        <VirtualKeypad 
          onPress={handleKeyPress}
          onClear={handleClear}
          onDelete={handleDelete}
        />

        <TouchableOpacity
          style={[styles.homeConfirmButton, loading && styles.buttonDisabled, { marginTop: scale(40) }]}
          onPress={onConfirmar}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.homeConfirmButtonText}>CONFIRMAR</Text>
        </TouchableOpacity>
      </View>
    </FluidContainer>
  );
}
