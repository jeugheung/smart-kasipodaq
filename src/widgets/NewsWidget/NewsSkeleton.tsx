import React from 'react';
import { View, StyleSheet } from 'react-native';

export const NewsSkeleton = () => {
  return (
    <View style={styles.newsWidget}>
      {/* SectionHeader */}
      <View style={styles.header}>
        <View style={styles.title} />
        <View style={styles.action} />
      </View>

      {/* Horizontal cards */}
      <View style={styles.listWrapper}>
        <View style={styles.list}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.card} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  newsWidget: {
    minHeight: 170,
    gap: 10,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    width: 110,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#EDEDED',
  },

  action: {
    width: 50,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#EDEDED',
  },

  listWrapper: {
    marginRight: -15,
  },

  list: {
    flexDirection: 'row',
    gap: 10,
  
  },

  card: {
    width: 220,          // под NewsCard
    height: 120,
    borderRadius: 12,
    backgroundColor: '#EDEDED',
  },
});