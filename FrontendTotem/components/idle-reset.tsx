import { useEffect, useRef } from 'react';
import { AppState, Keyboard, Platform, View } from 'react-native';

type Props = {
  timeoutMs: number;
  onIdle: () => void;
  children: React.ReactNode;
  /** Opcional: não dispara idle enquanto true (ex.: carregando). */
  disabled?: boolean;
};

export function IdleReset({ timeoutMs, onIdle, children, disabled }: Props) {
  const lastActivityRef = useRef(Date.now());
  const disabledRef = useRef(Boolean(disabled));

  useEffect(() => {
    disabledRef.current = Boolean(disabled);
  }, [disabled]);

  const mark = () => {
    lastActivityRef.current = Date.now();
  };

  // Web: ponteiros/teclado/scroll.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = () => mark();
    window.addEventListener('pointerdown', handler, true);
    window.addEventListener('keydown', handler, true);
    window.addEventListener('scroll', handler, true);
    window.addEventListener('touchstart', handler, true);
    window.addEventListener('mousemove', handler, true);
    return () => {
      window.removeEventListener('pointerdown', handler, true);
      window.removeEventListener('keydown', handler, true);
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('touchstart', handler, true);
      window.removeEventListener('mousemove', handler, true);
    };
  }, []);

  // Native: teclado, app foreground, etc.
  useEffect(() => {
    const subShow = Keyboard.addListener('keyboardDidShow', mark);
    const subHide = Keyboard.addListener('keyboardDidHide', mark);
    const subApp = AppState.addEventListener('change', () => mark());
    return () => {
      subShow.remove();
      subHide.remove();
      // @ts-expect-error compat RN versions
      subApp?.remove?.();
    };
  }, []);

  // Checagem periódica.
  useEffect(() => {
    const id = setInterval(() => {
      if (disabledRef.current) return;
      if (Date.now() - lastActivityRef.current < timeoutMs) return;
      onIdle();
    }, 500);
    return () => clearInterval(id);
  }, [onIdle, timeoutMs]);

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        mark();
        return false;
      }}
    >
      {children}
    </View>
  );
}

