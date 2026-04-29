import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import type { ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import styles, { palette } from '@/styles/totem.styles';
import { formatCpfInput } from '@/services/utils.service';
import NumericKeypad from '@/components/ui/numeric-keypad';
import FluidContainer from '@/components/ui/fluid-container';
import InputCard from '@/components/ui/input-card';
import { useEffect, useRef, useState } from 'react';

interface CpfStepProps {
  cpf: string;
  setCpf: (v: string) => void;
  loading: boolean;
  onConfirmar: () => void;
  scrollRef: React.MutableRefObject<ScrollView | null>;
  setIsFormFocused: (v: boolean) => void;
}

/** Passo 1 – entrada do CPF do titular. */
export default function CpfStep({ cpf, setCpf, loading, onConfirmar, scrollRef, setIsFormFocused }: CpfStepProps) {
  const [showKeypad, setShowKeypad] = useState(false);
  const lastAutoConfirmCpfRef = useRef<string>('');
  const cpfDigits = (cpf || '').replace(/\D/g, '');

  const handleAbrirKeypad = () => {
    setShowKeypad(true);
    setIsFormFocused(true);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  // Auto-confirma ao completar 11 dígitos.
  useEffect(() => {
    if (!showKeypad) return;
    if (loading) return;
    const digitos = (cpf || '').replace(/\D/g, '');
    if (digitos.length !== 11) return;
    if (lastAutoConfirmCpfRef.current === digitos) return;
    lastAutoConfirmCpfRef.current = digitos;
    onConfirmar();
  }, [cpf, showKeypad, loading, onConfirmar]);

  const handleKeyPress = (key: string) => {
    // Remove formatação para adicionar o novo dígito
    if (cpfDigits.length < 11) {
      setCpf(formatCpfInput(cpfDigits + key));
    }
  };

  const handleDelete = () => {
    if (cpfDigits.length > 0) {
      setCpf(formatCpfInput(cpfDigits.slice(0, -1)));
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

        <View style={{ width: '100%', alignSelf: 'center', marginBottom: 10 }}>
          <InputCard
            iconName="document-text-outline"
            value={cpf}
            placeholder="000.000.000-00"
            maxWidth={700}
            onPress={handleAbrirKeypad}
          />
          {loading ? (
            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={palette.orange} />
            </View>
          ) : null}
        </View>

        {showKeypad ? (
          <NumericKeypad
            marginTop={8}
            maxWidth={700}
            onDigit={handleKeyPress}
            onDelete={handleDelete}
            onConfirm={onConfirmar}
            confirmLabel="CONTINUAR"
            disabledConfirm={loading || cpfDigits.length !== 11}
          />
        ) : null}

        {/* Confirma automaticamente ao completar 11 dígitos */}
      </View>
    </FluidContainer>
  );
}
