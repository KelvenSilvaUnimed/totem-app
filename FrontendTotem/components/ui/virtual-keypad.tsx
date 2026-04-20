import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface VirtualKeypadProps {
  onPress: (key: string) => void;
  onClear: () => void;
  onDelete: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'];

export default function VirtualKeypad({ onPress, onClear, onDelete }: VirtualKeypadProps) {
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
    <View style={styles.container}>
      <View style={styles.grid}>
        {KEYS.map((key) => {
          const isSpecial = key === 'CLR' || key === 'DEL';
          return (
            <TouchableOpacity
              key={key}
              style={[styles.key, isSpecial && styles.specialKey]}
              onPress={() => handlePress(key)}
              activeOpacity={0.7}
            >
              {key === 'DEL' ? (
                <Ionicons name="backspace-outline" size={32} color="#fff" />
              ) : (
                <Text style={[styles.keyText, isSpecial && styles.specialKeyText]}>
                  {key}
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
    maxWidth: 400,
    marginTop: 30,
    alignSelf: 'center',
    zIndex: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  key: {
    width: 110,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
    borderColor: '#e8883a',
  },
  keyText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d5016', // palette.greenDark
  },
  specialKeyText: {
    color: '#fff',
    fontSize: 24,
  },
});
