import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import type { ScrollView } from 'react-native';

export interface KeyboardState {
  keyboardHeight: number;
  isFormFocused: boolean;
  isFormFocusedRef: React.MutableRefObject<boolean>;
  keyboardHeightRef: React.MutableRefObject<number>;
  scrollRef: React.MutableRefObject<ScrollView | null>;
  setIsFormFocused: (v: boolean) => void;
}

/** Rastreia altura do teclado virtual e foco de formulário. */
export function useKeyboard(): KeyboardState {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const isFormFocusedRef = useRef(false);
  const keyboardHeightRef = useRef(0);
  const scrollRef = useRef<ScrollView | null>(null);

  // Teclado nativo
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      const h = event.endCoordinates?.height || 0;
      keyboardHeightRef.current = h;
      setKeyboardHeight(h);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Visual Viewport API (web — teclado virtual PWA)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const vp = window.visualViewport;
    if (!vp) return;
    const update = () => {
      const diff = window.innerHeight - vp.height - vp.offsetTop;
      const h = Math.max(0, diff);
      keyboardHeightRef.current = h;
      setKeyboardHeight(h);
    };
    vp.addEventListener('resize', update);
    vp.addEventListener('scroll', update);
    update();
    return () => { vp.removeEventListener('resize', update); vp.removeEventListener('scroll', update); };
  }, []);

  const handleSetIsFormFocused = (v: boolean) => {
    isFormFocusedRef.current = v;
    setIsFormFocused(v);
  };

  return {
    keyboardHeight,
    isFormFocused,
    isFormFocusedRef,
    keyboardHeightRef,
    scrollRef,
    setIsFormFocused: handleSetIsFormFocused,
  };
}
