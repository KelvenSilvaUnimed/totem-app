import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

type Props = {
  value: string;
  digitsCount: number;
  /** Se true, destaca a próxima posição a digitar. */
  showCaret?: boolean;
};

export default function DigitBoxes({ value, digitsCount, showCaret = true }: Props) {
  const digits = (value || '').replace(/\D/g, '').slice(0, digitsCount);
  const caretIndex = Math.min(digits.length, digitsCount - 1);

  return (
    <View style={styles.row} accessibilityLabel="Entrada numérica">
      {Array.from({ length: digitsCount }).map((_, idx) => {
        const d = digits[idx] ?? '';
        const isActive = showCaret && d === '' && idx === caretIndex;
        return (
          <View key={idx} style={[styles.box, isActive && styles.boxActive]}>
            <Text style={styles.digit}>{d}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  box: {
    width: 56,
    height: 66,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 10px 20px rgba(0,0,0,0.08)' },
      default: { elevation: 4 },
    }),
  },
  boxActive: {
    borderColor: '#2d5016',
  },
  digit: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
});

