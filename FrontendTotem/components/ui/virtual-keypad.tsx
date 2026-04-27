import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface VirtualKeypadProps {
  onPress: (key: string) => void;
  onClear: () => void;
  onDelete: () => void;
  /** Espaço acima do teclado (default 30). */
  marginTop?: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'];

export default function VirtualKeypad({ onPress, onClear, onDelete, marginTop = 30 }: VirtualKeypadProps) {
  const handlePress = (key: string) => {
    if (key === 'CLR') {
      onClear();
    } else if (key === 'DEL') {
      onDelete();
    } else {
      onPress(key);
    }
  };

  return (
    <View style={[styles.container, { marginTop }]}>
      <View style={styles.grid}>
        {KEYS.map((key) => {
          const isClr = key === 'CLR';
          const isDel = key === 'DEL';
          return (
            <TouchableOpacity
              key={key}
              style={[styles.key, isClr && styles.specialKey, isDel && styles.delKey]}
              onPress={() => handlePress(key)}
              activeOpacity={0.7}
            >
              {isDel ? (
                <Ionicons name="backspace-outline" size={28} color="#374151" />
              ) : (
                <Text style={[styles.keyText, isClr && styles.specialKeyText]}>
                  {isClr ? 'apagar' : key}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    zIndex: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  key: {
    width: 96,
    height: 70,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2d5016',
    ...Platform.select({
      web: { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
      default: { elevation: 4 },
    }),
  },
  specialKey: {
    backgroundColor: '#e8883a', // palette.orange
    borderColor: '#c2711b',
    borderWidth: 2,
  },
  delKey: {
    backgroundColor: '#e5e7eb', // cinza claro
    borderColor: '#cbd5e1',
    borderWidth: 2,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d5016', // palette.greenDark
  },
  specialKeyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
