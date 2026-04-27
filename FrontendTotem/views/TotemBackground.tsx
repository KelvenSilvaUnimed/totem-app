import { Image, ImageBackground, Platform, View } from 'react-native';
import type { ImageStyle } from 'react-native';
import styles from '@/styles/totem.styles';
import type { SharedValue } from 'react-native-reanimated';

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

interface TotemBackgroundProps {
  viewportWidth: number;
  viewportHeight: number;
  isTablet: boolean;
  atendenteWidth: number;
  atendenteHeight: number;
  scrollY?: SharedValue<number>; // (mantido por compat, mas não usado aqui)
}

/** Camada de fundo: imagem de fundo, decorações e personagem atendente. */
export default function TotemBackground({
  viewportWidth,
  viewportHeight,
  isTablet,
  atendenteWidth,
  atendenteHeight,
  scrollY,
}: TotemBackgroundProps) {
  // Dimensões responsivas (percentuais + clamps) para manter proporção em telas diferentes.
  const vw = viewportWidth;
  const vh = viewportHeight;

  const isDesktop1366 =
    Platform.OS === 'web' &&
    Math.abs(vw - 1366) <= 40 &&
    Math.abs(vh - 768) <= 40;

  const bottomLeft = {
    bottom: isDesktop1366 ? 1 : -0.06 * vh,
    left: isDesktop1366 ? -170 : -0.15 * vw,
    width: isDesktop1366 ? 780 : clamp(0.58 * vw, 380, isTablet ? 1200 : 900),
    height: isDesktop1366 ? 450 : clamp(0.44 * vh, 340, isTablet ? 900 : 650),
  } as const;

  const bottomRight = {
    bottom: isDesktop1366 ? 5 : -0.01 * vh,
    right: isDesktop1366 ? -135 : -0.08 * vw,
    width: isDesktop1366 ? 520 : clamp(0.49 * vw, 370, isTablet ? 760 : 560),
    height: isDesktop1366 ? 530 : clamp(0.72 * vh, 480, isTablet ? 920 : 760),
  } as const;

  const atendenteDims = {
    width: isDesktop1366 ? 390 : atendenteWidth,
    height: isDesktop1366 ? 390 : atendenteHeight,
  } as const;

  const atendentePos = {
    bottom: isDesktop1366 ? -16 : -0.02 * vh,
    left: isDesktop1366 ? 35 : 0.03 * vw,
  } as const;

  return (
    <View
      style={[
        styles.backgroundLayer,
        Platform.OS === 'web' && styles.backgroundLayerFixed,
        { pointerEvents: 'none', width: viewportWidth, height: viewportHeight },
      ]}
    >
      <ImageBackground
        source={require('@/assets/images/fundo_.png')}
        style={[styles.backgroundImage, isTablet && styles.backgroundImageTablet, { width: viewportWidth, height: viewportHeight }]}
        resizeMode="cover"
      >
        <View style={[styles.bottomLeftImage, isTablet && styles.bottomLeftImageTablet, bottomLeft]}>
          <Image source={require('@/assets/images/bottom_left.png')} style={styles.decorImageFill as ImageStyle} resizeMode="contain" />
        </View>
        <View style={[styles.bottomRightImage, isTablet && styles.bottomRightImageTablet, bottomRight]}>
          <Image source={require('@/assets/images/bottom_right.png')} style={styles.decorImageFill as ImageStyle} resizeMode="contain" />
        </View>
        <View style={[styles.atendenteContainer, isTablet && styles.atendenteContainerTablet, atendentePos]}>
          <Image
            source={require('@/assets/images/atendente.png')}
            style={[
              styles.atendenteImage as ImageStyle,
              { width: atendenteDims.width, height: atendenteDims.height },
              isTablet && (styles.atendenteImageTablet as ImageStyle),
            ]}
            resizeMode="contain"
          />
        </View>
      </ImageBackground>
    </View>
  );
}
