import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from 'react-native';
// Если используешь Bare Workflow (RN CLI), замени на 'react-native-linear-gradient'
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  width?: DimensionValue;
  height?: DimensionValue;
};

export const AppButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  width = '100%',
  height = 40,
}: Props) => {
  const isDisabled = disabled || loading;

  // Используем 'as const', чтобы TypeScript понимал, что в массиве минимум 2 цвета
  const gradientColors = isDisabled
    ? (['#D1D5DB', '#9CA3AF'] as const)
    : (['#0054A6', '#003d7a'] as const);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        { width, height },
        styles.container,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden', // Чтобы градиент не вылезал за скругленные углы
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
});