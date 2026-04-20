import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, View } from 'react-native';

export const TabBounceButton = (props: any) => {
  const { children, onPress } = props;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.90, 
      useNativeDriver: true,
      speed: 30,      // Достаточно быстро, чтобы палец чувствовал отклик
      bounciness: 4,  // Небольшой акцент при нажатии
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,   // Среднее значение: кнопка возвращается четко, с микро-отскоком
      tension: 170,  // Хорошая энергия возврата
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ scale }],
        }}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};