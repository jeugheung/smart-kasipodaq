import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Modal, Animated, Easing } from 'react-native';

type Props = {
  visible: boolean;
};

export const SharedLoader = ({ visible }: Props) => {
  // Внутренний стейт, чтобы модалка не закрывалась раньше времени
  const [shouldRender, setShouldRender] = useState(visible);
  
  const rotate = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Запуск вращения
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Плавный вход
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      // Тот самый плавный уход
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300, // Время исчезновения
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false); // Убираем модалку только после конца анимации
      });
    }
  }, [visible]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal 
      transparent 
      visible={shouldRender} 
      animationType="none"
      statusBarTranslucent={true} 
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          collapsable={false} 
          style={[
            styles.container, 
            { 
              opacity: fadeAnim, // 🔥 ВОТ ФИКС! Заставляем квадрат с тенью затухать вместе со всеми
              transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1] }) }] 
            }
          ]}
        >
          <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, // 🔥 Гарантированно растягиваем на весь экран
    backgroundColor: 'rgba(0,0,0,0.4)', // Плотный фон для хорошего контраста
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    width: 72,
    height: 72,
    borderRadius: 20, 
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    // 🔥 Мягкая и аккуратная тень для iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, 
    shadowRadius: 12,
    // 🔥 Аккуратная тень для Android (больше не черное пятно)
    elevation: 3,
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#F1F5F9',
    borderTopColor: '#002F42',
  },
});