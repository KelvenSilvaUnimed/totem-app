import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { TextStyle, ViewStyle } from 'react-native';

type Props = {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  placeholder?: string;
  /** Cor do texto quando vazio (default: preto bem fraco). */
  placeholderColor?: string;
  /** Largura máxima do card. */
  maxWidth?: number;
  /** Ação ao clicar no campo (opcional). */
  onPress?: () => void;
  /** Customização fina do card/texto para casos especiais (ex.: data). */
  cardStyle?: ViewStyle;
  textStyle?: TextStyle;
};

export default function InputCard({
  iconName,
  value,
  placeholder = '',
  placeholderColor = '#9ca3af',
  maxWidth = 700,
  onPress,
  cardStyle,
  textStyle,
}: Props) {
  const isEmpty = !String(value || '').trim();
  const display = isEmpty ? (placeholder || ' ') : value;
  const hasLetters = /[A-Za-zÀ-ÿ]/.test(display);
  const letterSpacing = hasLetters ? 0.8 : 2;

  const content = (
    <View style={[styles.card, { maxWidth }, cardStyle]}>
      <View style={styles.row}>
        <Ionicons name={iconName} size={28} color="#2d5016" />
        <Text
          style={[
            styles.text,
            { color: isEmpty ? placeholderColor : '#111827', letterSpacing },
            textStyle,
          ]}
        >
          {display}
        </Text>
      </View>
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
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
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 30,
    paddingVertical: 22,
    paddingHorizontal: 26,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 18px 34px rgba(0,0,0,0.10)' },
      default: { elevation: 7 },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 48,
  },
});

