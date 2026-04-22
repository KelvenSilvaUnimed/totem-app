import { Platform, TextInput, Text, TouchableOpacity, View } from 'react-native';
import type { ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import styles, { palette, scale } from '@/styles/totem.styles';
import { formatCpfInput } from '@/services/utils.service';
import VirtualKeypad from '@/components/ui/virtual-keypad';
import FluidContainer from '@/components/ui/fluid-container';
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

  const handleAbrirKeypad = () => {
    setShowKeypad(true);
    setIsFormFocused(true);
    // Sobe o campo + keypad (funciona para web e nativo).
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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleAbrirKeypad}
            style={
              Platform.OS === 'web'
                ? ({
                    outlineStyle: 'none',
                    outlineWidth: 0,
                    outlineColor: 'transparent',
                    boxShadow: 'none',
                  } as any)
                : undefined
            }
          >
            <View style={styles.totemFieldBorder}>
              <Ionicons name="document-text-outline" size={36} color={palette.greenDark} />
              <TextInput
                style={styles.totemFieldTextInput}
                placeholder="000.000.000-00"
                placeholderTextColor="#9ca3af"
                value={cpf}
                editable={false} // Impede o teclado do sistema no Web/Nativo
              />
            </View>
          </TouchableOpacity>
        </View>

        {showKeypad ? (
          <VirtualKeypad 
            onPress={handleKeyPress}
            onClear={handleClear}
            onDelete={handleDelete}
          />
        ) : null}

        {showKeypad ? (
          <TouchableOpacity
            style={[
              styles.homeConfirmButton,
              loading && styles.buttonDisabled,
              { marginTop: scale(18) },
            ]}
            onPress={onConfirmar}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.homeConfirmButtonText}>CONFIRMAR</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </FluidContainer>
  );
}
