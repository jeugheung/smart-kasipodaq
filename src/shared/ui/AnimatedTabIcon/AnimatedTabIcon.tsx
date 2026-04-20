import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const AnimatedTabIcon = ({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      // Используем sequence: сначала быстро "вдавливаем", потом отпускаем пружину
      Animated.sequence([
        // 1. Быстрое сжатие (имитация нажатия)
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 50, // Очень быстро, всего 50 мс
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 4,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),
        // 2. Отскок пружины наверх
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,      // Чем меньше, тем больше "дрожание"
            tension: 250,     // Сила пружины
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 4,
            tension: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Плавное возвращение в исходное состояние (если таб потерял фокус)
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused, scale, translateY]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }, { translateY }],
      }}
    >
      {children}
    </Animated.View>
  );
};