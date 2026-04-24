import React from "react";
import { View, StyleSheet, Platform } from "react-native";
// Выбери импорт в зависимости от твоего проекта:
import { LinearGradient } from 'expo-linear-gradient'; 
// import LinearGradient from 'react-native-linear-gradient'; // для CLI

export const WelcomeCard = () => {
  return (
    <LinearGradient
      colors={['#0054A6', '#003d7a']}
      start={{ x: 0, y: 0 }} // Примерно соответствует 135deg
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topHeader}>

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 175,
    borderRadius: 24, // Хорошая практика для карточек с тенями
    
    // --- Настройка теней ---
    // Для iOS
    shadowColor: "#0054A6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,

    // Для Android (поддерживает только цвет и силу возвышения)
    elevation: 10,
  
  },
});