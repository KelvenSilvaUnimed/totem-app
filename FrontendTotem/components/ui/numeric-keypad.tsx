import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  disabledConfirm?: boolean;
  marginTop?: number;
  /** Largura máxima do teclado (default 700). */
  maxWidth?: number;
  /** Ajustes finos do fundo (painel cinza) por tela. */
  panelPaddingHorizontal?: number;
  panelPaddingTop?: number;
  panelPaddingBottom?: number;
};

const GRID: Array<Array<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'>> = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export default function NumericKeypad({
  onDigit,
  onDelete,
  onConfirm,
  confirmLabel = 'CONTINUAR',
  disabledConfirm = false,
  marginTop = 24,
  maxWidth = 700,
  panelPaddingHorizontal = 44,
  panelPaddingTop = 20,
  panelPaddingBottom = 20,
}: Props) {
  return (
    <View style={[styles.container, { marginTop, maxWidth }]}>
      <View
        style={[
          styles.panel,
          { paddingHorizontal: panelPaddingHorizontal, paddingTop: panelPaddingTop, paddingBottom: panelPaddingBottom },
        ]}
      >
        {GRID.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((k) => (
              <TouchableOpacity key={k} style={styles.key} activeOpacity={0.85} onPress={() => onDigit(k)}>
                <Text style={styles.keyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.row}>
          <TouchableOpacity style={[styles.key, styles.deleteKey]} activeOpacity={0.85} onPress={onDelete}>
            <View style={styles.deleteInner}>
              <Ionicons name="backspace-outline" size={22} color="#111827" />
              <Text style={styles.deleteText}>APAGAR</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.key} activeOpacity={0.85} onPress={() => onDigit('0')}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.key, styles.confirmKey, disabledConfirm && styles.disabled]}
            activeOpacity={0.85}
            onPress={onConfirm}
            disabled={disabledConfirm}
          >
            <View style={styles.confirmInner}>
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
  panel: {
    width: '100%',
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    ...Platform.select({
      web: { boxShadow: '0 18px 34px rgba(0,0,0,0.12)' },
      default: { elevation: 6 },
    }),
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 12,
  },
  key: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 140,
    maxWidth: 200,
    height: 82,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 10px 18px rgba(0,0,0,0.10)' },
      default: { elevation: 5 },
    }),
  },
  keyText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  deleteKey: {
    backgroundColor: '#ffffff',
  },
  deleteInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  confirmKey: {
    backgroundColor: '#2d5016',
  },
  confirmInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  disabled: {
    opacity: 0.55,
  },
});

