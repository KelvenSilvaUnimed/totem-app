import { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import type { ScaledSize } from 'react-native';

export interface ViewportState {
  viewportWidth: number;
  viewportHeight: number;
  isTablet: boolean;
  atendenteWidth: number;
  atendenteHeight: number;
}

/** Rastreia dimensões da viewport, modo tablet e tamanho do personagem atendente. */
export function useViewport(): ViewportState {
  const [viewport, setViewport] = useState(() =>
    Dimensions.get(Platform.OS === 'web' ? 'window' : 'screen'),
  );
  const [stableViewport, setStableViewport] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 };
    }
    return Dimensions.get(Platform.OS === 'web' ? 'window' : 'screen');
  });

  const stableViewportRef = useRef(stableViewport);
  const isFormFocusedRef = useRef(false);
  const keyboardHeightRef = useRef(0);

  // Mantém ref sincronizada
  useEffect(() => {
    stableViewportRef.current = stableViewport;
  }, [stableViewport]);

  // Sincronização inicial (web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const syncViewport = () => {
      const next = { width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 };
      setViewport(next);
      if (!isFormFocusedRef.current && keyboardHeightRef.current === 0) setStableViewport(next);
    };
    const raf = requestAnimationFrame(syncViewport);
    const timeout = window.setTimeout(syncViewport, 50);
    return () => { cancelAnimationFrame(raf); clearTimeout(timeout); };
  }, []);

  // Resize (web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onResize = () => {
      const next = { width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 };
      setViewport(next);
      if (!isFormFocusedRef.current && keyboardHeightRef.current === 0) setStableViewport(next);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Dimensions API (nativo + web)
  useEffect(() => {
    const onChange = ({ window: win, screen: scr }: { window: ScaledSize; screen: ScaledSize }) => {
      if (win?.width && win?.height) {
        setViewport(win);
        if (Platform.OS === 'web') {
          const stable = stableViewportRef.current;
          const widthChanged = Math.abs(win.width - stable.width) > 40;
          const heightIncreased = win.height > stable.height + 40;
          const keyboardVisible = isFormFocusedRef.current || keyboardHeightRef.current > 0;
          if (!keyboardVisible || widthChanged || heightIncreased) setStableViewport(win);
        }
      }
      if (Platform.OS !== 'web' && scr?.width && scr?.height) setStableViewport(scr);
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove?.();
  }, []);

  // Fullscreen (web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !document.fullscreenElement) {
        const el = document.documentElement;
        el.requestFullscreen?.().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const stableWidth =
    stableViewport.width || (Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 0);
  const stableHeight =
    stableViewport.height || (Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerHeight : 0);
  const liveWidth =
    viewport.width || (Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 0);
  const liveHeight =
    viewport.height || (Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerHeight : 0);

  const viewportWidth = Platform.OS === 'web' ? stableWidth : liveWidth;
  const viewportHeight = Platform.OS === 'web' ? stableHeight : liveHeight;

  const viewportMax = Math.max(viewportWidth, viewportHeight);
  const viewportMin = Math.min(viewportWidth, viewportHeight);
  const isWebTablet = Platform.OS === 'web' && viewportMax >= 900 && viewportMax <= 1400 && viewportMin <= 1000;
  const isNativeTablet = Platform.OS !== 'web' && (viewportMax >= 900 || viewportMin >= 720);
  const isTablet = isWebTablet || isNativeTablet;

  // Personagem atendente — um pouco menor para não competir com o conteúdo.
  const atendenteWidth = viewportWidth * (isTablet ? 0.38 : 0.22);
  const atendenteHeight = viewportHeight * (isTablet ? 0.60 : 0.48);

  return { viewportWidth, viewportHeight, isTablet, atendenteWidth, atendenteHeight };
}
