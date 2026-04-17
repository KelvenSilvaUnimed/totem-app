import { Image, ImageBackground, Platform, View } from 'react-native';
import type { ImageStyle } from 'react-native';
import styles from '@/styles/totem.styles';

interface TotemBackgroundProps {
  viewportWidth: number;
  viewportHeight: number;
  isTablet: boolean;
  atendenteWidth: number;
  atendenteHeight: number;
}

/** Camada de fundo: imagem de fundo, decorações e personagem atendente. */
export default function TotemBackground({
  viewportWidth,
  viewportHeight,
  isTablet,
  atendenteWidth,
  atendenteHeight,
}: TotemBackgroundProps) {
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
        <View style={[styles.topLeftImage, isTablet && styles.topLeftImageTablet]}>
          <Image source={require('@/assets/images/top_left.png')} style={styles.decorImageFill as ImageStyle} resizeMode="contain" />
        </View>
        <View style={[styles.topRightImage, isTablet && styles.topRightImageTablet]}>
          <Image source={require('@/assets/images/top_right.png')} style={styles.decorImageFill as ImageStyle} resizeMode="contain" />
        </View>
        <View style={[styles.bottomLeftImage, isTablet && styles.bottomLeftImageTablet]}>
          <Image source={require('@/assets/images/bottom_left.png')} style={styles.decorImageFill as ImageStyle} resizeMode="contain" />
        </View>
        <View style={[styles.bottomRightImage, isTablet && styles.bottomRightImageTablet]}>
          <Image source={require('@/assets/images/bottom_right.png')} style={styles.decorImageFill as ImageStyle} resizeMode="contain" />
        </View>
        <View style={[styles.atendenteContainer, isTablet && styles.atendenteContainerTablet]}>
          <Image
            source={require('@/assets/images/atendente.png')}
            style={[styles.atendenteImage as ImageStyle, { width: atendenteWidth, height: atendenteHeight }, isTablet && (styles.atendenteImageTablet as ImageStyle)]}
            resizeMode="contain"
          />
        </View>
      </ImageBackground>
    </View>
  );
}
