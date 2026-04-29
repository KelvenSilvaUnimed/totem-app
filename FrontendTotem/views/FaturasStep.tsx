import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { Fatura } from '@/services/api.types';
import styles, { palette } from '@/styles/totem.styles';
import Ionicons from '@expo/vector-icons/Ionicons';

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
  const parseDdMmYyyy = (s: string) => {
    const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(String(s || ''));
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    if (!dd || !mm || !yyyy) return null;
    return new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  };

  const isVencida = (vencimento: string) => {
    const d = parseDdMmYyyy(vencimento);
    if (!d) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

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
      <TouchableOpacity style={styles.backCornerButton} onPress={onVoltar} disabled={loading}>
        <Ionicons name="chevron-back" size={22} color={palette.greenDark} />
        <Text style={styles.backCornerText}>Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.faturasTitle}>Faturas em aberto</Text>
      <Text style={styles.faturasSubtitle}>{resumo}</Text>

      <View style={styles.faturasPanel}>
        <ScrollView horizontal={false} showsVerticalScrollIndicator={false} style={styles.faturaScroll}>
          {faturas.map((item, index) => {
            const numero = getNumeroFatura(item, index);
            const selected = selectedFatura === numero;
            const venc = formatarDataFatura(item);
            const vencida = isVencida(venc);
            const statusLabel = vencida ? 'VENCIDA' : 'EM ABERTO';
            const statusBg = vencida ? 'rgba(245, 158, 11, 0.18)' : 'rgba(34, 197, 94, 0.16)';
            const statusColor = vencida ? '#b45309' : '#166534';
            return (
              <View key={numero} style={[styles.faturaCard, selected && styles.faturaCardSelected]}>
                <View style={styles.faturaCardRow}>
                  <View style={styles.faturaIconWrap}>
                    <Ionicons name="document-text-outline" size={30} color={palette.greenDark} />
                    <View style={[styles.faturaIconBadge, { backgroundColor: vencida ? '#f59e0b' : palette.greenDark }]}>
                      <Ionicons name={vencida ? 'alert' : 'checkmark'} size={14} color="#ffffff" />
                    </View>
                  </View>

                  <View style={styles.faturaMid}>
                    <View style={styles.faturaCol}>
                      <Text style={styles.faturaLabel}>Vencimento</Text>
                      <Text style={styles.faturaValue}>{venc}</Text>
                      <View style={[styles.faturaStatusPill, { backgroundColor: statusBg }]}>
                        <Text style={[styles.faturaStatusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.faturaCol}>
                      <Text style={styles.faturaLabel}>Valor</Text>
                      <Text style={styles.faturaValue}>{formatarValorFatura(item)}</Text>
                    </View>
                  </View>

                  <View style={styles.faturaActions}>
                    <TouchableOpacity
                      style={[styles.faturaActionOutline, loading && styles.buttonDisabled]}
                      onPress={() => onVisualizar(item, index)}
                      disabled={loading}
                    >
                      {selected && loading ? (
                        <ActivityIndicator color={palette.darkText} />
                      ) : (
                        <>
                          <Ionicons name="eye-outline" size={18} color={palette.greenDark} />
                          <Text style={styles.faturaActionOutlineText}>Visualizar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.faturaActionPrimary, loading && styles.buttonDisabled]}
                      onPress={() => onImprimir(item, index)}
                      disabled={loading}
                    >
                      {selected && loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="print-outline" size={18} color="#ffffff" />
                          <Text style={styles.faturaActionPrimaryText}>Imprimir</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.buttonRow, isTablet && styles.buttonRowTablet]}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onReset} disabled={loading}>
          <Text style={styles.secondaryButtonText}>Consultar novo CPF/CNPJ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
