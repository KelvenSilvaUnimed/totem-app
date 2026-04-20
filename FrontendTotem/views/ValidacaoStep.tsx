import { Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Beneficiario } from '@/services/api.types';
import { formatDataNascimentoInput } from '@/services/utils.service';
import styles, { palette, scale } from '@/styles/totem.styles';
import VirtualKeypad from '@/components/ui/virtual-keypad';

interface ValidacaoStepProps {
  beneficiario: Beneficiario | null;
  campoComplementar: string;
  setCampoComplementar: (v: string) => void;
  isPJ: boolean;
  isTablet: boolean;
  loading: boolean;
  nomeEmpresaDoLookup: string;
  onConfirmar: () => void;
  onReset: () => void;
}

/** Passo 2 – validação (data de nascimento PF ou nº contrato PJ). */
export default function ValidacaoStep({
  beneficiario,
  campoComplementar,
  setCampoComplementar,
  isPJ,
  isTablet,
  loading,
  nomeEmpresaDoLookup,
  onConfirmar,
  onReset,
}: ValidacaoStepProps) {
  const nome = beneficiario?.nome_titular || '';

  const handleKeyPress = (key: string) => {
    if (isPJ) {
      setCampoComplementar(campoComplementar + key);
    } else {
      const numericOnly = (campoComplementar || '').replace(/\D/g, '');
      if (numericOnly.length < 8) {
        setCampoComplementar(formatDataNascimentoInput(numericOnly + key));
      }
    }
  };

  const handleClear = () => setCampoComplementar('');
  
  const handleDelete = () => {
    if (isPJ) {
      setCampoComplementar((campoComplementar || '').slice(0, -1));
    } else {
      const numericOnly = (campoComplementar || '').replace(/\D/g, '');
      if (numericOnly.length > 0) {
        setCampoComplementar(formatDataNascimentoInput(numericOnly.slice(0, -1)));
      }
    }
  };

  return (
    <View style={styles.welcomeCard}>
      <View style={isPJ ? styles.pjBadge : styles.pfBadge}>
        <Text style={isPJ ? styles.pjBadgeText : styles.pfBadgeText}>
          {isPJ ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}
        </Text>
      </View>

      <Text style={styles.pjWelcome}>Olá, {nome}!</Text>

      {nomeEmpresaDoLookup ? (
        <Text style={[styles.pjNextStep, { fontStyle: 'normal', fontWeight: '600', color: palette.greenDark }]}>
          Encontramos o seu vínculo com a empresa {nomeEmpresaDoLookup}.
        </Text>
      ) : null}

      <Text style={[styles.pjNascimentoInfo, { marginBottom: 20 }]}>
        {isPJ ? 'Informe o número do contrato para continuar' : 'Para continuar, informe a data de nascimento do titular'}
      </Text>

      <View style={[isPJ ? styles.formContainer : styles.formContainerPfData, isTablet && styles.formContainerTablet]}>
        <View style={isPJ ? styles.totemFieldOuter : styles.pjNascimentoFieldOuter}>
          <View style={styles.totemFieldBorder}>
            <Ionicons name={isPJ ? 'document-text-outline' : 'calendar-outline'} size={36} color={palette.greenDark} />
            <TextInput
              style={[styles.totemFieldTextInput, { pointerEvents: 'none' }]}
              accessibilityLabel={isPJ ? 'Número do contrato' : 'Data de nascimento do titular'}
              placeholder={isPJ ? 'Número do contrato' : 'DD/MM/AAAA'}
              placeholderTextColor="#9ca3af"
              value={campoComplementar}
              editable={false}
            />
          </View>
        </View>
      </View>

      <VirtualKeypad 
        onPress={handleKeyPress}
        onClear={handleClear}
        onDelete={handleDelete}
      />

      <View style={[styles.cpfButtonRow, isTablet && styles.cpfButtonRowTablet, { marginTop: scale(40) }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onReset} disabled={loading}>
          <Text style={styles.cancelButtonText}>Digitar outro CPF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.greenButton, loading && styles.buttonDisabled]} onPress={onConfirmar} disabled={loading}>
          <Text style={styles.greenButtonText}>BUSCAR FATURAS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
