import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Beneficiario } from '@/services/api.types';
import { formatDataNascimentoInput } from '@/services/utils.service';
import styles, { palette, scale } from '@/styles/totem.styles';
import NumericKeypad from '@/components/ui/numeric-keypad';
import InputCard from '@/components/ui/input-card';

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
  const contratoDigits = (campoComplementar || '').replace(/\D/g, '');
  const dataDigits = (campoComplementar || '').replace(/\D/g, '');
  const maxContratoLen = 20;

  const handleKeyPress = (key: string) => {
    if (isPJ) {
      if (contratoDigits.length >= maxContratoLen) return;
      setCampoComplementar(contratoDigits + key);
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
      setCampoComplementar(contratoDigits.slice(0, -1));
    } else {
      const numericOnly = (campoComplementar || '').replace(/\D/g, '');
      if (numericOnly.length > 0) {
        setCampoComplementar(formatDataNascimentoInput(numericOnly.slice(0, -1)));
      }
    }
  };

  return (
    <View style={styles.welcomeCard}>
      <TouchableOpacity style={styles.backCornerButton} onPress={onReset} disabled={loading}>
        <Ionicons name="chevron-back" size={22} color={palette.greenDark} />
        <Text style={styles.backCornerText}>Voltar</Text>
      </TouchableOpacity>
      <View style={isPJ ? styles.pjBadge : styles.pfBadge}>
        <Ionicons name="person-outline" size={22} color={palette.greenDark} />
        <Text style={isPJ ? styles.pjBadgeText : styles.pfBadgeText}>
          {isPJ ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}
        </Text>
      </View>

      <Text style={[styles.pjWelcome, { fontSize: scale(34), marginBottom: scale(6) }]}>Olá, {nome}!</Text>

      {nomeEmpresaDoLookup ? (
        <Text style={[styles.pjNextStep, { fontStyle: 'normal', fontWeight: '600', color: palette.greenDark }]}>
          Encontramos o seu vínculo com a empresa {nomeEmpresaDoLookup}.
        </Text>
      ) : null}

      <Text style={[styles.pjNascimentoInfo, { marginTop: nomeEmpresaDoLookup ? 6 : 18, marginBottom: isPJ ? 6 : 12 }]}>
        {isPJ ? 'Digite o número do contrato' : 'Para continuar, informe a data de nascimento do titular'}
      </Text>

      {isPJ ? (
        <>
          <View style={{ width: '100%', alignSelf: 'center' }}>
            <InputCard iconName="document-text-outline" value={contratoDigits} placeholder=" " maxWidth={700} />
          </View>
          <NumericKeypad
            marginTop={8}
            onDigit={handleKeyPress}
            onDelete={handleDelete}
            onConfirm={onConfirmar}
            disabledConfirm={loading || contratoDigits.length === 0}
            confirmLabel="CONTINUAR"
          />
        </>
      ) : (
        <>
          <View style={{ width: '100%', alignSelf: 'center' }}>
            <InputCard
              iconName="calendar-outline"
              value={campoComplementar}
              placeholder=""
              maxWidth={700}
            />
          </View>

          <NumericKeypad
            marginTop={18}
            onDigit={handleKeyPress}
            onDelete={handleDelete}
            onConfirm={onConfirmar}
            disabledConfirm={loading || dataDigits.length !== 8}
            confirmLabel="CONTINUAR"
          />
        </>
      )}

      {/* Confirmação ocorre pelo teclado (CONTINUAR). */}
    </View>
  );
}
