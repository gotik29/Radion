import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, ViewStyle } from 'react-native';

interface BurgerProps {
  isOpen: boolean;    // Состояние: открыто меню или нет
  onPress: () => void; // Функция при клике
  style?: ViewStyle;   // Возможность задать позицию (например, top, right)
  color?: string;      // Цвет полосочек (по умолчанию темный)
}

const AnimatedBurgerButton = ({ isOpen, onPress, style, color = '#1f2937' }: BurgerProps) => {
  const burgerAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(burgerAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // Layout-свойства не поддерживают native driver
    }).start();
  }, [isOpen]);

  // Интерполяции для трансформации в крестик
  const topBarRotate = burgerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const topBarMargin = burgerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const bottomBarRotate = burgerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

  const bottomBarMargin = burgerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });

  const midBarOpacity = burgerAnim.interpolate({
    inputRange: [0, 0.2],
    outputRange: [1, 0],
  });

  return (
    <TouchableOpacity
      style={[styles.burgerButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[styles.burgerLine, { backgroundColor: color, transform: [{ rotate: topBarRotate }], marginTop: topBarMargin }]}
      />
      <Animated.View
        style={[styles.burgerLine, { backgroundColor: color, opacity: midBarOpacity }]}
      />
      <Animated.View
        style={[styles.burgerLine, { backgroundColor: color, transform: [{ rotate: bottomBarRotate }], marginTop: bottomBarMargin }]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  burgerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  burgerLine: {
    width: 30,
    height: 3,
    marginBottom: 5,
    borderRadius: 2,
  },
});

export default AnimatedBurgerButton;