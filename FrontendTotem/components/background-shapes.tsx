import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Cores do tema Unimed
const colors = {
  primaryDark: '#00703C',   // Verde escuro
  primaryLight: '#8DC63F',  // Verde claro
  accent: '#F7941D',        // Laranja
  accentLight: '#C5D86D',   // Verde amarelado (círculo pequeno)
};

export function BackgroundShapes() {
  return (
    <View style={styles.container}>
      {/* Forma verde escuro - canto superior esquerdo */}
      <Svg 
        style={styles.topLeftDark} 
        width={400} 
        height={200} 
        viewBox="0 0 400 200"
        preserveAspectRatio="xMinYMin slice"
      >
        <Path
          d="M0,0 L300,0 Q350,30 320,80 Q280,140 200,160 Q120,180 60,140 Q0,100 0,0 Z"
          fill={colors.primaryDark}
        />
      </Svg>

      {/* Forma verde claro - abaixo da verde escuro */}
      <Svg 
        style={styles.topLeftLight} 
        width={150} 
        height={180} 
        viewBox="0 0 150 180"
        preserveAspectRatio="xMinYMin slice"
      >
        <Path
          d="M0,50 Q30,0 80,20 Q130,40 120,100 Q110,160 60,180 L0,180 L0,50 Z"
          fill={colors.primaryDark}
        />
      </Svg>

      {/* Círculo verde claro pequeno - superior */}
      <View style={styles.greenCircleSmall} />

      {/* Forma laranja - canto superior direito */}
      <Svg 
        style={styles.topRight} 
        width={350} 
        height={250} 
        viewBox="0 0 350 250"
        preserveAspectRatio="xMaxYMin slice"
      >
        <Path
          d="M350,0 L350,180 Q300,220 220,200 Q140,180 120,120 Q100,60 150,20 Q200,0 350,0 Z"
          fill={colors.accent}
        />
      </Svg>

      {/* Pontos decorativos verdes - superior direito */}
      <View style={styles.dotsContainer}>
        {[...Array(8)].map((_, row) => (
          <View key={row} style={styles.dotsRow}>
            {[...Array(8)].map((_, col) => (
              <View key={col} style={styles.dot} />
            ))}
          </View>
        ))}
      </View>

      {/* Círculo laranja - meio esquerdo */}
      <View style={styles.orangeCircle} />

      {/* Forma verde claro grande - canto inferior esquerdo */}
      <Svg 
        style={styles.bottomLeft} 
        width={350} 
        height={500} 
        viewBox="0 0 350 500"
        preserveAspectRatio="xMinYMax slice"
      >
        <Path
          d="M0,150 Q80,100 150,150 Q220,200 200,300 Q180,400 100,480 Q50,520 0,500 L0,150 Z"
          fill={colors.primaryLight}
        />
      </Svg>

      {/* Forma laranja - canto inferior direito */}
      <Svg 
        style={styles.bottomRight} 
        width={200} 
        height={250} 
        viewBox="0 0 200 250"
        preserveAspectRatio="xMaxYMax slice"
      >
        <Path
          d="M200,80 L200,250 L60,250 Q20,220 40,170 Q60,120 120,100 Q180,80 200,80 Z"
          fill={colors.accent}
        />
      </Svg>

      {/* Círculo verde escuro - centro inferior */}
      <View style={styles.greenCircleBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  
  // Canto superior esquerdo - verde escuro
  topLeftDark: {
    position: 'absolute',
    top: -20,
    left: -20,
  },
  
  // Forma verde escuro menor
  topLeftLight: {
    position: 'absolute',
    top: 80,
    left: 80,
  },
  
  // Círculo verde claro pequeno
  greenCircleSmall: {
    position: 'absolute',
    top: 160,
    left: 350,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentLight,
  },
  
  // Canto superior direito - laranja
  topRight: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  
  // Container dos pontos
  dotsContainer: {
    position: 'absolute',
    top: 70,
    right: 150,
    gap: 8,
  },
  
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primaryDark,
  },
  
  // Círculo laranja - meio esquerdo
  orangeCircle: {
    position: 'absolute',
    top: '35%',
    left: 100,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
  },
  
  // Canto inferior esquerdo - verde claro
  bottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -50,
  },
  
  // Canto inferior direito - laranja
  bottomRight: {
    position: 'absolute',
    bottom: 80,
    right: -30,
  },
  
  // Círculo verde escuro - centro inferior
  greenCircleBottom: {
    position: 'absolute',
    bottom: 50,
    left: '38%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryDark,
  },
});

