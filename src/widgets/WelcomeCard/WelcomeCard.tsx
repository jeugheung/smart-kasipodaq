import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const WelcomeCard = () => {
  return (
    <LinearGradient
      colors={['#0054A6', '#003d7a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.content}>
        <View>
          <Text style={styles.littleTitle}>Добро пожаловать</Text>
          <Text style={styles.nameValue}>Пользователь</Text>
        </View>

        <View>
          <Text style={styles.littleTitle}>Организация</Text>
          <Text style={styles.organizationTitle}>
            Профсоюз “Парасат”
          </Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Статус:</Text>
        <Text style={styles.statusValue}>Активен</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 160,
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',

    shadowColor: '#0054A6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 120,
  },

  littleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },

  nameValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },

  organizationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },

  statusCard: {
    position: 'absolute',
    right: 18,
    top: 56,

    width: 105,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 16,

    alignItems: 'center',
    justifyContent: 'center',
  },

  statusTitle: {
    fontWeight: '800',
    fontSize: 13,
    color: '#fff',
  },

  statusValue: {
    fontWeight: '800',
    fontSize: 13,
    color: '#fff',
    marginTop: 2,
  },
});