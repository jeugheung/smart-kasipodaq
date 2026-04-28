import React from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
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
      <View style={styles.leftHeader}>
        <View style={styles.topHeader}>
          <Text style={styles.littleTitle}>Добро пожаловать</Text>
          <Text style={styles.nameValue}>Андрей Ким</Text>
        </View>
        <View style={styles.topHeader}>
          <Text style={styles.littleTitle}>Организация</Text>
          <Text style={styles.organizationTitle}>Профсоюз “Парасат”</Text>
        </View>
      </View>
      <View style={styles.rightHeader}>
        <View style={styles.statusCard}>

        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 160,
    borderRadius: 24, // Хорошая практика для карточек с тенями
    padding: 15,
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
  leftHeader: {
    maxWidth: 220,
    width: '100%',

    height: '100%',
    justifyContent: 'space-between'
  },
  littleTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 24,
    color: '#fff'
  },
  nameValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
    color: '#fff'
  },
  organizationTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    color: '#fff'
  },
  topHeader: {
    flexDirection: 'column',
  },
  rightHeader: {
    width: '100%',
    maxWidth: 140,
    minHeight: '100%',
    backgroundColor: 'red'
  }
});