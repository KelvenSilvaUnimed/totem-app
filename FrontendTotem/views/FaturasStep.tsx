import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { Fatura } from '@/services/api.types';
import styles, { palette } from '@/styles/totem.styles';

interface FaturasStepProps {
  faturas: Fatura[];
  selectedFatura: string | null;
  loading: boolean;
  isTablet: boolean;
  resumo: string;
  getNumeroFatura: (item: Fatura, index: number) => string;
  formatarValorFatura: (item: Fatura) => string;
  formatarDataFatura: (item: Fatura) => string;
  onVisualizar: (item: Fatura, index: number) => void;
  onImprimir: (item: Fatura, index: number) => void;
  onVoltar: () => void;
  onReset: () => void;
}

/** Passo de listagem de faturas em aberto. */
export default function FaturasStep({
  faturas,
  selectedFatura,
  loading,
  isTablet,
  resumo,
  getNumeroFatura,
  formatarValorFatura,
  formatarDataFatura,
  onVisualizar,
  onImprimir,
  onVoltar,
  onReset,
}: FaturasStepProps) {
  if (!faturas.length) {
    return (
      <View style={[styles.card, styles.faturaScreenContainer]}>
        <View style={styles.semFaturaEmptyState}>
          <Text style={styles.semFaturaMensagemBonita}>Nenhuma fatura em aberto</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onReset}>
            <Text style={styles.secondaryButtonText}>Consultar novo CPF/CNPJ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.faturaScreenContainer]}>
      <Text style={styles.cardTitle}>Faturas em aberto</Text>
      <Text style={styles.muted}>{resumo}</Text>

      <View style={styles.faturaHeader}>
        <Text style={styles.faturaHeaderText}>Data</Text>
        <Text style={styles.faturaHeaderText}>Valor</Text>
        <Text style={styles.faturaHeaderText}>Ação</Text>
      </View>

      <ScrollView horizontal={false} showsVerticalScrollIndicator={false} style={styles.faturaScroll}>
        {faturas.map((item, index) => {
          const numero = getNumeroFatura(item, index);
          const selected = selectedFatura === numero;
          return (
            <View key={numero} style={[styles.faturaRow, selected && styles.faturaRowSelected]}>
              <Text style={styles.faturaRowText}>{formatarDataFatura(item)}</Text>
              <Text style={styles.faturaRowValue}>{formatarValorFatura(item)}</Text>
              <View style={styles.rowActionGroup}>
                <TouchableOpacity
                  style={[styles.rowActionButton, loading && styles.buttonDisabled]}
                  onPress={() => onVisualizar(item, index)}
                  disabled={loading}
                >
                  {selected && loading ? (
                    <ActivityIndicator color={palette.darkText} />
                  ) : (
                    <Text style={styles.rowActionButtonText}>Visualizar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rowActionButton, loading && styles.buttonDisabled]}
                  onPress={() => onImprimir(item, index)}
                  disabled={loading}
                >
                  {selected && loading ? (
                    <ActivityIndicator color={palette.darkText} />
                  ) : (
                    <Text style={styles.rowActionButtonText}>Imprimir</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.buttonRow, isTablet && styles.buttonRowTablet]}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onVoltar} disabled={loading}>
          <Text style={styles.secondaryButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onReset} disabled={loading}>
          <Text style={styles.secondaryButtonText}>Consultar novo CPF/CNPJ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
