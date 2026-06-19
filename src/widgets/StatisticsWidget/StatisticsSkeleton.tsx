import React from 'react';
import { View, StyleSheet } from 'react-native';

export const StatisticsSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.cardsRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={styles.card}>
            <View style={styles.image} />
            <View style={styles.value} />
          </View>
        ))}
      </View>

      <View style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: '#F2F2F2',
    padding: 10,
  },

  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 72,
  },

  card: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },

  image: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    backgroundColor: '#EDEDED',
  },

  value: {
    width: 28,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#EDEDED',
  },

  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EDEDED',
  },
});