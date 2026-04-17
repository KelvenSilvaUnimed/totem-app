import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Beneficiario } from '@/services/api.types';
import { formatDataNascimentoInput } from '@/services/utils.service';
import styles, { palette } from '@/styles/totem.styles';

interface ValidacaoStepProps {
  beneficiario: Beneficiario | null;
  campoComplementar: string;
  setCampoComplementar: (v: string) => void;
  isPJ: boolean;
  isTablet: boolean;
  loading: boolean;
  nomeEmpresaDoLookup: string;
  scrollRef: React.MutableRefObject<ScrollView | null>;
  isFormFocusedRef: React.MutableRefObject<boolean>;
  setIsFormFocused: (v: boolean) => void;
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
  scrollRef,
  isFormFocusedRef,
  setIsFormFocused,
  onConfirmar,
  onReset,
}: ValidacaoStepProps) {
  const nome = beneficiario?.nome_titular || '';

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

      <Text style={styles.pjNascimentoInfo}>
        {isPJ ? 'Informe o número do contrato para continuar' : 'Para continuar, informe a data de nascimento do titular'}
      </Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : 'padding'} enabled={Platform.OS !== 'web'}>
        <View style={[isPJ ? styles.formContainer : styles.formContainerPfData, isTablet && styles.formContainerTablet]}>
          <View style={isPJ ? styles.totemFieldOuter : styles.pjNascimentoFieldOuter}>
            <View style={styles.totemFieldBorder}>
              <Ionicons name={isPJ ? 'document-text-outline' : 'calendar-outline'} size={36} color={palette.greenDark} />
              <TextInput
                style={styles.totemFieldTextInput}
                accessibilityLabel={isPJ ? 'Número do contrato' : 'Data de nascimento do titular'}
                placeholder={isPJ ? 'Número do contrato' : 'DD/MM/AAAA'}
                placeholderTextColor="#9ca3af"
                value={campoComplementar}
                onChangeText={(v) => setCampoComplementar(isPJ ? v : formatDataNascimentoInput(v))}
                keyboardType="numeric"
                maxLength={isPJ ? undefined : 10}
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
        </View>

        <View style={[styles.cpfButtonRow, isTablet && styles.cpfButtonRowTablet]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onReset} disabled={loading}>
            <Text style={styles.cancelButtonText}>Digitar outro CPF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.greenButton, loading && styles.buttonDisabled]} onPress={onConfirmar} disabled={loading}>
            <Text style={styles.greenButtonText}>BUSCAR FATURAS</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
