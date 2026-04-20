import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing 
} from 'react-native-reanimated';

interface FluidContainerProps {
  children: React.ReactNode;
  delay?: number;
}

export default function FluidContainer({ children, delay = 0 }: FluidContainerProps) {
  const isWeb = Platform.OS === 'web';
  const opacity = useSharedValue(isWeb ? 1 : 0);
  const translateY = useSharedValue(isWeb ? 0 : 20);

  useEffect(() => {
    if (!isWeb) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
      translateY.value = withDelay(delay, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));
    }
  }, [delay, isWeb, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    width: '100%',
    alignItems: 'center',
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
