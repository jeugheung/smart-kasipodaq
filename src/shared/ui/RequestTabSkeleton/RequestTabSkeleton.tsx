import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native';

export const RequestTabSkeleton = () => {
  return (
    <>
      <View style={styles.card}>
        <View style={styles.icon} />

        <View style={styles.textContainer}>
          <View style={[styles.line, { width: '70%' }]} />
          <View style={[styles.line, { width: '90%', marginTop: 6 }]} />
        </View>

        <View style={styles.arrow} />
      </View>

      <View style={styles.card}>
        <View style={styles.icon} />

        <View style={styles.textContainer}>
          <View style={[styles.line, { width: '70%' }]} />
          <View style={[styles.line, { width: '90%', marginTop: 6 }]} />
        </View>

        <View style={styles.arrow} />
      </View>
    </>
  );
};

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 90,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    marginBottom: 10,
  },

  icon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E1E1E1',
    marginRight: 10,
  },

  textContainer: {
    flex: 1,
    marginRight: 10,
  },

  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E1E1E1',
  },

  arrow: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E1E1E1',
  },
});